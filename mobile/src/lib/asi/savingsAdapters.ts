import { SavingsAdapter, SavingsPosition } from './savingsPolicy';
import Constants from 'expo-constants';

// Mock Aave V3 Base adapter
class AaveV3BaseAdapter implements SavingsAdapter {
  readonly name = "AaveV3Base" as const;
  readonly supportsBorrow = true;
  readonly isExecutable: boolean;

  constructor() {
    // Check if we're in executable mode or demo mode
    this.isExecutable = Constants.expoConfig?.extra?.EXPO_PUBLIC_SAVINGS_ADAPTER === 'AaveV3Base' &&
                       Constants.expoConfig?.extra?.EXPO_PUBLIC_NETWORK !== 'mock';
  }

  async readPosition(addr: string): Promise<SavingsPosition> {
    // In a real implementation, this would call Aave contracts
    // For now, we'll simulate a position
    
    const mockPositions: Record<string, SavingsPosition> = {
      // Default position for demo
      default: {
        deposited: "1000.00",
        borrowed: "50.00",
        leverage: 1.05,
        healthFactor: 4.2,
        apy: 4.8,
        netWorth: 950.00,
      }
    };

    // Use address-specific position or default
    const position = mockPositions[addr] || mockPositions.default;
    
    // Add some randomness to make it feel live
    const randomFactor = 0.95 + Math.random() * 0.1; // ±5%
    
    return {
      ...position,
      deposited: (parseFloat(position.deposited) * randomFactor).toFixed(2),
      borrowed: (parseFloat(position.borrowed) * randomFactor).toFixed(2),
      leverage: Number((position.leverage * randomFactor).toFixed(3)),
      healthFactor: position.healthFactor ? Number((position.healthFactor * randomFactor).toFixed(2)) : undefined,
      apy: Number((position.apy * randomFactor).toFixed(2)),
      netWorth: position.netWorth * randomFactor,
    };
  }

  async buildBorrowAndLoop(targetLev: number): Promise<{calls: {to:string;data:string}[]} | null> {
    if (!this.isExecutable) return null;

    // Mock transaction calls for borrow and loop
    const calls = [
      {
        to: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", // Aave V3 Pool
        data: "0x69328dec0000000000000000000000006c3ea9036406852006290770bedfcaba0e23a0e8" // borrow PYUSD
      },
      {
        to: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // PYUSD token
        data: "0xa9059cbb00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2" // transfer to pool
      },
      {
        to: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", // Aave V3 Pool
        data: "0x617ba037000000000000000000000000000000000000000000000000000000000000000" // supply more PYUSD
      }
    ];

    return { calls };
  }

  async buildRepayAndUnwind(): Promise<{calls: {to:string;data:string}[]} | null> {
    if (!this.isExecutable) return null;

    // Mock transaction calls for repay and unwind
    const calls = [
      {
        to: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", // Aave V3 Pool
        data: "0x69328dec0000000000000000000000006c3ea9036406852006290770bedfcaba0e23a0e8" // withdraw some collateral
      },
      {
        to: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8", // PYUSD token
        data: "0xa9059cbb00000000000000000000000087870bca3f3fd6335c3f4ce8392d69350b4fa4e2" // transfer for repay
      },
      {
        to: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2", // Aave V3 Pool
        data: "0x573ade81000000000000000000000000000000000000000000000000000000000000000" // repay debt
      }
    ];

    return { calls };
  }

  // Get current Aave rates and data
  async getProtocolData() {
    return {
      supplyAPY: 4.2 + Math.random() * 0.5, // 4.2-4.7%
      borrowAPY: 5.8 + Math.random() * 0.3, // 5.8-6.1%
      utilizationRate: 0.75 + Math.random() * 0.1, // 75-85%
      totalSupply: 125000000 + Math.random() * 10000000, // ~125M PYUSD
      totalBorrow: 93750000 + Math.random() * 7500000, // ~94M PYUSD
      liquidationThreshold: 0.85,
      ltv: 0.80,
    };
  }
}

// Mock Compound V3 adapter
class CompoundV3Adapter implements SavingsAdapter {
  readonly name = "CompoundV3" as const;
  readonly supportsBorrow = true;
  readonly isExecutable = false; // Demo only for now

  async readPosition(addr: string): Promise<SavingsPosition> {
    return {
      deposited: "800.00",
      borrowed: "0.00",
      leverage: 1.00,
      healthFactor: undefined, // Compound doesn't use health factor
      apy: 3.8,
      netWorth: 800.00,
    };
  }

  async buildBorrowAndLoop(targetLev: number): Promise<{calls: {to:string;data:string}[]} | null> {
    return null; // Demo mode
  }

  async buildRepayAndUnwind(): Promise<{calls: {to:string;data:string}[]} | null> {
    return null; // Demo mode
  }
}

// Mock Yearn V3 adapter
class YearnV3Adapter implements SavingsAdapter {
  readonly name = "YearnV3" as const;
  readonly supportsBorrow = false; // Yearn doesn't support borrowing
  readonly isExecutable = false; // Demo only

  async readPosition(addr: string): Promise<SavingsPosition> {
    return {
      deposited: "1200.00",
      borrowed: "0.00",
      leverage: 1.00,
      healthFactor: undefined,
      apy: 5.1,
      netWorth: 1200.00,
    };
  }

  async buildBorrowAndLoop(targetLev: number): Promise<{calls: {to:string;data:string}[]} | null> {
    return null; // Not supported
  }

  async buildRepayAndUnwind(): Promise<{calls: {to:string;data:string}[]} | null> {
    return null; // Not supported
  }
}

// Adapter factory
export class AdapterFactory {
  static createAdapter(name: string): SavingsAdapter {
    switch (name) {
      case 'AaveV3Base':
        return new AaveV3BaseAdapter();
      case 'CompoundV3':
        return new CompoundV3Adapter();
      case 'YearnV3':
        return new YearnV3Adapter();
      default:
        return new AaveV3BaseAdapter(); // Default to Aave
    }
  }

  static getAvailableAdapters(): SavingsAdapter[] {
    return [
      new AaveV3BaseAdapter(),
      new CompoundV3Adapter(),
      new YearnV3Adapter(),
    ];
  }
}

// Export default adapter based on config
export const defaultAdapter = AdapterFactory.createAdapter(
  Constants.expoConfig?.extra?.EXPO_PUBLIC_SAVINGS_ADAPTER || 'AaveV3Base'
);

export default {
  AdapterFactory,
  defaultAdapter,
  AaveV3BaseAdapter,
  CompoundV3Adapter,
  YearnV3Adapter,
};
