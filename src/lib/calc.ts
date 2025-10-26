import { Expense, Address } from './store';

export interface Balance {
  member: Address;
  amount: number; // positive = they are owed, negative = they owe
}

export interface Transfer {
  from: Address;
  to: Address;
  amount: number;
}

/**
 * Calculate net balances for all members in a group
 */
export function calculateBalances(expenses: Expense[], members: Address[]): Balance[] {
  const balanceMap = new Map<Address, number>();
  
  // Initialize all members with 0 balance
  members.forEach(member => balanceMap.set(member, 0));
  
  // Process each expense
  expenses.forEach(expense => {
    const { payer, splits } = expense;
    
    // Payer gets credited for the total amount they paid
    balanceMap.set(payer, (balanceMap.get(payer) || 0) + expense.total);
    
    // Each person in the split gets debited for their share
    splits.forEach(split => {
      balanceMap.set(split.member, (balanceMap.get(split.member) || 0) - split.amount);
    });
  });
  
  return Array.from(balanceMap.entries()).map(([member, amount]) => ({
    member,
    amount: Math.round(amount * 100) / 100 // Round to 2 decimals
  }));
}

/**
 * Calculate minimal set of transfers to settle all debts
 * Uses a greedy algorithm to minimize number of transactions
 */
export function calculateSettlements(balances: Balance[]): Transfer[] {
  const transfers: Transfer[] = [];
  
  // Separate creditors (owed money) and debtors (owe money)
  const creditors = balances.filter(b => b.amount > 0.01).sort((a, b) => b.amount - a.amount);
  const debtors = balances.filter(b => b.amount < -0.01).sort((a, b) => a.amount - b.amount);
  
  let i = 0, j = 0;
  
  while (i < creditors.length && j < debtors.length) {
    const creditor = { ...creditors[i] };
    const debtor = { ...debtors[j] };
    
    const transferAmount = Math.min(creditor.amount, Math.abs(debtor.amount));
    
    if (transferAmount > 0.01) {
      transfers.push({
        from: debtor.member,
        to: creditor.member,
        amount: Math.round(transferAmount * 100) / 100
      });
    }
    
    creditors[i].amount -= transferAmount;
    debtors[j].amount += transferAmount;
    
    if (creditors[i].amount < 0.01) i++;
    if (Math.abs(debtors[j].amount) < 0.01) j++;
  }
  
  return transfers;
}

/**
 * Format currency amount
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Format address (truncate)
 */
export function formatAddress(address: Address): string {
  if (address.startsWith('0x') && address.length === 42) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
  return address.length > 20 ? `${address.slice(0, 17)}...` : address;
}

/**
 * Generate a simple ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
