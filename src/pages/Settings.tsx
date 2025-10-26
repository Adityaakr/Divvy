import { useStore } from '@/lib/store';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Wallet, Download, Upload, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export default function Settings() {
  const { 
    connectedAddress, 
    setConnectedAddress, 
    mockMode, 
    setMockMode,
    groups,
    expenses,
    settlements,
    clearAllData,
  } = useStore();
  const { toast } = useToast();
  const [addressInput, setAddressInput] = useState('');
  
  const handleConnect = () => {
    if (!addressInput.trim()) {
      toast({ title: 'Enter an address', variant: 'destructive' });
      return;
    }
    setConnectedAddress(addressInput.trim());
    toast({ title: 'Connected!', description: addressInput.trim() });
  };
  
  const handleDisconnect = () => {
    setConnectedAddress(null);
    setAddressInput('');
    toast({ title: 'Disconnected' });
  };
  
  const handleExport = () => {
    const data = { groups, expenses, settlements };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `splitsafe-export-${Date.now()}.json`;
    a.click();
    toast({ title: 'Data exported!' });
  };
  
  const handleClearData = () => {
    if (confirm('Clear all groups, expenses, and settlements?')) {
      clearAllData();
      toast({ title: 'All data cleared' });
    }
  };
  
  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure your wallet and app preferences
          </p>
        </div>
        
        {/* Wallet */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-primary/10 rounded-lg p-2">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Wallet</h2>
              <p className="text-sm text-muted-foreground">Connect your address</p>
            </div>
          </div>
          
          {connectedAddress ? (
            <div className="space-y-3">
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">Connected</p>
                <p className="font-mono text-sm break-all">{connectedAddress}</p>
              </div>
              <Button onClick={handleDisconnect} variant="outline" className="w-full">
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="0x... or identifier"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
              />
              <Button onClick={handleConnect} className="w-full">
                Connect
              </Button>
            </div>
          )}
        </div>
        
        {/* Mock Mode */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">Mock Mode</Label>
              <p className="text-sm text-muted-foreground">
                Simulate blockchain transactions for demos
              </p>
            </div>
            <Switch checked={mockMode} onCheckedChange={setMockMode} />
          </div>
        </div>
        
        {/* Data */}
        <div className="bg-card rounded-xl p-6 border border-border space-y-3">
          <h3 className="text-lg font-semibold text-foreground mb-3">Data Management</h3>
          
          <Button onClick={handleExport} variant="outline" className="w-full gap-2">
            <Download className="h-4 w-4" />
            Export Data (JSON)
          </Button>
          
          <Button onClick={handleClearData} variant="destructive" className="w-full">
            Clear All Data
          </Button>
        </div>
        
        {/* About */}
        <div className="bg-card rounded-xl p-6 border border-border">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 rounded-lg p-2">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                About SplitSafe
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A Splitwise-style expense splitting dapp with PYUSD escrow settlements. 
                Recipients claim within a time window, or senders can refund after expiry.
              </p>
              <p className="text-xs text-muted-foreground mt-3">Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}
