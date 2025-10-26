import { TrendingUp, CheckCircle2, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/calc';

interface MetricsRibbonProps {
  escrowed: number;
  claimed: number;
  refunded: number;
}

export default function MetricsRibbon({ escrowed, claimed, refunded }: MetricsRibbonProps) {
  const metrics = [
    { label: 'Escrowed', value: escrowed, icon: TrendingUp, color: 'text-accent' },
    { label: 'Claimed', value: claimed, icon: CheckCircle2, color: 'text-success' },
    { label: 'Refunded', value: refunded, icon: RefreshCw, color: 'text-warning' },
  ];
  
  return (
    <div className="grid grid-cols-3 gap-2">
      {metrics.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-card rounded-xl p-3 shadow-sm border border-border">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
          </div>
          <p className="text-lg font-bold text-foreground">{formatCurrency(value)}</p>
        </div>
      ))}
    </div>
  );
}
