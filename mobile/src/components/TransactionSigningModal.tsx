import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
// import { BlurView } from 'expo-blur'; // Commented out for now

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TransactionDetails {
  from: string;
  to: string;
  amount: string;
  token: string;
  gasEstimate?: string;
  networkFee?: string;
}

interface TransactionSigningModalProps {
  visible: boolean;
  onClose: () => void;
  onSign: () => Promise<{ success: boolean; transactionHash?: string; error?: string }>;
  transactionDetails: TransactionDetails;
}

export const TransactionSigningModal: React.FC<TransactionSigningModalProps> = ({
  visible,
  onClose,
  onSign,
  transactionDetails,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const [step, setStep] = useState<'review' | 'signing' | 'success' | 'error'>('review');
  const [error, setError] = useState<string | null>(null);

  const handleSign = async () => {
    setIsLoading(true);
    setStep('signing');
    
    try {
      const result = await onSign();
      
      if (result.success && result.transactionHash) {
        setTransactionHash(result.transactionHash);
        setStep('success');
      } else {
        setError(result.error || 'Transaction failed');
        setStep('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const openBlockscout = () => {
    if (transactionHash) {
      const url = `https://eth-sepolia.blockscout.com/tx/${transactionHash}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open Blockscout');
      });
    }
  };

  const openEtherscan = () => {
    if (transactionHash) {
      const url = `https://sepolia.etherscan.io/tx/${transactionHash}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open Etherscan');
      });
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const reset = () => {
    setStep('review');
    setTransactionHash(null);
    setError(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const renderReviewStep = () => (
    <View style={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Review Transaction</Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.transactionCard}>
        <View style={styles.tokenInfo}>
          <View style={styles.tokenIcon}>
            <Text style={styles.tokenSymbol}>💰</Text>
          </View>
          <View>
            <Text style={styles.amount}>{transactionDetails.amount} {transactionDetails.token}</Text>
            <Text style={styles.tokenName}>PayPal USD</Text>
          </View>
        </View>

        <View style={styles.divider} />

        
        <View style={styles.divider} />

        <View style={styles.networkSection}>
          <Text style={styles.networkTitle}>Network</Text>
          <View style={styles.networkInfo}>
            <View style={styles.networkDot} />
            <Text style={styles.networkName}>Ethereum Sepolia</Text>
          </View>
          {transactionDetails.gasEstimate && (
            <Text style={styles.gasEstimate}>Est. gas: {transactionDetails.gasEstimate}</Text>
          )}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.signButton} onPress={handleSign}>
          <Text style={styles.signButtonText}>Sign Transaction</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSigningStep = () => (
    <View style={styles.content}>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingTitle}>Signing Transaction</Text>
        <Text style={styles.loadingSubtitle}>Please wait while we process your transaction...</Text>
        
        <View style={styles.signingDetails}>
          <Text style={styles.signingStep}>🔐 Signing with Smart Wallet</Text>
          <Text style={styles.signingStep}>📡 Broadcasting to Sepolia network</Text>
          <Text style={styles.signingStep}>⏳ Waiting for confirmation</Text>
        </View>
      </View>
    </View>
  );

  const renderSuccessStep = () => (
    <View style={styles.content}>
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.successEmoji}>✅</Text>
        </View>
        <Text style={styles.successTitle}>Transaction Successful!</Text>
        <Text style={styles.successSubtitle}>
          Your {transactionDetails.amount} {transactionDetails.token} payment has been confirmed on the blockchain.
        </Text>

        {transactionHash && (
          <View style={styles.hashContainer}>
            <Text style={styles.hashLabel}>Transaction Hash</Text>
            <Text style={styles.hashValue}>{formatAddress(transactionHash)}</Text>
          </View>
        )}

        <View style={styles.explorerButtons}>
          <TouchableOpacity style={styles.explorerButton} onPress={openBlockscout}>
            <Text style={styles.explorerButtonText}>View on Blockscout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.explorerButtonSecondary} onPress={openEtherscan}>
            <Text style={styles.explorerButtonSecondaryText}>View on Etherscan</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.doneButton} onPress={handleClose}>
          <Text style={styles.doneButtonText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderErrorStep = () => (
    <View style={styles.content}>
      <View style={styles.errorContainer}>
        <View style={styles.errorIcon}>
          <Text style={styles.errorEmoji}>❌</Text>
        </View>
        <Text style={styles.errorTitle}>Transaction Failed</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
            <Text style={styles.cancelButtonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.retryButton} onPress={() => { reset(); handleSign(); }}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderContent = () => {
    switch (step) {
      case 'review':
        return renderReviewStep();
      case 'signing':
        return renderSigningStep();
      case 'success':
        return renderSuccessStep();
      case 'error':
        return renderErrorStep();
      default:
        return renderReviewStep();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={step === 'review' ? handleClose : undefined}
        />
        <Animated.View style={styles.modal}>
          {renderContent()}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#666',
  },
  transactionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  tokenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tokenIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tokenSymbol: {
    fontSize: 24,
  },
  amount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  tokenName: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e5e5',
    marginVertical: 16,
  },
  addressSection: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  address: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  networkSection: {
    marginTop: 8,
  },
  networkTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00C851',
    marginRight: 8,
  },
  networkName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  gasEstimate: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  signButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  signButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  signingDetails: {
    alignItems: 'flex-start',
  },
  signingStep: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successEmoji: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  hashContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  hashLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  hashValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  explorerButtons: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  explorerButton: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  explorerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  explorerButtonSecondary: {
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  explorerButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  doneButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#00C851',
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFE8E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorEmoji: {
    fontSize: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  retryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
