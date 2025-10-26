import Constants from 'expo-constants';

// ASI API Configuration
const ASI_API_KEY = 'sk_780fa8ee1bbd42df972bc4b6d6025d1234091a3f4113459c81218786ebe8036b';
const ASI_BASE_URL = 'https://api.asi.finance/v1';

export type VolLevel = "LOW" | "MID" | "HIGH";

export interface VolatilitySample {
  ts: number;               // epoch secs
  value: number;            // 0..100 index
  source: "oracle" | "mock" | "asi";
  recencySec: number;
}

export interface MarketData {
  symbol: string;
  price: number;
  volatility24h: number;
  volatility7d: number;
  timestamp: number;
}

class VolatilityOracle {
  private lastSample: VolatilitySample | null = null;
  private mockVolatility = 45; // Starting mock value
  private mockDirection = 1;

  // Fetch real volatility from ASI API
  async fetchASIVolatility(): Promise<VolatilitySample> {
    try {
      const response = await fetch(`${ASI_BASE_URL}/market/volatility`, {
        headers: {
          'Authorization': `Bearer ${ASI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`ASI API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Convert ASI volatility data to our format
      const volatilityIndex = Math.min(100, Math.max(0, data.volatility * 100));
      
      return {
        ts: Math.floor(Date.now() / 1000),
        value: Math.round(volatilityIndex),
        source: "asi",
        recencySec: 0, // Fresh data
      };
    } catch (error) {
      console.warn('ASI API unavailable, falling back to mock:', error);
      return this.fetchMockVolatility();
    }
  }

  // Mock volatility that changes realistically
  fetchMockVolatility(): VolatilitySample {
    // Simulate realistic volatility movement
    const change = (Math.random() - 0.5) * 10; // ±5 points
    this.mockVolatility += change * this.mockDirection;
    
    // Bounce off boundaries
    if (this.mockVolatility > 90) {
      this.mockDirection = -1;
      this.mockVolatility = 90;
    } else if (this.mockVolatility < 10) {
      this.mockDirection = 1;
      this.mockVolatility = 10;
    }
    
    // Add some randomness to direction changes
    if (Math.random() < 0.1) {
      this.mockDirection *= -1;
    }

    return {
      ts: Math.floor(Date.now() / 1000),
      value: Math.round(Math.max(0, Math.min(100, this.mockVolatility))),
      source: "mock",
      recencySec: Math.floor(Math.random() * 10), // 0-10 seconds old
    };
  }

  // Main fetch function with fallback
  async fetchVolatility(): Promise<VolatilitySample> {
    const useASI = Constants.expoConfig?.extra?.EXPO_PUBLIC_SAVINGS_ENABLED === 'true';
    
    let sample: VolatilitySample;
    
    if (useASI) {
      sample = await this.fetchASIVolatility();
    } else {
      sample = this.fetchMockVolatility();
    }
    
    this.lastSample = sample;
    return sample;
  }

  // Get volatility level from value
  getVolatilityLevel(value: number, lastLevel?: VolLevel): VolLevel {
    const THRESH_LOW = 30;
    const THRESH_HIGH = 70;
    const HYSTERESIS = { up: 35, down: 65 };

    // Base level without hysteresis
    const baseLevel: VolLevel =
      value < THRESH_LOW ? "LOW" :
      value > THRESH_HIGH ? "HIGH" : "MID";

    // Apply hysteresis to prevent flapping
    if (lastLevel === "LOW" && value < HYSTERESIS.up) return "LOW";
    if (lastLevel === "HIGH" && value > HYSTERESIS.down) return "HIGH";
    
    return baseLevel;
  }

  // Get the last fetched sample
  getLastSample(): VolatilitySample | null {
    return this.lastSample;
  }

  // Calculate confidence score based on volatility and recency
  calculateConfidence(sample: VolatilitySample, level: VolLevel): number {
    const THRESH_LOW = 30;
    const THRESH_HIGH = 70;
    
    // Distance from threshold (higher = more confident)
    const dist = level === "LOW" ? (THRESH_LOW - sample.value) : 
                 level === "HIGH" ? (sample.value - THRESH_HIGH) : 0;
    
    // Recency penalty (older data = less confident)
    const recencyPenalty = sample.recencySec / 120; // Max 2 minutes
    
    // Base confidence + distance bonus - recency penalty
    const confidence = Math.max(0, Math.min(1, 0.5 + dist/100 - recencyPenalty));
    
    return Number(confidence.toFixed(2));
  }

  // Get market data for multiple assets (if ASI supports it)
  async getMarketData(symbols: string[] = ['PYUSD', 'USDC', 'ETH']): Promise<MarketData[]> {
    try {
      const response = await fetch(`${ASI_BASE_URL}/market/data`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ASI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols }),
      });

      if (!response.ok) {
        throw new Error(`ASI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.markets || [];
    } catch (error) {
      console.warn('ASI market data unavailable, using mock data:', error);
      
      // Return mock market data
      return symbols.map(symbol => ({
        symbol,
        price: Math.random() * 2000 + 1000, // Mock price
        volatility24h: Math.random() * 0.5, // 0-50% volatility
        volatility7d: Math.random() * 1.0, // 0-100% volatility
        timestamp: Date.now(),
      }));
    }
  }
}

// Create singleton instance
export const volatilityOracle = new VolatilityOracle();

export default volatilityOracle;
