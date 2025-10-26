import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { calculateBalances, calculateSettlements } from '@/lib/calc';
import BottomNav from '@/components/BottomNav';
import MetricsRibbon from '@/components/MetricsRibbon';
import ExpenseCard from '@/components/ExpenseCard';
import BalanceTable from '@/components/BalanceTable';
import SettleTable from '@/components/SettleTable';
import AddExpenseDialog from '@/components/AddExpenseDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { getGroupById, getExpensesByGroup, getGroupMetrics } = useStore();
  
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  
  const group = groupId ? getGroupById(groupId) : undefined;
  const expenses = groupId ? getExpensesByGroup(groupId) : [];
  const metrics = groupId ? getGroupMetrics(groupId) : { escrowed: 0, claimed: 0, refunded: 0 };
  
  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Group not found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }
  
  const balances = calculateBalances(expenses, group.members);
  const settlements = calculateSettlements(balances);
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 border-b border-border">
          <div className="px-4 py-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-3"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <h1 className="text-2xl font-bold text-foreground">{group.name}</h1>
            <p className="text-sm text-muted-foreground">{group.members.length} members</p>
          </div>
        </div>
        
        <div className="px-4 py-6 space-y-6">
          {/* Metrics */}
          <MetricsRibbon {...metrics} />
          
          {/* Tabs */}
          <Tabs defaultValue="balances" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="balances">Balances</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="settle">Settle</TabsTrigger>
            </TabsList>
            
            <TabsContent value="balances" className="mt-4">
              <BalanceTable balances={balances} />
            </TabsContent>
            
            <TabsContent value="expenses" className="mt-4 space-y-4">
              <Button
                onClick={() => setAddExpenseOpen(true)}
                className="w-full gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
              
              {expenses.length === 0 ? (
                <div className="bg-card rounded-xl p-8 text-center border border-border">
                  <p className="text-muted-foreground">No expenses yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {[...expenses].reverse().map((expense) => (
                    <ExpenseCard key={expense.id} expense={expense} />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="settle" className="mt-4">
              <SettleTable transfers={settlements} groupId={group.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <AddExpenseDialog
        open={addExpenseOpen}
        onOpenChange={setAddExpenseOpen}
        group={group}
      />
      
      <BottomNav />
    </div>
  );
}
