import { useState } from 'react';
import { ExternalLink, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatAddress } from '@/lib/calc';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type FilterStatus = 'ALL' | 'PENDING' | 'CLAIMED' | 'REFUNDED';

export default function Receipts() {
  const { settlements, updateSettlement, mockMode } = useStore();
  const { toast } = useToast();
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  
  const filtered = settlements.filter(s => 
    filter === 'ALL' || s.status === filter
  );
  
  const handleClaim = async (settlementId: string) => {
    toast({ title: 'Processing claim...' });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateSettlement(settlementId, {
      status: 'CLAIMED',
      txHash: mockMode ? `0x${Math.random().toString(16).slice(2, 66)}` : undefined,
    });
    
    toast({ title: 'Successfully claimed!' });
  };
  
  const handleRefund = async (settlementId: string) => {
    toast({ title: 'Processing refund...' });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    updateSettlement(settlementId, {
      status: 'REFUNDED',
      txHash: mockMode ? `0x${Math.random().toString(16).slice(2, 66)}` : undefined,
    });
    
    toast({ title: 'Successfully refunded!' });
  };
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">Receipts</h1>
        
        {/* Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['ALL', 'PENDING', 'CLAIMED', 'REFUNDED'] as FilterStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-foreground border border-border'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        
        {/* Receipts */}
        {filtered.length === 0 ? (
          <div className="bg-card rounded-xl p-8 text-center border border-border">
            <p className="text-muted-foreground">No receipts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...filtered].reverse().map((settlement) => {
              const now = Date.now();
              const isExpired = now > settlement.deadline;
              const timeLeft = Math.max(0, settlement.deadline - now);
              const secondsLeft = Math.floor(timeLeft / 1000);
              
              let statusIcon;
              let statusColor;
              let statusBg;
              
              if (settlement.status === 'PENDING') {
                statusIcon = <Clock className="h-4 w-4" />;
                statusColor = 'text-accent';
                statusBg = 'bg-accent/10';
              } else if (settlement.status === 'CLAIMED') {
                statusIcon = <CheckCircle2 className="h-4 w-4" />;
                statusColor = 'text-success';
                statusBg = 'bg-success/10';
              } else {
                statusIcon = <XCircle className="h-4 w-4" />;
                statusColor = 'text-warning';
                statusBg = 'bg-warning/10';
              }
              
              return (
                <div key={settlement.id} className="bg-card rounded-lg p-4 border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`${statusBg} rounded-lg px-2.5 py-1 flex items-center gap-1.5`}>
                          {statusIcon}
                          <span className={`text-xs font-semibold ${statusColor}`}>
                            {settlement.status}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-1">
                        <span className="font-medium text-foreground">
                          {formatAddress(settlement.from)}
                        </span>
                        {' → '}
                        <span className="font-medium text-foreground">
                          {formatAddress(settlement.to)}
                        </span>
                      </p>
                      
                      {settlement.status === 'PENDING' && !isExpired && (
                        <p className="text-xs text-muted-foreground">
                          Expires in {secondsLeft}s
                        </p>
                      )}
                      
                      {settlement.status === 'PENDING' && isExpired && (
                        <p className="text-xs text-warning">Expired - Can refund</p>
                      )}
                    </div>
                    
                    <span className="text-lg font-bold text-primary">
                      {formatCurrency(settlement.amount)}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    {settlement.txHash && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          toast({ title: 'Opening explorer...' });
                          // In production: window.open(`https://explorer.com/tx/${settlement.txHash}`)
                        }}
                      >
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Explorer
                      </Button>
                    )}
                    
                    {settlement.status === 'PENDING' && !isExpired && (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleClaim(settlement.id)}
                      >
                        Claim Now
                      </Button>
                    )}
                    
                    {settlement.status === 'PENDING' && isExpired && (
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleRefund(settlement.id)}
                      >
                        Refund
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
