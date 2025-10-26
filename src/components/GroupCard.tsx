import { Link } from 'react-router-dom';
import { Users, ChevronRight } from 'lucide-react';
import { Group } from '@/lib/store';
import { formatCurrency } from '@/lib/calc';

interface GroupCardProps {
  group: Group;
  netBalance: number;
}

export default function GroupCard({ group, netBalance }: GroupCardProps) {
  const balanceColor = netBalance > 0 ? 'text-success' : netBalance < 0 ? 'text-destructive' : 'text-muted-foreground';
  const balanceText = netBalance > 0 ? 'You are owed' : netBalance < 0 ? 'You owe' : 'Settled up';
  
  return (
    <Link to={`/group/${group.id}`}>
      <div className="bg-card rounded-xl p-4 shadow-sm border border-border hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-1">{group.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{group.members.length} members</span>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground mt-1" />
        </div>
        
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{balanceText}</span>
            <span className={`text-base font-bold ${balanceColor}`}>
              {formatCurrency(Math.abs(netBalance))}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
