import { useState } from 'react';
import { Group } from '@/lib/store';
import { useStore } from '@/lib/store';
import { generateId, formatAddress } from '@/lib/calc';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface AddExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group;
}

export default function AddExpenseDialog({ open, onOpenChange, group }: AddExpenseDialogProps) {
  const { addExpense, connectedAddress } = useStore();
  const { toast } = useToast();
  
  const [title, setTitle] = useState('');
  const [total, setTotal] = useState('');
  const [payer, setPayer] = useState(connectedAddress || group.members[0]);
  const [splitMode, setSplitMode] = useState<'equal' | 'custom'>('equal');
  const [customSplits, setCustomSplits] = useState<Record<string, string>>({});
  
  const handleSubmit = () => {
    if (!title.trim()) {
      toast({ title: 'Title required', variant: 'destructive' });
      return;
    }
    
    const totalAmount = parseFloat(total);
    if (isNaN(totalAmount) || totalAmount <= 0) {
      toast({ title: 'Invalid total amount', variant: 'destructive' });
      return;
    }
    
    let splits;
    if (splitMode === 'equal') {
      const perPerson = totalAmount / group.members.length;
      splits = group.members.map(member => ({
        member,
        amount: Math.round(perPerson * 100) / 100
      }));
    } else {
      splits = group.members.map(member => ({
        member,
        amount: parseFloat(customSplits[member] || '0')
      }));
      
      const splitTotal = splits.reduce((sum, s) => sum + s.amount, 0);
      if (Math.abs(splitTotal - totalAmount) > 0.01) {
        toast({ 
          title: 'Split amounts must equal total', 
          description: `Split total: $${splitTotal.toFixed(2)}, Expected: $${totalAmount.toFixed(2)}`,
          variant: 'destructive' 
        });
        return;
      }
    }
    
    const expense = {
      id: generateId(),
      groupId: group.id,
      title,
      payer,
      total: totalAmount,
      splits,
      timestamp: Date.now(),
    };
    
    addExpense(expense);
    toast({ title: 'Expense added successfully!' });
    
    setTitle('');
    setTotal('');
    setCustomSplits({});
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Description</Label>
            <Input
              id="title"
              placeholder="Dinner, Uber, etc."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="total">Total Amount ($)</Label>
            <Input
              id="total"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="payer">Paid By</Label>
            <Select value={payer} onValueChange={setPayer}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {group.members.map((member) => (
                  <SelectItem key={member} value={member}>
                    {formatAddress(member)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Split Mode</Label>
            <Select value={splitMode} onValueChange={(v: any) => setSplitMode(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equal">Equal Split</SelectItem>
                <SelectItem value="custom">Custom Amounts</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {splitMode === 'custom' && (
            <div className="space-y-2">
              <Label>Custom Split Amounts</Label>
              {group.members.map((member) => (
                <div key={member} className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground flex-1">
                    {formatAddress(member)}
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-24"
                    value={customSplits[member] || ''}
                    onChange={(e) => setCustomSplits({
                      ...customSplits,
                      [member]: e.target.value
                    })}
                  />
                </div>
              ))}
            </div>
          )}
          
          <Button onClick={handleSubmit} className="w-full">
            Add Expense
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
