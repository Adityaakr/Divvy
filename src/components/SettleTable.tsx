import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Transfer } from '@/lib/calc';
import { formatCurrency, formatAddress, generateId } from '@/lib/calc';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
import EscrowDialog from './EscrowDialog';

interface SettleTableProps {
  transfers: Transfer[];
  groupId: string;
}

export default function SettleTable({ transfers, groupId }: SettleTableProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [escrowDialogOpen, setEscrowDialogOpen] = useState(false);
  const [currentTransfer, setCurrentTransfer] = useState<Transfer | null>(null);
  const { connectedAddress } = useStore();
  const { toast } = useToast();
  
  if (transfers.length === 0) {
    return (
      <div className="bg-card rounded-xl p-8 text-center border border-border">
        <div className="bg-success/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">✓</span>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Nothing to settle</h3>
        <p className="text-sm text-muted-foreground">All balances are zero</p>
      </div>
    );
  }
  
  const handleToggle = (index: number) => {
    const newSelected = new Set(selected);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelected(newSelected);
  };
  
  const handleSettleSelected = () => {
    if (selected.size === 0) {
      toast({ title: 'Select at least one transfer', variant: 'destructive' });
      return;
    }
    
    const firstIndex = Array.from(selected)[0];
    setCurrentTransfer(transfers[firstIndex]);
    setEscrowDialogOpen(true);
  };
  
  const handleEscrowComplete = () => {
    setSelected(new Set());
    setCurrentTransfer(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {transfers.map((transfer, index) => {
          const isMyTransfer = connectedAddress === transfer.from;
          
          return (
            <div
              key={index}
              className="bg-card rounded-lg p-4 border border-border"
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selected.has(index)}
                  onCheckedChange={() => handleToggle(index)}
                  disabled={!isMyTransfer}
                />
                
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {formatAddress(transfer.from)}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">
                    {formatAddress(transfer.to)}
                  </span>
                </div>
                
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(transfer.amount)}
                </span>
              </div>
              
              {!isMyTransfer && (
                <p className="text-xs text-muted-foreground mt-2 ml-8">
                  Only the payer can settle this
                </p>
              )}
            </div>
          );
        })}
      </div>
      
      <Button
        onClick={handleSettleSelected}
        disabled={selected.size === 0}
        className="w-full"
        size="lg"
      >
        Create Escrow ({selected.size} selected)
      </Button>
      
      {currentTransfer && (
        <EscrowDialog
          open={escrowDialogOpen}
          onOpenChange={setEscrowDialogOpen}
          transfer={currentTransfer}
          groupId={groupId}
          onComplete={handleEscrowComplete}
        />
      )}
    </div>
  );
}
