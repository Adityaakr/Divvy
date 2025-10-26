import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useSmartWallet } from '../lib/smartwallet/SmartWalletProvider';

interface BiometricLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const BiometricLoginButton: React.FC<BiometricLoginButtonProps> = ({
  onSuccess,
  onError,
}) => {
  const { account, isAuthenticated, isLoading, createAccount, authenticate } = useSmartWallet();
  const [biometricType, setBiometricType] = useState<string>('');

  React.useEffect(() => {
    checkBiometricType();
  }, []);

  const checkBiometricType = async () => {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        setBiometricType('Face ID');
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        setBiometricType('Fingerprint');
      } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        setBiometricType('Iris');
      } else {
        setBiometricType('Biometric');
      }
    } catch (error) {
      setBiometricType('Biometric');
    }
  };

  const handlePress = async () => {
    try {
      let success = false;

      if (!account) {
        // Create new account
        success = await createAccount();
      } else if (!isAuthenticated) {
        // Authenticate existing account
        success = await authenticate();
      } else {
        // Already authenticated
        success = true;
      }

      if (success) {
        onSuccess?.();
      } else {
        onError?.('Authentication failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      onError?.(error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Creating Wallet...';
    if (!account) return 'Login';
    if (!isAuthenticated) return 'Login';
    return 'Wallet Ready';
  };

  const getIcon = () => {
    if (isLoading) return null;
    if (biometricType === 'Face ID') return 'scan-outline';
    if (biometricType === 'Fingerprint') return 'finger-print-outline';
    return 'shield-checkmark-outline';
  };

  const getButtonStyle = () => {
    if (isAuthenticated) return [styles.button, styles.buttonSuccess];
    return styles.button;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={isLoading || isAuthenticated}
      activeOpacity={0.8}
    >
      <View style={styles.buttonContent}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" style={styles.icon} />
        ) : (
          <Ionicons name={getIcon() as any} size={24} color="#FFFFFF" style={styles.icon} />
        )}
        <Text style={styles.buttonText}>{getButtonText()}</Text>
      </View>
      
      {account && (
        <View style={styles.walletInfo}>
          <Text style={styles.walletAddress}>
            {account.address.slice(0, 6)}...{account.address.slice(-4)}
          </Text>
          <View style={[styles.statusDot, { backgroundColor: isAuthenticated ? '#10B981' : '#EF4444' }]} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonSuccess: {
    backgroundColor: '#10B981',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  walletAddress: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
    fontFamily: 'monospace',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default BiometricLoginButton;
