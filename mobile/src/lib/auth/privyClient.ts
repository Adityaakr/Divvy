import { PrivyProvider } from '@privy-io/expo';
import Constants from 'expo-constants';

// Get Privy App ID from environment
const PRIVY_APP_ID = Constants.expoConfig?.extra?.EXPO_PUBLIC_PRIVY_APP_ID || 'cmh7ao9bf009tjy0cs74zy2j4';

export const privyConfig = {
  appId: PRIVY_APP_ID,
  // Web-specific configuration
  config: {
    loginMethods: ['email', 'wallet'],
    appearance: { 
      theme: 'light' as const, 
      accentColor: '#007AFF',
      logo: undefined,
    },
    embeddedWallets: {
      createOnLogin: 'users-without-wallets' as const,
      requireUserPasswordOnCreate: false,
    },
    // Ensure proper domain configuration for web
    allowedOrigins: [
      'http://localhost:8090',
      'http://localhost:3000', 
      'http://127.0.0.1:8090',
      'http://127.0.0.1:3000',
    ],
  },
};

// Auth utility functions
export interface AuthUser {
  id: string;
  email?: string;
  wallet?: {
    address: string;
    chainType: string;
  };
  linkedAccounts: Array<{
    type: string;
    address?: string;
    email?: string;
  }>;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

// Helper functions for auth operations
export const authHelpers = {
  // Get primary wallet address
  getPrimaryAddress: (user: any): string | null => {
    if (!user) return null;
    
    // Try embedded wallet first
    if (user.wallet?.address) {
      return user.wallet.address;
    }
    
    // Try linked wallet accounts (Privy format)
    const walletAccount = user.linked_accounts?.find(
      (account: any) => account.type === 'wallet' && account.address
    );
    
    return walletAccount?.address || null;
  },

  // Get user display name
  getDisplayName: (user: any): string => {
    if (!user) return 'Anonymous';
    
    // Try email from linked accounts
    const emailAccount = user.linked_accounts?.find(
      (account: any) => account.type === 'email'
    );
    
    if (emailAccount?.address) {
      return emailAccount.address.split('@')[0];
    }
    
    const address = authHelpers.getPrimaryAddress(user);
    if (address) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
    
    return `User ${user.id.slice(0, 8)}`;
  },

  // Format address for display
  formatAddress: (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  },

  // Check if user has wallet
  hasWallet: (user: any): boolean => {
    return !!authHelpers.getPrimaryAddress(user);
  },
};

// Export the provider component
export { PrivyProvider };

// Default export for easy importing
export default {
  config: privyConfig,
  helpers: authHelpers,
};
