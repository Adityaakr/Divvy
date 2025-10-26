import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { calculateBalances } from '@/lib/calc';
import BottomNav from '@/components/BottomNav';
import MetricsRibbon from '@/components/MetricsRibbon';
import GroupCard from '@/components/GroupCard';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { generateId } from '@/lib/calc';
import { useToast } from '@/hooks/use-toast';

export default function Index() {
  const { groups, addGroup, connectedAddress, expenses, getExpensesByGroup } = useStore();
  const { getGlobalMetrics } = useStore();
  const metrics = getGlobalMetrics();
  const { toast } = useToast();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberAddresses, setMemberAddresses] = useState('');
  
  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast({ title: 'Group name required', variant: 'destructive' });
      return;
    }
    
    const members = memberAddresses
      .split(',')
      .map(addr => addr.trim())
      .filter(Boolean);
    
    if (members.length === 0) {
      toast({ title: 'Add at least one member', variant: 'destructive' });
      return;
    }
    
    // Add connected address if not already included
    if (connectedAddress && !members.includes(connectedAddress)) {
      members.unshift(connectedAddress);
    }
    
    const newGroup = {
      id: generateId(),
      name: groupName,
      members,
      createdAt: Date.now(),
    };
    
    addGroup(newGroup);
    toast({ title: 'Group created successfully!' });
    
    setGroupName('');
    setMemberAddresses('');
    setDialogOpen(false);
  };
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Split<span className="text-primary">Safe</span>
          </h1>
          <p className="text-muted-foreground">
            Split bills. Settle with PYUSD. Claim or refund safely.
          </p>
        </div>
        
        {/* Metrics */}
        <div className="mb-6">
          <MetricsRibbon {...metrics} />
        </div>
        
        {/* Groups */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">My Groups</h2>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Group Name</Label>
                    <Input
                      id="name"
                      placeholder="Weekend Trip"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="members">Member Addresses</Label>
                    <Input
                      id="members"
                      placeholder="0x123..., 0x456..., alice@example.com"
                      value={memberAddresses}
                      onChange={(e) => setMemberAddresses(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated addresses or identifiers
                    </p>
                  </div>
                  <Button onClick={handleCreateGroup} className="w-full">
                    Create Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {groups.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center border border-border">
              <div className="bg-primary/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No groups yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first group to start splitting expenses
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groups.map((group) => {
                const groupExpenses = getExpensesByGroup(group.id);
                const balances = calculateBalances(groupExpenses, group.members);
                const myBalance = connectedAddress
                  ? balances.find(b => b.member === connectedAddress)?.amount || 0
                  : 0;
                
                return <GroupCard key={group.id} group={group} netBalance={myBalance} />;
              })}
            </div>
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
