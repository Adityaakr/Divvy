import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Address = string;

export interface Group {
  id: string;
  name: string;
  members: Address[];
  createdAt: number;
}

export interface Expense {
  id: string;
  groupId: string;
  title: string;
  payer: Address;
  total: number;
  splits: { member: Address; amount: number }[];
  timestamp: number;
}

export type SettlementStatus = 'PENDING' | 'CLAIMED' | 'REFUNDED';

export interface Settlement {
  id: string;
  groupId: string;
  from: Address;
  to: Address;
  amount: number;
  escrowId?: string;
  txHash?: string;
  status: SettlementStatus;
  ttlSec: number;
  createdAt: number;
  deadline: number;
}

export interface Metrics {
  escrowed: number;
  claimed: number;
  refunded: number;
}

interface AppState {
  // Wallet
  connectedAddress: Address | null;
  mockMode: boolean;
  
  // Data
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
  
  // Actions
  setConnectedAddress: (address: Address | null) => void;
  setMockMode: (enabled: boolean) => void;
  
  addGroup: (group: Group) => void;
  addExpense: (expense: Expense) => void;
  addSettlement: (settlement: Settlement) => void;
  updateSettlement: (id: string, updates: Partial<Settlement>) => void;
  
  getGroupById: (id: string) => Group | undefined;
  getExpensesByGroup: (groupId: string) => Expense[];
  getSettlementsByGroup: (groupId: string) => Settlement[];
  
  getGlobalMetrics: () => Metrics;
  getGroupMetrics: (groupId: string) => Metrics;
  
  clearAllData: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      connectedAddress: null,
      mockMode: true as boolean,
      groups: [],
      expenses: [],
      settlements: [],
      
      setConnectedAddress: (address) => set({ connectedAddress: address }),
      setMockMode: (enabled) => set({ mockMode: enabled }),
      
      addGroup: (group) => set((state) => ({ groups: [...state.groups, group] })),
      
      addExpense: (expense) => set((state) => ({ expenses: [...state.expenses, expense] })),
      
      addSettlement: (settlement) => set((state) => ({ settlements: [...state.settlements, settlement] })),
      
      updateSettlement: (id, updates) => set((state) => ({
        settlements: state.settlements.map((s) => s.id === id ? { ...s, ...updates } : s)
      })),
      
      getGroupById: (id) => get().groups.find((g) => g.id === id),
      
      getExpensesByGroup: (groupId) => get().expenses.filter((e) => e.groupId === groupId),
      
      getSettlementsByGroup: (groupId) => get().settlements.filter((s) => s.groupId === groupId),
      
      getGlobalMetrics: () => {
        const settlements = get().settlements;
        return settlements.reduce((acc, s) => {
          if (s.status === 'PENDING') acc.escrowed += s.amount;
          if (s.status === 'CLAIMED') acc.claimed += s.amount;
          if (s.status === 'REFUNDED') acc.refunded += s.amount;
          return acc;
        }, { escrowed: 0, claimed: 0, refunded: 0 });
      },
      
      getGroupMetrics: (groupId) => {
        const settlements = get().getSettlementsByGroup(groupId);
        return settlements.reduce((acc, s) => {
          if (s.status === 'PENDING') acc.escrowed += s.amount;
          if (s.status === 'CLAIMED') acc.claimed += s.amount;
          if (s.status === 'REFUNDED') acc.refunded += s.amount;
          return acc;
        }, { escrowed: 0, claimed: 0, refunded: 0 });
      },
      
      clearAllData: () => set({ groups: [], expenses: [], settlements: [] }),
    }),
    {
      name: 'splitsafe-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
