import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useSmartWallet } from '../lib/smartwallet/SmartWalletProvider';
import { paymentService, PaymentResult, PaymentStatus } from '../lib/blockchain/paymentService';

export interface PaymentState {
  isProcessing: boolean;
  result: PaymentResult | null;
  status: PaymentStatus | null;
  error: string | null;
}

export function usePayment() {
  const { account, signTransaction, isAuthenticated } = useSmartWallet();
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isProcessing: false,
    result: null,
    status: null,
    error: null
  });

  const sendPayment = useCallback(async (
    toAddress: string,
    amount: string,
    description: string = ''
  ) => {
    if (!account?.address) {
      Alert.alert('Error', 'Wallet not connected');
      return { success: false, error: 'Wallet not connected' };
    }

    if (!isAuthenticated) {
      Alert.alert('Error', 'Please authenticate your wallet first');
      return { success: false, error: 'Please authenticate your wallet first' };
    }

    try {
      setPaymentState(prev => ({
        ...prev,
        isProcessing: true,
        error: null
      }));

      // Check gas balance first
      console.log('🔍 Checking gas balance...');
      const gasCheck = await paymentService.checkGasBalance(account.address);
      
      if (!gasCheck.hasGas) {
        throw new Error(`Insufficient ETH for gas fees. Balance: ${gasCheck.balance} ETH`);
      }

      // Estimate gas cost
      console.log('⛽ Estimating gas cost...');
      const gasCost = await paymentService.estimateGasCost(
        account.address,
        toAddress,
        amount
      );

      console.log(`Gas estimate: ${gasCost.totalCost} ETH`);

      // Show confirmation dialog
      const confirmed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Confirm Payment',
          `Send ${amount} PYUSD to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}\n\n` +
          `Gas fee: ~${parseFloat(gasCost.totalCost).toFixed(6)} ETH\n` +
          `Description: ${description || 'Payment'}`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => resolve(false)
            },
            {
              text: 'Send Payment',
              style: 'default',
              onPress: () => resolve(true)
            }
          ]
        );
      });

      if (!confirmed) {
        setPaymentState(prev => ({
          ...prev,
          isProcessing: false
        }));
        return { success: false, error: 'Insufficient gas balance' };
      }

      // REAL BLOCKCHAIN PAYMENT - Send actual PYUSD transaction
      console.log('💸 Sending REAL PYUSD payment...');
      
      // Send the actual payment using the payment service
      const result = await paymentService.sendPayment(
        account.address, // This will be smart wallet or EOA depending on context
        toAddress,
        amount
      );

      setPaymentState(prev => ({
        ...prev,
        result,
        isProcessing: false
      }));

      if (result.success && result.transactionHash) {
        // Show success message with explorer link
        Alert.alert(
          'Payment Sent!',
          `Transaction hash: ${result.transactionHash.slice(0, 10)}...\n\n` +
          'Your payment is being processed on the blockchain.',
          [
            {
              text: 'View on Explorer',
              onPress: () => {
                // In a real app, you'd open the browser
                console.log('Explorer URL:', paymentService.getExplorerUrl(result.transactionHash!));
              }
            },
            { text: 'OK' }
          ]
        );

        // Start monitoring payment status
        monitorPaymentStatus(result.transactionHash);
        return result; // Return the full result object
      } else {
        Alert.alert('Payment Failed', result.error || 'Unknown error occurred');
        return result; // Return the full result object
      }

    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setPaymentState(prev => ({
        ...prev,
        isProcessing: false,
        error: errorMessage
      }));

      Alert.alert('Payment Error', errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [account, signTransaction, isAuthenticated]);

  const monitorPaymentStatus = useCallback(async (transactionHash: string) => {
    try {
      // Poll for status updates
      const checkStatus = async () => {
        const status = await paymentService.getPaymentStatus(transactionHash);
        
        setPaymentState(prev => ({
          ...prev,
          status
        }));

        if (status.status === 'confirmed') {
          console.log('✅ Payment confirmed!');
          Alert.alert(
            'Payment Confirmed!',
            `Your payment has been confirmed on the blockchain.\n\n` +
            `Block: ${status.blockNumber}\n` +
            `Confirmations: ${status.confirmations}`,
            [
              {
                text: 'View Receipt',
                onPress: () => {
                  console.log('Blockscout URL:', paymentService.getBlockscoutUrl(transactionHash));
                }
              },
              { text: 'OK' }
            ]
          );
          return true; // Stop polling
        } else if (status.status === 'failed') {
          console.log('❌ Payment failed');
          Alert.alert('Payment Failed', 'Transaction failed on the blockchain');
          return true; // Stop polling
        }

        return false; // Continue polling
      };

      // Initial check
      const shouldStop = await checkStatus();
      if (shouldStop) return;

      // Poll every 10 seconds for up to 5 minutes
      const pollInterval = setInterval(async () => {
        const shouldStop = await checkStatus();
        if (shouldStop) {
          clearInterval(pollInterval);
        }
      }, 10000);

      // Stop polling after 5 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
      }, 300000);

    } catch (error) {
      console.error('Error monitoring payment status:', error);
    }
  }, []);

  const resetPaymentState = useCallback(() => {
    setPaymentState({
      isProcessing: false,
      result: null,
      status: null,
      error: null
    });
  }, []);

  const getExplorerUrl = useCallback((transactionHash: string) => {
    return paymentService.getExplorerUrl(transactionHash);
  }, []);

  const getBlockscoutUrl = useCallback((transactionHash: string) => {
    return paymentService.getBlockscoutUrl(transactionHash);
  }, []);

  return {
    ...paymentState,
    sendPayment,
    resetPaymentState,
    getExplorerUrl,
    getBlockscoutUrl
  };
}
