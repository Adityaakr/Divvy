import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
// Removed Privy dependency for clean demo
import { authHelpers } from '../lib/auth/privyClient';
import { generateReceiveQR, generatePaymentLink } from '../lib/payments/qrUtils';

export default function ReceiveScreen({ navigation }: any) {
  // Mock user for demo
  const user = {
    wallet: { address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4' },
    linked_accounts: [
      { type: 'wallet', address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4' }
    ]
  };
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [token, setToken] = useState('PYUSD');
  const [network, setNetwork] = useState('Base Sepolia');

  const connectedAddress = authHelpers.getPrimaryAddress(user);

  if (!connectedAddress) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="wallet-outline" size={64} color="#6B7280" />
          <Text style={styles.errorTitle}>No Wallet Connected</Text>
          <Text style={styles.errorText}>Please connect your wallet to receive payments</Text>
        </View>
      </SafeAreaView>
    );
  }

  const generateQRData = () => {
    return generateReceiveQR({
      address: connectedAddress,
      amount: amount ? parseFloat(amount) : undefined,
      token,
      memo,
      network,
    });
  };

  const handleCopyAddress = async () => {
    await Clipboard.setString(connectedAddress);
    Alert.alert('Copied!', 'Address copied to clipboard');
  };

  const handleShare = async () => {
    try {
      const paymentLink = generatePaymentLink({
        to: connectedAddress,
        amount: amount ? parseFloat(amount) : undefined,
        token,
        memo,
      });

      const message = `Send ${amount ? `$${amount} ` : ''}${token} to me on SplitSafe${memo ? ` for ${memo}` : ''}\n\nAddress: ${connectedAddress}\n\nPayment Link: ${paymentLink}`;

      await Share.share({
        message,
        title: 'SplitSafe Payment Request',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share payment request');
    }
  };

  const qrData = generateQRData();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Receive Payment</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {/* Network Badge */}
        <View style={styles.networkBadge}>
          <View style={styles.networkDot} />
          <Text style={styles.networkText}>{network}</Text>
        </View>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <QRCode
            value={qrData}
            size={200}
            backgroundColor="white"
            color="black"
            logo={undefined}
          />
        </View>

        {/* Address Display */}
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Your Address</Text>
          <TouchableOpacity onPress={handleCopyAddress} style={styles.addressBox}>
            <Text style={styles.addressText}>{connectedAddress}</Text>
            <Ionicons name="copy-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Amount Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Amount (Optional)</Text>
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

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={handleCopyAddress} style={styles.actionButton}>
            <Ionicons name="copy-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Copy Address</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Ionicons name="share-outline" size={20} color="#007AFF" />
            <Text style={styles.actionButtonText}>Share Request</Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to receive payments:</Text>
          <Text style={styles.instructionText}>
            • Share your address or QR code with the sender
          </Text>
          <Text style={styles.instructionText}>
            • They can scan the QR code or use the payment link
          </Text>
          <Text style={styles.instructionText}>
            • Payments will appear in your wallet automatically
          </Text>
        </View>
      </View>
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 24,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  networkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D4ED8',
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
  addressContainer: {
    marginBottom: 24,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#374151',
    marginRight: 12,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 140,
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
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
