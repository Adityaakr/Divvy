import { VolatilitySample, VolLevel } from './volatilityOracle';
import Constants from 'expo-constants';

export interface DecisionLog {
  id: string;               // uuid
  ts: number;
  volValue: number;
  volLevel: VolLevel;
  action: "BORROW_AND_LOOP" | "REPAY_AND_UNWIND" | "HOLD";
  targetLeverage: number;   // e.g., 1.00..1.10
  confidence: number;       // 0..1
  reason: string;           // <= 140 chars
  planOnly: boolean;        // true when adapter not executable (demo)
  txHash?: string;          // if executed
  blockscoutUrl?: string;   // link to transaction
}

export interface SavingsPosition {
  deposited: string;        // PYUSD 6d
  borrowed: string;         // stable debt 6d
  leverage: number;         // (deposited)/(net)
  healthFactor?: number;    // protocol specific
  apy: number;             // current APY
  netWorth: number;        // USD value
}

export interface SavingsAdapter {
  readonly name: "AaveV3Base" | "CompoundV3" | "YearnV3";
  supportsBorrow: boolean;
  isExecutable: boolean;    // false for demo mode
  readPosition(addr: string): Promise<SavingsPosition>;
  buildBorrowAndLoop(targetLev: number): Promise<{calls: {to:string;data:string}[]} | null>;
  buildRepayAndUnwind(): Promise<{calls: {to:string;data:string}[]} | null>;
}

// Configuration from environment
const config = {
  THRESH_LOW: 30,   // <30% → risk-on
  THRESH_HIGH: 70,  // >70% → risk-off
  HYSTERESIS: { up: 35, down: 65 },   // prevent flapping
  MAX_LEVERAGE: parseFloat(Constants.expoConfig?.extra?.EXPO_PUBLIC_SAVINGS_MAX_LEVERAGE || '1.10'),
  MIN_HEALTH: 1.8,                    // never drop below
  COOLDOWN_MIN: 10,                   // minutes between actions
};

// State tracking
let lastVolLevel: VolLevel | null = null;
let lastActionAt = 0;
let decisionHistory: DecisionLog[] = [];

class SavingsPolicy {
  
  // Main decision function
  async decideSavingsAction(
    addr: string,
    adapter: SavingsAdapter,
    vol: VolatilitySample
  ): Promise<DecisionLog> {
    const now = Math.floor(Date.now() / 1000);
    const since = (now - lastActionAt) / 60;
    
    let pos: SavingsPosition;
    try {
      pos = await adapter.readPosition(addr);
    } catch (error) {
      // If we can't read position, create a default one
      pos = {
        deposited: "0",
        borrowed: "0",
        leverage: 1.0,
        healthFactor: 999,
        apy: 4.2,
        netWorth: 0,
      };
    }

    // Derive level with hysteresis
    const baseLevel: VolLevel =
      vol.value < config.THRESH_LOW ? "LOW" :
      vol.value > config.THRESH_HIGH ? "HIGH" : "MID";

    let level = baseLevel;
    if (lastVolLevel === "LOW" && vol.value < config.HYSTERESIS.up) level = "LOW";
    if (lastVolLevel === "HIGH" && vol.value > config.HYSTERESIS.down) level = "HIGH";

    // Default HOLD
    let action: DecisionLog["action"] = "HOLD";
    let targetLev = pos.leverage;
    let reason = "Within band or cooldown; holding position";

    // Decision logic
    if (since < config.COOLDOWN_MIN) {
      action = "HOLD";
      reason = `Cooldown active (${Math.ceil(config.COOLDOWN_MIN - since)}m remaining)`;
    } else if (level === "LOW" && adapter.supportsBorrow && pos.leverage < config.MAX_LEVERAGE) {
      // Check health factor safety
      if (pos.healthFactor && pos.healthFactor > config.MIN_HEALTH * 1.2) {
        action = "BORROW_AND_LOOP";
        targetLev = Math.min(config.MAX_LEVERAGE, Math.max(1.02, pos.leverage + 0.03));
        reason = "Low vol; modest loop to boost APY";
      } else {
        action = "HOLD";
        reason = "Low vol but health factor too low for leverage";
      }
    } else if (level === "HIGH" && parseFloat(pos.borrowed) > 0) {
      action = "REPAY_AND_UNWIND";
      targetLev = 1.00;
      reason = "High vol; unwind to reduce risk";
    } else if (level === "LOW" && pos.leverage >= config.MAX_LEVERAGE) {
      action = "HOLD";
      reason = "Low vol but already at max leverage";
    }

    // Calculate confidence
    const dist = level === "LOW" ? (config.THRESH_LOW - vol.value) : 
                 level === "HIGH" ? (vol.value - config.THRESH_HIGH) : 0;
    const confidence = Math.max(0, Math.min(1, 0.5 + dist/100 - vol.recencySec/120));

    // Determine if this is plan-only
    const planOnly = !adapter.isExecutable || 
                     !adapter.supportsBorrow || 
                     level === "MID" ||
                     (pos.healthFactor !== undefined && pos.healthFactor <= config.MIN_HEALTH);

    const log: DecisionLog = {
      id: this.generateId(),
      ts: now,
      volValue: vol.value,
      volLevel: level,
      action,
      targetLeverage: Number(targetLev.toFixed(2)),
      confidence: Number(confidence.toFixed(2)),
      reason,
      planOnly
    };

    // Update state if action taken
    if (action !== "HOLD") {
      lastActionAt = now;
      lastVolLevel = level;
    }

    // Add to history
    decisionHistory.unshift(log);
    // Keep only last 50 decisions
    if (decisionHistory.length > 50) {
      decisionHistory = decisionHistory.slice(0, 50);
    }

    return log;
  }

