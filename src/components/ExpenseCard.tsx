import { Receipt } from 'lucide-react';
import { Expense } from '@/lib/store';
import { formatCurrency, formatAddress } from '@/lib/calc';

interface ExpenseCardProps {
  expense: Expense;
}

export default function ExpenseCard({ expense }: ExpenseCardProps) {
  const date = new Date(expense.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  
  return (
    <div className="bg-card rounded-lg p-4 border border-border">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 rounded-lg p-2">
          <Receipt className="h-5 w-5 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground mb-1">{expense.title}</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Paid by {formatAddress(expense.payer)}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{date}</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(expense.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
