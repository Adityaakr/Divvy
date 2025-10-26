import Constants from 'expo-constants';

// ASI Agent configuration
const config = {
  enabled: true, // Enable ASI agent features
  defaultThresholdAPR: 3.0, // Minimum APR to suggest savings
  minTTL: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
  rpcUrl: Constants.expoConfig?.extra?.EXPO_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
  chainId: Constants.expoConfig?.extra?.EXPO_PUBLIC_BASE_SEPOLIA_CHAIN_ID || '84532',
};

export interface YieldOpportunity {
  protocol: string;
  token: string;
  apr: number;
  tvl: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  contractAddress: string;
  description: string;
}

export interface SavingsPosition {
  id: string;
  protocol: string;
  token: string;
  amount: number;
  apr: number;
  depositedAt: number;
  lastYield: number;
  totalYield: number;
  status: 'ACTIVE' | 'WITHDRAWING' | 'WITHDRAWN';
}

export interface AgentRecommendation {
  type: 'ENABLE_SAVINGS' | 'WITHDRAW_SAVINGS' | 'REBALANCE' | 'HOLD';
  title: string;
  description: string;
  reasoning: string;
  confidence: number; // 0-100
  actions: AgentAction[];
  crossChainPlan?: CrossChainPlan;
}

export interface AgentAction {
  type: 'DEPOSIT' | 'WITHDRAW' | 'APPROVE' | 'BRIDGE' | 'SWAP';
  protocol: string;
  token: string;
  amount: number;
  estimatedGas: string;
  estimatedTime: string;
  executable: boolean;
}

export interface CrossChainPlan {
  fromChain: string;
  toChain: string;
  bridgeProtocol: string;
  estimatedTime: string;
  estimatedCost: string;
  executable: boolean;
  demoOnly: boolean;
}

export interface GroupAnalytics {
  groupId: string;
  totalPot: number;
  averageTTL: number;
  claimFrequency: number;
  refundRate: number;
  lastActivity: number;
}

class ASIAgent {
  private yieldOpportunities: YieldOpportunity[] = [
    {
      protocol: 'Aave V3',
      token: 'PYUSD',
      apr: 4.2,
      tvl: 1250000,
      riskLevel: 'LOW',
      contractAddress: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
      description: 'Lending PYUSD on Aave V3 Base Sepolia',
    },
    {
      protocol: 'Compound V3',
      token: 'PYUSD',
      apr: 3.8,
      tvl: 890000,
      riskLevel: 'LOW',
      contractAddress: '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
      description: 'Supply PYUSD to Compound V3',
    },
    {
      protocol: 'Yearn V3',
      token: 'PYUSD',
      apr: 5.1,
      tvl: 450000,
      riskLevel: 'MEDIUM',
      contractAddress: '0x1234567890123456789012345678901234567890',
      description: 'PYUSD Vault with automated yield strategies',
    },
  ];

  private savingsPositions: SavingsPosition[] = [];

  // Analyze group for savings opportunities
  async analyzeGroup(analytics: GroupAnalytics): Promise<AgentRecommendation> {
    const { totalPot, averageTTL, claimFrequency, refundRate } = analytics;
    
    // Deterministic policy logic
    const avgTTLHours = averageTTL / (60 * 60 * 1000);
    const bestOpportunity = this.getBestYieldOpportunity();
    
    // Decision logic
    if (avgTTLHours >= 2 && bestOpportunity.apr > config.defaultThresholdAPR && refundRate < 0.3) {
      return this.generateEnableSavingsRecommendation(totalPot, bestOpportunity, analytics);
    } else if (claimFrequency > 0.7 || refundRate > 0.5) {
      return this.generateWithdrawRecommendation(analytics);
    } else {
      return this.generateHoldRecommendation(analytics);
    }
  }

  private generateEnableSavingsRecommendation(
    amount: number,
    opportunity: YieldOpportunity,
    analytics: GroupAnalytics
  ): AgentRecommendation {
    const projectedYield = (amount * opportunity.apr / 100) * (analytics.averageTTL / (365 * 24 * 60 * 60 * 1000));
    
    return {
      type: 'ENABLE_SAVINGS',
      title: 'Enable Savings Mode',
      description: `Earn ${opportunity.apr}% APR on your group pot`,
      reasoning: `Group has ${(analytics.averageTTL / (60 * 60 * 1000)).toFixed(1)}h average TTL and low refund rate (${(analytics.refundRate * 100).toFixed(1)}%). Projected yield: $${projectedYield.toFixed(2)}`,
      confidence: 85,
      actions: [
        {
          type: 'APPROVE',
          protocol: opportunity.protocol,
          token: 'PYUSD',
          amount: amount,
          estimatedGas: '45000',
          estimatedTime: '30s',
          executable: true,
        },
        {
          type: 'DEPOSIT',
          protocol: opportunity.protocol,
          token: 'PYUSD',
          amount: amount,
          estimatedGas: '120000',
          estimatedTime: '1m',
          executable: true,
        },
      ],
    };
  }

