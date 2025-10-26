import React, { createContext, useContext, useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';

// Smart Wallet Types
export interface SmartWalletAccount {
  address: string;
  publicKey: string;
  credentialId: string;
  isDeployed: boolean;
}

export interface SmartWalletContextType {
  account: SmartWalletAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  createAccount: () => Promise<boolean>;
  authenticate: () => Promise<boolean>;
  signTransaction: (transaction: any) => Promise<string>;
  logout: () => void;
}

// Smart Wallet Configuration
const SMART_WALLET_CONFIG = {
  bundlerUrl: process.env.EXPO_PUBLIC_BUNDLER_URL || 'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr',
  entryPointAddress: process.env.EXPO_PUBLIC_ENTRYPOINT_ADDRESS || '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  factoryAddress: process.env.EXPO_PUBLIC_SMART_WALLET_FACTORY || '0x9406Cc6185a346906296840746125a0E44976454',
  deployedWalletAddress: '0x5A26514ce0AF943540407170B09ceA03cBFf5570', // Your EOA with 100 PYUSD (bypassing smart wallet complexity)
  ownerAddress: '0x5A26514ce0AF943540407170B09ceA03cBFf5570', // Your EOA that owns the smart wallet
  chainId: 11155111, // Ethereum Sepolia
};

const SmartWalletContext = createContext<SmartWalletContextType | null>(null);

export const useSmartWallet = () => {
  const context = useContext(SmartWalletContext);
  if (!context) {
    throw new Error('useSmartWallet must be used within SmartWalletProvider');
  }
  return context;
};

export const SmartWalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<SmartWalletAccount | null>({
    address: '0x5A26514ce0AF943540407170B09ceA03cBFf5570', // 
    publicKey: '13fe43fd722de13482745cd7315d4a1e37e184d1cff0e715a880aeccc5202a70', // Mock public key
    credentialId: '4f26dc0d9a21f0789f95e47fafad101359133c22b38f7382f7e6c6083f9f06ba', // Mock credential ID
    isDeployed: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Always authenticated for hybrid mode

  // Check for existing account on mount
  useEffect(() => {
    checkExistingAccount();
  }, []);

  const checkExistingAccount = async () => {
    try {
      // Check if biometric authentication is available
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        console.log('Biometric authentication not available - using demo mode');
        return;
      }

      // Try to load existing account from secure storage
      // In a real implementation, you'd use SecureStore
      // For now, we'll check if user has previously created an account
    } catch (error) {
      console.error('Error checking existing account:', error);
    }
  };

  const createAccount = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      // USE YOUR SMART WALLET THAT HAS THE 100 PYUSD
      const newAccount: SmartWalletAccount = {
        address: '0x9406Cc6185a346906296840746125a0E44976454', // YOUR SMART WALLET WITH 100 PYUSD
        publicKey: '13fe43fd722de13482745cd7315d4a1e37e184d1cff0e715a880aeccc5202a70',
        credentialId: '4f26dc0d9a21f0789f95e47fafad101359133c22b38f7382f7e6c6083f9f06ba',
        isDeployed: true,
      };

      setAccount(newAccount);
      setIsAuthenticated(true);

      console.log('DEPLOYED Smart wallet account accessed:', newAccount);

      Alert.alert(
        'Wallet Ready! 🎉',
        `Welcome back to your Divvy wallet!\n\nAddress: ${newAccount.address.slice(0, 6)}...${newAccount.address.slice(-4)}`,
        [{ text: 'Continue', style: 'default' }]
      );

      return true;
    } catch (error) {
      console.error('Error accessing account:', error);
      Alert.alert('Error', 'Failed to access wallet. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async (): Promise<boolean> => {
    if (!account) {
      return false;
    }

    try {
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Access your Divvy wallet',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      if (authResult.success) {
        setIsAuthenticated(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };

  const signTransaction = async (transaction: any): Promise<string> => {
    if (!isAuthenticated || !account) {
      throw new Error('Not authenticated');
    }

    // Authenticate for transaction signing
    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Sign transaction',
      fallbackLabel: 'Use passcode',
    });

    if (!authResult.success) {
      throw new Error('Authentication required for transaction');
    }

    // In a real implementation, this would:
    // 1. Create UserOperation
    // 2. Sign with passkey
    // 3. Submit to bundler
    // 4. Return transaction hash

    // For now, return mock signature
    return `0x${await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      JSON.stringify(transaction),
      { encoding: Crypto.CryptoEncoding.HEX }
    )}`;
  };

  const logout = () => {
    setAccount(null);
    setIsAuthenticated(false);
  };

  const createDemoWallet = async () => {
    try {
      // FORCE USE YOUR DEPLOYED SMART WALLET
      const demoAccount: SmartWalletAccount = {
        address: '0x9406Cc6185a346906296840746125a0E44976454', // HARDCODED YOUR DEPLOYED SMART WALLET
        publicKey: '13fe43fd722de13482745cd7315d4a1e37e184d1cff0e715a880aeccc5202a70',
        credentialId: '4f26dc0d9a21f0789f95e47fafad101359133c22b38f7382f7e6c6083f9f06ba',
        isDeployed: true,
      };

      setAccount(demoAccount);
      setIsAuthenticated(true);

      Alert.alert(
        'Smart Wallet Ready! 🎉',
        `Your deployed smart wallet is ready!\n\nAddress: 0x9406...6454\n\nThis is your real deployed smart wallet with 100 PYUSD!`,
        [{ text: 'Continue', style: 'default' }]
      );
    } catch (error) {
      console.error('Error creating smart wallet:', error);
      Alert.alert('Error', 'Failed to create smart wallet');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const getDeviceIdentifier = async (): Promise<string> => {
    // Create a deterministic device identifier
    // In a real implementation, this would use device-specific identifiers
    // For now, we'll use a combination of app name and a fixed seed
    const deviceSeed = 'divvy-mobile-app-v1';
    const identifier = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      deviceSeed,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    return identifier;
  };

  const generateDeterministicPublicKey = async (deviceId: string): Promise<string> => {
    // Generate a deterministic public key based on device ID
    // In a real implementation, this would use proper cryptographic key derivation
    const keyMaterial = `divvy-pubkey-${deviceId}`;
    const publicKey = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      keyMaterial,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    return publicKey;
  };

  const generateMockPublicKey = async (): Promise<string> => {
    // In a real implementation, this would be generated by WebAuthn
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const calculateWalletAddress = async (publicKey: string): Promise<string> => {
    // In a real implementation, this would calculate the CREATE2 address
    // based on the factory contract and public key
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      `factory-${SMART_WALLET_CONFIG.factoryAddress}-${publicKey}`,
      { encoding: Crypto.CryptoEncoding.HEX }
    );
    
    // Convert to Ethereum address format
    return `0x${hash.slice(-40)}`;
  };

  const contextValue: SmartWalletContextType = {
    account,
    isAuthenticated,
    isLoading,
    createAccount,
    authenticate,
    signTransaction,
    logout,
  };

  return (
    <SmartWalletContext.Provider value={contextValue}>
      {children}
    </SmartWalletContext.Provider>
  );
};
