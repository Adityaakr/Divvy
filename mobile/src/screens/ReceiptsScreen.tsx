import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
  BackHandler,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { useFocusEffect } from '@react-navigation/native';
import { useSmartWallet } from '../lib/smartwallet/SmartWalletProvider';
import { formatCurrency, formatAddress } from '../lib/calc';
import { usePayment } from '../hooks/usePayment';
import { TransactionSigningModal } from '../components/TransactionSigningModal';
import { userService, User } from '../lib/services/userService';
import { receiptService } from '../lib/services/receiptService';

// Receipt status types
type ReceiptStatus = 'pending' | 'claimed' | 'settled';

interface Receipt {
  id: string;
  title: string;
  amount: number;
  payer: string;
  recipient: string;
  status: ReceiptStatus;
  timestamp: number;
  transactionHash?: string;
  groupName?: string;
}

export default function ReceiptsScreen({ navigation }: any) {
  const { account } = useSmartWallet();
  const { sendPayment, isProcessing, result, status } = usePayment();
  const [selectedFilter, setSelectedFilter] = useState<'all' | ReceiptStatus>('all');
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<{
    from: string;
    to: string;
    amount: string;
    token: string;
  } | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showDinnerNotification, setShowDinnerNotification] = useState(false);
  const [showSmartWalletNotification, setShowSmartWalletNotification] = useState(false);

  // Handle back button when modal is open
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (modalVisible) {
          closeReceiptModal();
          return true; // Prevent default behavior
        }
        return false; // Let default behavior happen
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [modalVisible])
  );

  // Close modal when screen loses focus
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // Cleanup when screen loses focus
        if (modalVisible) {
          setModalVisible(false);
          setSelectedReceipt(null);
        }
      };
    }, [modalVisible])
  );
  
  // Load real receipts from storage
  useEffect(() => {
    loadReceipts();
  }, [account?.address]);

  // Reload receipts when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadReceipts();
    }, [])
  );

  const loadReceipts = async () => {
    try {
      const loadedReceipts = await receiptService.loadReceipts();
      
      // Add default receipts if none exist (for demo) - showing TRULY FLEXIBLE routing
      if (loadedReceipts.length === 0 && account?.address) {
        // Receipt 1: Pay Alice (different person, different address)
        await receiptService.addReceipt({
          title: 'Coffee shop bill - Pay Alice',
          amount: 12.30,
          payer: account.address, // You owe Alice
          recipient: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', // Alice's wallet address
          status: 'pending',
          groupName: 'Work Team'
        });
        
        // Receipt 2: Pay Bob (different person, different address)
        await receiptService.addReceipt({
          title: 'Lunch bill - Pay Bob',
          amount: 25.50,
          payer: account.address, // You owe Bob
          recipient: '0x1234567890123456789012345678901234567890', // Bob's wallet address (DIFFERENT!)
          status: 'pending',
          groupName: 'Friends'
        });
        
        // Receipt 3: REAL DEMO - Dinner bill to EXACT address requested
        await receiptService.addReceipt({
          title: 'Dinner Bill',
          amount: 45.75,
          payer: account.address, // You owe for dinner  
          recipient: '0x3a159d24634A180f3Ab9ff37868358C73226E672', // EXACT ADDRESS YOU WANT
          status: 'pending',
          groupName: 'Restaurant',
          description: 'Italian Restaurant - Table for 4'
        });

        // Receipt 4: SMART WALLET TO EOA TEST - Smart wallet owes EOA
        await receiptService.addReceipt({
          title: 'Smart Wallet → EOA Test',
          amount: 25.00,
          payer: '0x9406Cc6185a346906296840746125a0E44976454', // Smart wallet owes money
          recipient: '0x5A26514ce0AF943540407170B09ceA03cBFf5570', // Pay to EOA
          status: 'pending',
          groupName: 'Test Payment',
          description: 'Testing smart wallet to EOA payment with Account Abstraction'
        });

        // Receipt 5: SETTLED - Grocery Bill (Already Paid)
        await receiptService.addReceipt({
          title: 'Grocery Bill - PAID',
          amount: 30.00,
          payer: account.address,
          recipient: '0xdeb270a1c71b563651a3f6f32dff6fd74687a308', // Already paid to this address
          status: 'settled',
          groupName: 'Shopping',
          description: 'Weekly groceries - payment completed',
          transactionHash: '0x333756e1b6c4cefc2276357e059836d9fdb895bc789ac2ff857095b47167e7c1'
        });

        // Receipt 6: SETTLED - Gas Station (Already Paid)
        await receiptService.addReceipt({
          title: 'Gas Station - PAID',
          amount: 15.50,
          payer: account.address,
          recipient: '0x8ba1f109551bD432803012645Hac136c22C501e5', // Already paid
          status: 'settled',
          groupName: 'Transportation',
          description: 'Gas refill - payment completed',
          transactionHash: '0x1234567890abcdef1234567890abcdef12345678901234567890abcdef123456'
        });

        // Receipt 7: SETTLED - Movie Tickets (Already Paid)
        await receiptService.addReceipt({
          title: 'Movie Tickets - PAID',
          amount: 22.75,
          payer: account.address,
          recipient: '0x9876543210fedcba9876543210fedcba98765432', // Already paid
          status: 'settled',
          groupName: 'Entertainment',
          description: 'Cinema tickets for group - payment completed',
          transactionHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
        });
        // Reload after adding default receipt
        const updatedReceipts = await receiptService.loadReceipts();
        setReceipts(updatedReceipts);
        
        // Show dinner notification after 2 seconds
        setTimeout(() => {
          setShowDinnerNotification(true);
        }, 2000);

        // Show smart wallet test notification after 5 seconds
        setTimeout(() => {
          setShowSmartWalletNotification(true);
        }, 5000);
      } else {
        setReceipts(loadedReceipts);
      }
    } catch (error) {
      console.error('Error loading receipts:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [account?.address]);

  const loadUsers = async () => {
    try {
      const loadedUsers = await userService.loadUsers();
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const getDisplayName = (address: string) => {
    const user = users.find(u => u.address.toLowerCase() === address.toLowerCase());
    if (user) {
      return user.ensName || user.name;
    }
    return formatAddress(address);
  };

  // Filter receipts based on selected filter
  const filteredReceipts = selectedFilter === 'all' 
    ? receipts 
    : receipts.filter((receipt: Receipt) => receipt.status === selectedFilter);

  // Handle payment for pending receipts
  const handlePayment = async (receipt: Receipt) => {
    try {
      console.log('🚀 Starting payment process...');
      console.log(`Receipt: ${receipt.title}`);
      console.log(`Amount: ${receipt.amount} PYUSD`);
      console.log(`To: ${receipt.recipient}`);
      
      if (!account?.address) {
        Alert.alert('Error', 'Wallet not connected');
        return;
      }

      // Set up transaction details for the signing modal
      setCurrentTransaction({
        from: account.address,
        to: receipt.recipient,
        amount: receipt.amount.toString(),
        token: 'PYUSD'
      });
      
      // Show the beautiful signing modal
      setShowSigningModal(true);
      closeReceiptModal();
    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment failed. Please try again.');
    }
  };

  const handleSignTransaction = async () => {
    if (!currentTransaction || !account?.address) {
      return { success: false, error: 'Missing transaction details' };
    }

    try {
      const result = await sendPayment(
        currentTransaction.to,
        currentTransaction.amount
      );

      if (result.success) {
        // Update receipt status to settled
        setReceipts(prevReceipts =>
          prevReceipts.map(r =>
            r.recipient === currentTransaction.to && r.amount.toString() === currentTransaction.amount
              ? { ...r, status: 'settled' }
              : r
          )
        );
        
        return result; // Return the full result with real transaction hash
      } else {
        return result; // Return the error result
      }
    } catch (error) {
      console.error('Transaction signing error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  };

  const getStatusColor = (status: ReceiptStatus) => {
    switch (status) {
      case 'pending': return '#F59E0B';
      case 'claimed': return '#3B82F6';
      case 'settled': return '#10B981';
      default: return '#6B7280';
    }
  };

  const openReceiptModal = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setModalVisible(true);
  };

  const closeReceiptModal = () => {
    setModalVisible(false);
    setSelectedReceipt(null);
    // Small delay to ensure modal closes before any navigation
    setTimeout(() => {
      // Modal is now closed, navigation should work normally
    }, 100);
  };

  const getStatusIcon = (status: ReceiptStatus) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'claimed': return 'checkmark-circle-outline';
      case 'settled': return 'checkmark-done-circle-outline';
      default: return 'help-circle-outline';
    }
  };

  const renderReceiptItem = (receipt: Receipt) => {
    const isYouPayer = receipt.payer === account?.address;
    const isYouRecipient = receipt.recipient === account?.address;

    return (
      <TouchableOpacity key={receipt.id} style={styles.receiptItem} onPress={() => openReceiptModal(receipt)}>
        {/* Receipt Header with Icon */}
        <View style={styles.receiptHeader}>
          <View style={styles.receiptIconContainer}>
            <View style={[styles.receiptIcon, { backgroundColor: getStatusColor(receipt.status) + '20' }]}>
              <Ionicons 
                name="receipt-outline" 
                size={24} 
                color={getStatusColor(receipt.status)} 
              />
            </View>
          </View>
          
          <View style={styles.receiptContent}>
            <View style={styles.receiptTitleRow}>
              <Text style={styles.receiptTitle} numberOfLines={1}>{receipt.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(receipt.status) + '15' }]}>
                <Ionicons 
                  name={getStatusIcon(receipt.status) as any} 
                  size={12} 
                  color={getStatusColor(receipt.status)} 
                />
                <Text style={[styles.statusText, { color: getStatusColor(receipt.status) }]}>
                  {receipt.status.charAt(0).toUpperCase() + receipt.status.slice(1)}
                </Text>
              </View>
            </View>
            
            {receipt.groupName && (
              <View style={styles.groupRow}>
                <Ionicons name="people-outline" size={14} color="#6B7280" />
                <Text style={styles.groupName}>{receipt.groupName}</Text>
              </View>
            )}
            
            <View style={styles.amountRow}>
              <Text style={styles.totalAmount}>
                ${receipt.amount.toFixed(2)} PYUSD
              </Text>
              <Text style={styles.dateText}>
                {new Date(receipt.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </Text>
            </View>
            
            <View style={styles.participantRow}>
              <View style={styles.participantInfo}>
                <Ionicons 
                  name={isYouPayer ? "arrow-up-circle-outline" : "arrow-down-circle-outline"} 
                  size={16} 
                  color={isYouPayer ? "#EF4444" : "#10B981"} 
                />
                <Text style={[styles.participantText, { color: isYouPayer ? "#EF4444" : "#10B981" }]}>
                  {isYouPayer ? 'You paid' : 'You received'}
                </Text>
              </View>
              
              {receipt.transactionHash && (
                <View style={styles.transactionBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                  <Text style={styles.transactionText}>Confirmed</Text>
                </View>
              )}
            </View>
          </View>
          
          <View style={styles.chevronContainer}>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (filter: 'all' | ReceiptStatus, label: string, count: number) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.filterButtonActive
      ]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.filterButtonTextActive
      ]}>
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  const renderReceiptModal = () => {
    if (!selectedReceipt) return null;

    const isYouPayer = selectedReceipt.payer === account?.address;
    const isYouRecipient = selectedReceipt.recipient === account?.address;
    const paymentData = {
      amount: selectedReceipt.amount,
      recipient: selectedReceipt.recipient,
      description: selectedReceipt.title,
      receiptId: selectedReceipt.id
    };

    return (
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={closeReceiptModal}
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeReceiptModal} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Receipt Details</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Receipt Header */}
            <View style={styles.receiptCard}>
              <View style={styles.receiptCardHeader}>
                <Text style={styles.receiptCardTitle}>{selectedReceipt.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedReceipt.status) + '20' }]}>
                  <Ionicons 
                    name={getStatusIcon(selectedReceipt.status) as any} 
                    size={16} 
                    color={getStatusColor(selectedReceipt.status)} 
                  />
                  <Text style={[styles.statusText, { color: getStatusColor(selectedReceipt.status) }]}>
                    {selectedReceipt.status.charAt(0).toUpperCase() + selectedReceipt.status.slice(1)}
                  </Text>
                </View>
              </View>

              {selectedReceipt.groupName && (
                <Text style={styles.receiptCardGroup}>{selectedReceipt.groupName}</Text>
              )}

              <View style={styles.amountSection}>
                <Text style={styles.amountLabel}>Total Amount</Text>
                <Text style={styles.amountValue}>${selectedReceipt.amount.toFixed(2)} PYUSD</Text>
              </View>

              {/* Payment Details */}
              <View style={styles.paymentDetails}>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>From:</Text>
                  <Text style={styles.paymentValue}>
                    {isYouPayer ? 'You' : formatAddress(selectedReceipt.payer)}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>To:</Text>
                  <Text style={styles.paymentValue}>
                    {isYouRecipient ? 'You' : formatAddress(selectedReceipt.recipient)}
                  </Text>
                </View>
                <View style={styles.paymentRow}>
                  <Text style={styles.paymentLabel}>Date:</Text>
                  <Text style={styles.paymentValue}>
                    {new Date(selectedReceipt.timestamp).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                {selectedReceipt.transactionHash && (
                  <View style={styles.paymentRow}>
                    <Text style={styles.paymentLabel}>Transaction:</Text>
                    <Text style={styles.paymentValue}>
                      {selectedReceipt.transactionHash.slice(0, 10)}...{selectedReceipt.transactionHash.slice(-8)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* QR Code Section - Only show for pending payments */}
            {selectedReceipt.status === 'pending' && !isYouPayer && (
              <View style={styles.qrSection}>
                <Text style={styles.qrTitle}>Pay with QR Code</Text>
                <Text style={styles.qrSubtitle}>Scan this QR code to pay directly</Text>
                
                <View style={styles.qrContainer}>
                  <QRCode
                    value={JSON.stringify(paymentData)}
                    size={200}
                    color="#1F2937"
                    backgroundColor="#FFFFFF"
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.payButton, isProcessing && { opacity: 0.6 }]} 
                  onPress={() => handlePayment(selectedReceipt)}
                  disabled={isProcessing}
                >
                  <Ionicons name="card-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.payButtonText}>
                    {isProcessing ? 'Processing...' : `Pay $${selectedReceipt.amount.toFixed(2)} PYUSD`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Receipt Footer */}
            <View style={styles.receiptFooter}>
              <Text style={styles.footerText}>Receipt ID: {selectedReceipt.id}</Text>
              <Text style={styles.footerText}>Generated by Safe Settle</Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Receipts</Text>
        <Text style={styles.subtitle}>
          Your expense history and receipts
        </Text>
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'All', receipts.length)}
        {renderFilterButton('pending', 'Pending', receipts.filter((r: Receipt) => r.status === 'pending').length)}
        {renderFilterButton('claimed', 'Claimed', receipts.filter((r: Receipt) => r.status === 'claimed').length)}
        {renderFilterButton('settled', 'Settled', receipts.filter((r: Receipt) => r.status === 'settled').length)}
      </View>

      <ScrollView style={styles.scrollView}>
        {!account ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="wallet-outline" size={64} color="#6B7280" />
            </View>
            <Text style={styles.emptyTitle}>Connect your wallet</Text>
            <Text style={styles.emptySubtitle}>
              Please connect your smart wallet to view receipts
            </Text>
          </View>
        ) : filteredReceipts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={64} color="#6B7280" />
            </View>
            <Text style={styles.emptyTitle}>No receipts yet</Text>
            <Text style={styles.emptySubtitle}>
              Your expense receipts will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.receiptsList}>
            {filteredReceipts
              .sort((a: Receipt, b: Receipt) => b.timestamp - a.timestamp)
              .map((receipt, index) => (
                <View key={`receipt-${receipt.id}-${index}`}>
                  {renderReceiptItem(receipt)}
                </View>
              ))}
          </View>
        )}
      </ScrollView>
      
      {/* Beautiful Transaction Signing Modal */}
      {currentTransaction && (
        <TransactionSigningModal
          visible={showSigningModal}
          onClose={() => {
            setShowSigningModal(false);
            setCurrentTransaction(null);
          }}
          onSign={handleSignTransaction}
          transactionDetails={currentTransaction}
        />
      )}
      
      {/* Receipt Detail Modal */}
      {renderReceiptModal()}

      {/* Smart Wallet Test Notification Popup */}
      <Modal
        visible={showSmartWalletNotification}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSmartWalletNotification(false)}
      >
        <View style={styles.notificationOverlay}>
          <View style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <Ionicons name="wallet" size={24} color="#007AFF" />
              <Text style={styles.notificationTitle}>Smart Wallet Test Ready</Text>
            </View>
            
            <Text style={styles.notificationDescription}>
              Test Account Abstraction payment from Smart Wallet to EOA
            </Text>
            
            <View style={styles.notificationDetails}>
              <Text style={styles.notificationAmount}>$25.00 PYUSD</Text>
              <Text style={styles.notificationAddress}>
                From: 0x9406...6454 → To: 0x5A26...5570
              </Text>
            </View>
            
            <View style={styles.notificationActions}>
              <TouchableOpacity 
                style={styles.payNowButton}
                onPress={() => {
                  setShowSmartWalletNotification(false);
                  // Find and pay the smart wallet test receipt
                  const testReceipt = receipts.find(r => 
                    r.title === 'Smart Wallet → EOA Test'
                  );
                  if (testReceipt) {
                    handlePayment(testReceipt);
                  }
                }}
              >
                <Text style={styles.payNowText}>Test AA Payment</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dismissButton}
                onPress={() => setShowSmartWalletNotification(false)}
              >
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Dinner Bill Notification Popup */}
      <Modal
        visible={showDinnerNotification}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDinnerNotification(false)}
      >
        <View style={styles.notificationOverlay}>
          <View style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <Ionicons name="restaurant" size={24} color="#FF6B35" />
              <Text style={styles.notificationTitle}>Dinner Bill Pending</Text>
            </View>
            
            <Text style={styles.notificationDescription}>
              Payment request from Italian Restaurant
            </Text>
            
            <View style={styles.notificationDetails}>
              <Text style={styles.notificationAmount}>$45.75 PYUSD</Text>
              <Text style={styles.notificationAddress}>
                To: 0x3a159d...6E672
              </Text>
            </View>
            
            <View style={styles.notificationActions}>
              <TouchableOpacity 
                style={styles.payNowButton}
                onPress={() => {
                  setShowDinnerNotification(false);
                  // Find and pay the dinner bill
                  const dinnerReceipt = receipts.find(r => 
                    r.recipient === '0x3a159d24634A180f3Ab9ff37868358C73226E672'
                  );
                  if (dinnerReceipt) {
                    handlePayment(dinnerReceipt);
                  }
                }}
              >
                <Text style={styles.payNowText}>Pay Now</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.showQRButton}
                onPress={() => {
                  setShowDinnerNotification(false);
                  Alert.alert('QR Code', 'QR code feature coming soon!');
                }}
              >
                <Ionicons name="qr-code" size={20} color="#007AFF" />
                <Text style={styles.showQRText}>Show QR</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.dismissButton}
                onPress={() => setShowDinnerNotification(false)}
              >
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    backgroundColor: '#F3F4F6',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  expensesList: {
    padding: 20,
    gap: 16,
  },
  expenseItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  paidBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  yourShare: {
    fontSize: 14,
    color: '#6B7280',
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  payerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dateText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  splitBreakdown: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  splitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  splitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  splitMember: {
    fontSize: 14,
    color: '#6B7280',
  },
  splitAmount: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  // New Receipt Styles
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  receiptsList: {
    padding: 20,
    gap: 16,
  },
  receiptItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  receiptHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  receiptIconContainer: {
    marginRight: 16,
  },
  receiptIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptContent: {
    flex: 1,
    gap: 8,
  },
  receiptTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  groupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupName: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
  },
  receiptDateText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantText: {
    fontSize: 14,
    fontWeight: '500',
  },
  transactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  transactionText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  chevronContainer: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  transactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  transactionHash: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  placeholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  receiptCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  receiptCardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 16,
  },
  receiptCardGroup: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  amountSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F3F4F6',
    marginVertical: 20,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#059669',
  },
  paymentDetails: {
    gap: 12,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  paymentValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  qrSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  qrSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  receiptFooter: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  
  // Notification Popup Styles
  notificationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  notificationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  notificationDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  notificationDetails: {
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  notificationAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  notificationAddress: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  notificationActions: {
    gap: 12,
  },
  payNowButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  payNowText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  showQRButton: {
    backgroundColor: '#EBF4FF',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  showQRText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  dismissButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