  private generateWithdrawRecommendation(analytics: GroupAnalytics): AgentRecommendation {
    return {
      type: 'WITHDRAW_SAVINGS',
      title: 'Withdraw from Savings',
      description: 'High claim/refund activity detected',
      reasoning: `Group shows high claim frequency (${(analytics.claimFrequency * 100).toFixed(1)}%) or refund rate (${(analytics.refundRate * 100).toFixed(1)}%). Withdraw to ensure liquidity.`,
      confidence: 92,
      actions: [
        {
          type: 'WITHDRAW',
          protocol: 'Aave V3',
          token: 'PYUSD',
          amount: 0, // Will be filled with actual position amount
          estimatedGas: '95000',
          estimatedTime: '45s',
          executable: true,
        },
      ],
    };
  }

  private generateHoldRecommendation(analytics: GroupAnalytics): AgentRecommendation {
    return {
      type: 'HOLD',
      title: 'Hold Current Position',
      description: 'Current strategy is optimal',
      reasoning: `Group metrics don't strongly favor savings or withdrawal. Average TTL: ${(analytics.averageTTL / (60 * 60 * 1000)).toFixed(1)}h, Refund rate: ${(analytics.refundRate * 100).toFixed(1)}%`,
      confidence: 70,
      actions: [],
    };
  }

  // Get best yield opportunity
  getBestYieldOpportunity(): YieldOpportunity {
    return this.yieldOpportunities.reduce((best, current) => 
      current.apr > best.apr ? current : best
    );
  }

  // Get all yield opportunities
  getYieldOpportunities(): YieldOpportunity[] {
    return [...this.yieldOpportunities];
  }

  // Deposit to savings
  async depositToSavings(
    protocol: string,
    token: string,
    amount: number
  ): Promise<SavingsPosition> {
    const opportunity = this.yieldOpportunities.find(
      op => op.protocol === protocol && op.token === token
    );
    
    if (!opportunity) {
      throw new Error(`No opportunity found for ${protocol} ${token}`);
    }
    
    const position: SavingsPosition = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      protocol,
      token,
      amount,
      apr: opportunity.apr,
      depositedAt: Date.now(),
      lastYield: 0,
      totalYield: 0,
      status: 'ACTIVE',
    };
    
    this.savingsPositions.push(position);
    
    // Simulate deposit transaction
    console.log(`Depositing ${amount} ${token} to ${protocol}`);
    
    return position;
  }

  // Withdraw from savings
  async withdrawFromSavings(positionId: string): Promise<void> {
    const position = this.savingsPositions.find(p => p.id === positionId);
    if (!position) {
      throw new Error('Position not found');
    }
    
    position.status = 'WITHDRAWING';
    
    // Simulate withdrawal
    setTimeout(() => {
      position.status = 'WITHDRAWN';
    }, 2000);
    
    console.log(`Withdrawing from position ${positionId}`);
  }

  // Get user's savings positions
  getSavingsPositions(): SavingsPosition[] {
    return [...this.savingsPositions];
  }

  // Update yield for positions (called periodically)
  updateYield(): void {
    const now = Date.now();
    
    this.savingsPositions.forEach(position => {
      if (position.status === 'ACTIVE') {
        const timeElapsed = now - Math.max(position.depositedAt, position.lastYield || position.depositedAt);
        const yieldEarned = (position.amount * position.apr / 100) * (timeElapsed / (365 * 24 * 60 * 60 * 1000));
        
        position.totalYield += yieldEarned;
        position.lastYield = now;
      }
    });
  }

  // Generate cross-chain plan (stub for now)
  generateCrossChainPlan(
    fromChain: string,
    toChain: string,
    token: string,
    amount: number
  ): CrossChainPlan {
    return {
      fromChain,
      toChain,
      bridgeProtocol: 'LayerZero',
      estimatedTime: '5-10 minutes',
      estimatedCost: '$2.50',
      executable: false,
      demoOnly: true,
    };
  }

  // Calculate group analytics from expenses and settlements
  calculateGroupAnalytics(
    groupId: string,
    expenses: any[],
    settlements: any[]
  ): GroupAnalytics {
    const now = Date.now();
    const totalPot = expenses.reduce((sum, exp) => sum + exp.total, 0);
    
    // Calculate average TTL from settlements
    const activeTTLs = settlements
      .filter(s => s.status === 'PENDING')
      .map(s => s.deadline - s.createdAt);
    const averageTTL = activeTTLs.length > 0 
      ? activeTTLs.reduce((sum, ttl) => sum + ttl, 0) / activeTTLs.length
      : 24 * 60 * 60 * 1000; // Default 24 hours
    
    // Calculate claim frequency and refund rate
    const totalSettlements = settlements.length;
    const claimedSettlements = settlements.filter(s => s.status === 'CLAIMED').length;
    const refundedSettlements = settlements.filter(s => s.status === 'REFUNDED').length;
    
    const claimFrequency = totalSettlements > 0 ? claimedSettlements / totalSettlements : 0;
    const refundRate = totalSettlements > 0 ? refundedSettlements / totalSettlements : 0;
    
    const lastActivity = Math.max(
      ...expenses.map(e => e.timestamp),
      ...settlements.map(s => s.createdAt),
      0
    );
    
    return {
      groupId,
      totalPot,
      averageTTL,
      claimFrequency,
      refundRate,
      lastActivity,
    };
  }
}

// Create singleton instance
export const asiAgent = new ASIAgent();

// Start yield update interval
setInterval(() => {
  asiAgent.updateYield();
}, 60000); // Update every minute

export default asiAgent;
