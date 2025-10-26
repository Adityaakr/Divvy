import { useState, useEffect, useCallback } from 'react';
import { pyusdService } from '../lib/blockchain/pyusdService';
import { useSmartWallet } from '../lib/smartwallet/SmartWalletProvider';

export interface PyusdBalanceState {
  balance: string;
  formattedBalance: string;
  isLoading: boolean;
  error: string | null;
  lastUpdated: number | null;
}

export function usePyusdBalance() {
  const { account, isAuthenticated } = useSmartWallet();
  const [state, setState] = useState<PyusdBalanceState>({
    balance: '0',
    formattedBalance: '0.00',
    isLoading: false,
    error: null,
    lastUpdated: null
  });

  const fetchBalance = useCallback(async () => {
    if (!account?.address || !isAuthenticated) {
      setState(prev => ({
        ...prev,
        balance: '0',
        formattedBalance: '0.00',
        isLoading: false,
        error: null
      }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('Fetching PYUSD balance for:', account.address);
      const balance = await pyusdService.getBalance(account.address);
      const formattedBalance = pyusdService.formatBalance(balance);

      setState({
        balance,
        formattedBalance,
        isLoading: false,
        error: null,
        lastUpdated: Date.now()
      });

      console.log('PYUSD Balance updated:', { balance, formattedBalance });
    } catch (error) {
      console.error('Failed to fetch PYUSD balance:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch balance'
      }));
    }
  }, [account?.address, isAuthenticated]);

  // Auto-fetch balance when wallet connects
  useEffect(() => {
    if (account?.address && isAuthenticated) {
      fetchBalance();
    }
  }, [account?.address, isAuthenticated, fetchBalance]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!account?.address || !isAuthenticated) return;

    const interval = setInterval(() => {
      fetchBalance();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [account?.address, isAuthenticated, fetchBalance]);

  const refreshBalance = useCallback(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    ...state,
    refreshBalance,
    hasBalance: parseFloat(state.balance) > 0
  };
}
