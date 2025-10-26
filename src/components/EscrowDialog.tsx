import { useState } from 'react';
import { Transfer } from '@/lib/calc';
import { formatCurrency, formatAddress, generateId } from '@/lib/calc';
import { useStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EscrowDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transfer: Transfer;
  groupId: string;
  onComplete: () => void;
}

export default function EscrowDialog({
  open,
  onOpenChange,
  transfer,
  groupId,
  onComplete,
}: EscrowDialogProps) {
  const { addSettlement, mockMode } = useStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [ttl, setTtl] = useState('120');
  
  const handleCreateEscrow = async () => {
    setLoading(true);
    
    try {
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const ttlSec = parseInt(ttl);
      const now = Date.now();
      
      const settlement = {
        id: generateId(),
        groupId,
        from: transfer.from,
        to: transfer.to,
        amount: transfer.amount,
        escrowId: mockMode ? `mock-${generateId()}` : undefined,
        txHash: mockMode ? `0x${Math.random().toString(16).slice(2, 66)}` : undefined,
        status: 'PENDING' as const,
        ttlSec,
        createdAt: now,
        deadline: now + (ttlSec * 1000),
      };
      
      addSettlement(settlement);
      
      toast({
        title: 'Escrow created!',
        description: mockMode 
          ? `Mock escrow created with ${ttlSec}s TTL` 
          : 'Transaction submitted to blockchain',
      });
      
      onComplete();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Failed to create escrow',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create PYUSD Escrow</DialogTitle>
          <DialogDescription>
            Recipient can claim within the TTL window, or you can refund after expiry
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">From</span>
              <span className="font-medium">{formatAddress(transfer.from)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">To</span>
              <span className="font-medium">{formatAddress(transfer.to)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
              <span>Amount</span>
              <span className="text-primary">{formatCurrency(transfer.amount)}</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="ttl">Time to Live (seconds)</Label>
            <Input
              id="ttl"
              type="number"
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              placeholder="120"
            />
            <p className="text-xs text-muted-foreground">
              Recipient must claim within this time, or you can refund
            </p>
          </div>
          
          <Button
            onClick={handleCreateEscrow}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Escrow...
              </>
            ) : (
              'Create Escrow'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