  // Execute a decision
  async executeDecision(
    log: DecisionLog,
    adapter: SavingsAdapter
  ): Promise<{ mode: "PLAN_ONLY" | "EXECUTED" | "EXECUTED_SEQ" | "FAILED", txHash?: string, error?: string }> {
    if (log.planOnly || log.action === "HOLD") {
      return { mode: "PLAN_ONLY" };
    }

    try {
      const calls = log.action === "BORROW_AND_LOOP"
        ? await adapter.buildBorrowAndLoop(log.targetLeverage)
        : await adapter.buildRepayAndUnwind();

      if (!calls) {
        return { mode: "PLAN_ONLY" };
      }

      // Simulate execution (in real app, this would call the actual contracts)
      const txHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      // Update the log with execution details
      log.txHash = txHash;
      log.blockscoutUrl = this.generateBlockscoutUrl(txHash);

      // Simulate execution delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return { mode: "EXECUTED", txHash };
    } catch (error) {
      return { 
        mode: "FAILED", 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get decision history
  getDecisionHistory(): DecisionLog[] {
    return [...decisionHistory];
  }

  // Clear decision history
  clearDecisionHistory(): void {
    decisionHistory = [];
  }

  // Get current configuration
  getConfig() {
    return { ...config };
  }

  // Update configuration
  updateConfig(updates: Partial<typeof config>): void {
    Object.assign(config, updates);
  }

  // Generate unique ID
  private generateId(): string {
    return `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate Blockscout URL
  private generateBlockscoutUrl(txHash: string): string {
    const network = Constants.expoConfig?.extra?.EXPO_PUBLIC_NETWORK || 'base-sepolia';
    const baseUrls = {
      'base-sepolia': 'https://base-sepolia.blockscout.com',
      'polygon': 'https://polygon.blockscout.com',
      'mainnet': 'https://eth.blockscout.com',
    };
    
    const baseUrl = baseUrls[network as keyof typeof baseUrls] || baseUrls['base-sepolia'];
    return `${baseUrl}/tx/${txHash}`;
  }

  // Risk assessment for a given position
  assessRisk(position: SavingsPosition, volatility: number): {
    riskLevel: "LOW" | "MEDIUM" | "HIGH",
    factors: string[],
    recommendation: string
  } {
    const factors: string[] = [];
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";

    // Leverage risk
    if (position.leverage > 1.08) {
      factors.push("High leverage");
      riskLevel = "HIGH";
    } else if (position.leverage > 1.05) {
      factors.push("Moderate leverage");
      if (riskLevel === "LOW") riskLevel = "MEDIUM";
    }

    // Health factor risk
    if (position.healthFactor && position.healthFactor < 2.0) {
      factors.push("Low health factor");
      riskLevel = "HIGH";
    } else if (position.healthFactor && position.healthFactor < 3.0) {
      factors.push("Moderate health factor");
      if (riskLevel === "LOW") riskLevel = "MEDIUM";
    }

    // Volatility risk
    if (volatility > 70) {
      factors.push("High market volatility");
      riskLevel = "HIGH";
    } else if (volatility > 50) {
      factors.push("Moderate volatility");
      if (riskLevel === "LOW") riskLevel = "MEDIUM";
    }

    // Generate recommendation
    let recommendation: string;
    switch (riskLevel) {
      case "HIGH":
        recommendation = "Consider reducing leverage or unwinding position";
        break;
      case "MEDIUM":
        recommendation = "Monitor position closely, avoid increasing leverage";
        break;
      default:
        recommendation = "Position looks healthy, can consider modest leverage increase";
    }

    return { riskLevel, factors, recommendation };
  }
}

// Create singleton instance
export const savingsPolicy = new SavingsPolicy();

export default savingsPolicy;
