import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
// Removed Privy dependency for clean demo
import { authHelpers } from '../lib/auth/privyClient';
import { generatePaymentLink, estimateGas } from '../lib/payments/qrUtils';

export default function PaymentRequestScreen({ navigation, route }: any) {
  // Mock user for demo
  const user = {
    wallet: { address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4' },
    linked_accounts: [
      { type: 'wallet', address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4' }
    ]
  };
  const { groupId, expenseId } = route.params || {};
  
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('PYUSD');
  const [memo, setMemo] = useState('');
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const connectedAddress = authHelpers.getPrimaryAddress(user);

  useEffect(() => {
    if (amount && toAddress) {
      updateGasEstimate();
    }
  }, [amount, toAddress, token]);

  const updateGasEstimate = async () => {
    if (!amount || !toAddress) return;
    
    setIsLoading(true);
    try {
      const estimate = await estimateGas(toAddress, parseFloat(amount), token);
      setGasEstimate(estimate);
    } catch (error) {
      console.error('Gas estimation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generatePaymentQR = () => {
    if (!toAddress || !amount) return '';
    
    return generatePaymentLink({
      to: toAddress,
      amount: parseFloat(amount),
      token,
      memo,
      groupId,
      expenseId,
    });
  };

  const handleShare = async () => {
    if (!toAddress || !amount) {
      Alert.alert('Error', 'Please enter recipient address and amount');
      return;
    }

    try {
      const paymentLink = generatePaymentLink({
        to: toAddress,
        amount: parseFloat(amount),
        token,
        memo,
        groupId,
        expenseId,
      });

      const message = `Payment Request: $${amount} ${token}\n\nTo: ${authHelpers.formatAddress(toAddress)}\n${memo ? `For: ${memo}\n` : ''}\nTotal with gas: ${gasEstimate?.totalCostUSD ? `$${gasEstimate.totalCostUSD}` : 'Calculating...'}\n\nPay with SplitSafe: ${paymentLink}`;

      await Share.share({
        message,
        title: 'SplitSafe Payment Request',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share payment request');
    }
  };

  const handleScanQR = () => {
    // This would open a QR scanner
    Alert.alert('QR Scanner', 'QR code scanner would open here');
  };

  const paymentQR = generatePaymentQR();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment Request</Text>
        <TouchableOpacity onPress={handleScanQR} style={styles.scanButton}>
          <Ionicons name="qr-code-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Recipient Address */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Recipient Address</Text>
          <View style={styles.addressInputContainer}>
            <TextInput
              style={styles.addressInput}
              value={toAddress}
              onChangeText={setToAddress}
              placeholder="0x... or ENS name"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={handleScanQR} style={styles.scanIconButton}>
              <Ionicons name="qr-code-outline" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />
            <View style={styles.tokenSelector}>
              <Text style={styles.tokenText}>{token}</Text>
            </View>
          </View>
        </View>

        {/* Memo Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Memo (Optional)</Text>
          <TextInput
            style={styles.memoInput}
            value={memo}
            onChangeText={setMemo}
            placeholder="What's this payment for?"
            multiline
          />
        </View>

        {/* Gas Estimate */}
        {gasEstimate && (
          <View style={styles.gasEstimateContainer}>
            <Text style={styles.gasEstimateTitle}>Fee Preview</Text>
            <View style={styles.gasEstimateRow}>
              <Text style={styles.gasEstimateLabel}>Gas Fee:</Text>
              <Text style={styles.gasEstimateValue}>≈ ${gasEstimate.gasCostUSD}</Text>
            </View>
            <View style={styles.gasEstimateRow}>
              <Text style={styles.gasEstimateLabel}>Total Cost:</Text>
              <Text style={[styles.gasEstimateValue, styles.totalCost]}>
                ${gasEstimate.totalCostUSD}
              </Text>
            </View>
          </View>
        )}

        {/* QR Code */}
        {paymentQR && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Payment QR Code</Text>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={paymentQR}
                size={180}
                backgroundColor="white"
                color="black"
              />
            </View>
            <Text style={styles.qrSubtitle}>
              Scan with any wallet or SplitSafe app
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            onPress={handleShare} 
            style={[styles.shareButton, (!toAddress || !amount) && styles.disabledButton]}
            disabled={!toAddress || !amount}
          >
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
            <Text style={styles.shareButtonText}>Share Payment Request</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How payment requests work:</Text>
          <Text style={styles.instructionText}>
            • Share the QR code or payment link with the payer
          </Text>
          <Text style={styles.instructionText}>
            • They can scan the QR or tap the link to open a prefilled payment
          </Text>
          <Text style={styles.instructionText}>
            • Gas fees are estimated and shown before confirmation
          </Text>
          <Text style={styles.instructionText}>
            • Payments are processed on-chain for security
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  scanButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  addressInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 16,
    fontFamily: 'monospace',
  },
  scanIconButton: {
    padding: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    paddingVertical: 16,
  },
  tokenSelector: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tokenText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  memoInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  gasEstimateContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  gasEstimateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  gasEstimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  gasEstimateLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  gasEstimateValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  totalCost: {
    fontSize: 16,
    color: '#1F2937',
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  qrCodeWrapper: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionButtons: {
    marginBottom: 32,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  instructionsContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});
