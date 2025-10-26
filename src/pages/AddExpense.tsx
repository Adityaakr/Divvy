import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function AddExpense() {
  const navigate = useNavigate();
  const { groups } = useStore();
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-foreground mb-6">Add Expense</h1>
        
        {groups.length === 0 ? (
          <div className="bg-card rounded-xl p-8 text-center border border-border">
            <p className="text-muted-foreground mb-4">Create a group first</p>
            <Button onClick={() => navigate('/')}>Go to Groups</Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              Select a group to add an expense
            </p>
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => navigate(`/group/${group.id}`)}
                className="w-full bg-card rounded-lg p-4 border border-border hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{group.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {group.members.length} members
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
