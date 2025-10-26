import React, { createContext, useContext, useState, ReactNode } from 'react';

// Mock Privy types and interfaces
interface MockPrivyUser {
  id: string;
  wallet?: {
    address: string;
  };
  linked_accounts: Array<{
    type: 'email' | 'wallet';
    address: string;
    verified_at?: number;
  }>;
}

interface MockPrivyContextType {
  user: MockPrivyUser | null;
  authenticated: boolean;
  ready: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  connectWallet: () => Promise<void>;
}

const MockPrivyContext = createContext<MockPrivyContextType | undefined>(undefined);

interface MockPrivyProviderProps {
  appId: string;
  children: ReactNode;
}

export function MockPrivyProvider({ appId, children }: MockPrivyProviderProps) {
  const [user, setUser] = useState<MockPrivyUser | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [ready, setReady] = useState(true);

  const login = async () => {
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: MockPrivyUser = {
      id: 'mock_user_' + Date.now(),
      wallet: {
        address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
      },
      linked_accounts: [
        {
          type: 'email',
          address: 'demo@splitsafe.app',
          verified_at: Date.now(),
        },
        {
          type: 'wallet',
          address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
          verified_at: Date.now(),
        },
      ],
    };
    
    setUser(mockUser);
    setAuthenticated(true);
  };

  const logout = async () => {
    setUser(null);
    setAuthenticated(false);
  };

  const connectWallet = async () => {
    // Simulate wallet connection
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (user) {
      setUser({
        ...user,
        wallet: {
          address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
        },
      });
    }
  };

  const value: MockPrivyContextType = {
    user,
    authenticated,
    ready,
    login,
    logout,
    connectWallet,
  };

  return (
    <MockPrivyContext.Provider value={value}>
      {children}
    </MockPrivyContext.Provider>
  );
}

export function usePrivy(): MockPrivyContextType {
  const context = useContext(MockPrivyContext);
  if (context === undefined) {
    throw new Error('usePrivy must be used within a MockPrivyProvider');
  }
  return context;
}

// Export for compatibility
export const PrivyProvider = MockPrivyProvider;
