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
  bundlerUrl: process.env.EXPO_PUBLIC_BUNDLER_URL || 'https://eth-sepolia.g.alchemy.com/v2/Ttr4Yy-wi3x955XdNdqAFgPopLH47Owl',
  entryPointAddress: process.env.EXPO_PUBLIC_ENTRYPOINT_ADDRESS || '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
  factoryAddress: process.env.EXPO_PUBLIC_SMART_WALLET_FACTORY || '', // Will be set after deployment
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
  const [account, setAccount] = useState<SmartWalletAccount | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      // Check biometric availability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware) {
        // Fallback for web/simulator - create demo wallet
        Alert.alert(
          'Demo Mode',
          'Biometric authentication not available. Creating demo wallet for testing.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {} },
            { text: 'Continue', onPress: () => createDemoWallet() }
          ]
        );
        return false;
      }

      if (!isEnrolled) {
        Alert.alert('Setup Required', 'Please set up biometric authentication in your device settings');
        return false;
      }

      // Authenticate user
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Access your Divvy wallet',
        fallbackLabel: 'Use passcode',
        disableDeviceFallback: false,
      });

      if (!authResult.success) {
        Alert.alert('Authentication Failed', 'Biometric authentication required to access wallet');
        return false;
      }

      // Generate DETERMINISTIC credentials based on device identity
      const deviceId = await getDeviceIdentifier();
      const credentialId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `divvy-wallet-${deviceId}`,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      // Generate deterministic public key based on device
      const publicKey = await generateDeterministicPublicKey(deviceId);
      
      // Calculate smart wallet address (deterministic based on public key)
      const walletAddress = await calculateWalletAddress(publicKey);

      const newAccount: SmartWalletAccount = {
        address: walletAddress,
        publicKey,
        credentialId,
        isDeployed: false, // Will be deployed on first transaction
      };

      setAccount(newAccount);
      setIsAuthenticated(true);

      // In a real implementation, save to SecureStore
      console.log('Smart wallet account accessed:', newAccount);

      Alert.alert(
        'Wallet Ready! 🎉',
        `Welcome back to your Divvy wallet!\n\nAddress: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`,
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
      // Generate DETERMINISTIC demo credentials
      const demoDeviceId = 'demo-browser-device';
      const credentialId = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        `divvy-demo-wallet-${demoDeviceId}`,
        { encoding: Crypto.CryptoEncoding.HEX }
      );

      const publicKey = await generateDeterministicPublicKey(demoDeviceId);
      const walletAddress = await calculateWalletAddress(publicKey);

      const demoAccount: SmartWalletAccount = {
        address: walletAddress,
        publicKey,
        credentialId,
        isDeployed: false,
      };

      setAccount(demoAccount);
      setIsAuthenticated(true);

      Alert.alert(
        'Demo Wallet Ready! 🎉',
        `Your demo wallet is ready for testing!\n\nAddress: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}\n\nNote: This address will be the same every time in demo mode.`,
        [{ text: 'Continue', style: 'default' }]
      );
    } catch (error) {
      console.error('Error creating demo wallet:', error);
      Alert.alert('Error', 'Failed to create demo wallet');
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
