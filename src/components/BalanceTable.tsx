import { Balance } from '@/lib/calc';
import { formatCurrency, formatAddress } from '@/lib/calc';

interface BalanceTableProps {
  balances: Balance[];
}

export default function BalanceTable({ balances }: BalanceTableProps) {
  const sortedBalances = [...balances].sort((a, b) => b.amount - a.amount);
  
  if (balances.every(b => Math.abs(b.amount) < 0.01)) {
    return (
      <div className="bg-card rounded-xl p-8 text-center border border-border">
        <div className="bg-success/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">All settled up!</h3>
        <p className="text-sm text-muted-foreground">Everyone is square</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {sortedBalances.map((balance) => {
        if (Math.abs(balance.amount) < 0.01) return null;
        
        const isOwed = balance.amount > 0;
        const color = isOwed ? 'text-success' : 'text-destructive';
        const bgColor = isOwed ? 'bg-success/10' : 'bg-destructive/10';
        const label = isOwed ? 'is owed' : 'owes';
        
        return (
          <div
            key={balance.member}
            className={`${bgColor} rounded-lg p-4 border border-border`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-foreground mb-1">
                  {formatAddress(balance.member)}
                </p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
              <span className={`text-xl font-bold ${color}`}>
                {formatCurrency(Math.abs(balance.amount))}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
