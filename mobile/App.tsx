import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSmartWallet, SmartWalletProvider } from './src/lib/smartwallet/SmartWalletProvider';
import { pyusdService } from './src/lib/blockchain/pyusdService';
import { blockscoutClient, type Transaction } from './src/lib/ai/blockscoutClient';
import BiometricLoginButton from './src/components/BiometricLoginButton';
import CompactWalletDropdown from './src/components/CompactWalletDropdown';
import { usePyusdBalance } from './src/hooks/usePyusdBalance';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient();

// Import all screens (without Privy dependencies)
import ReceiveScreen from './src/screens/ReceiveScreen';
import PaymentRequestScreen from './src/screens/PaymentRequestScreen';
import EnhancedSavingsScreen from './src/screens/EnhancedSavingsScreen';
import CopilotScreenDemo from './src/screens/CopilotScreenDemo';
import MiniExplorerScreen from './src/screens/MiniExplorerScreen';
import ReceiptsScreen from './src/screens/ReceiptsScreen';
// import AddExpenseScreen from './src/screens/AddExpenseScreen'; // Using inline component instead
import UsersScreen from './src/screens/UsersScreen';
import { AddUserModal } from './src/components/AddUserModal';
import { userService } from './src/lib/services/userService';
import { receiptService } from './src/lib/services/receiptService';

// Beautiful home screen with smart wallet integration
function HomeScreen({ navigation }: any) {
  const { account, isAuthenticated, logout } = useSmartWallet();
  const { balance, formattedBalance, isLoading, error, refreshBalance, hasBalance } = usePyusdBalance();
  const [liveTransactions, setLiveTransactions] = useState<Transaction[]>([]);
  const [loadingTxs, setLoadingTxs] = useState(false);

  // Fetch live transactions
  const fetchLiveTransactions = async () => {
    if (!account?.address) return;
    
    setLoadingTxs(true);
    try {
      const transactions = await blockscoutClient.getLiveTransactions(account.address, 'sepolia', 5);
      setLiveTransactions(transactions);
    } catch (error) {
      console.error('Error fetching live transactions:', error);
    } finally {
      setLoadingTxs(false);
    }
  };

  // Fetch transactions on mount and when account changes
  useEffect(() => {
    fetchLiveTransactions();
  }, [account?.address]);
  
  // Use REAL smart wallet data with live PYUSD balance
  const userData = {
    address: account?.address || '',
    displayName: account ? 'Adi Krx' : 'Smart Wallet',
    balance: formattedBalance, // Real PYUSD balance from blockchain
    rawBalance: balance,
    hasBalance,
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>AK</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.greeting}>Good afternoon</Text>
            <Text style={styles.userName}>{userData.displayName}</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          {/* Smart Wallet - Compact or Login */}
          {!account ? (
            <View style={styles.professionalLoginButton}>
              <BiometricLoginButton />
            </View>
          ) : (
            <CompactWalletDropdown />
          )}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Balance Card */}
        <TouchableOpacity style={styles.balanceCard} onPress={refreshBalance}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            {isLoading && (
              <Ionicons name="refresh" size={16} color="#6B7280" style={{ transform: [{ rotate: '180deg' }] }} />
            )}
          </View>
          <Text style={styles.balanceAmount}>
            ${userData.balance} PYUSD
          </Text>
          <Text style={styles.balanceSubtext}>
            {error ? 'Tap to retry' : hasBalance ? 'Available to spend' : 'Connect wallet to see balance'}
          </Text>
          {error && (
            <Text style={styles.errorText}>⚠️ {error}</Text>
          )}
        </TouchableOpacity>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Receive')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#E8F5E8' }]}>
              <Ionicons name="arrow-down" size={24} color="#10B981" />
            </View>
            <Text style={styles.quickActionText}>Receive</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('PaymentRequest')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="arrow-up" size={24} color="#F59E0B" />
            </View>
            <Text style={styles.quickActionText}>Send</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Savings')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="trending-up" size={24} color="#0284C7" />
            </View>
            <Text style={styles.quickActionText}>Earn</Text>
          </TouchableOpacity>
        </View>

        {/* Features Section */}
        <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>DeFi Features</Text>
        
        <TouchableOpacity 
          style={styles.featureItem}
          onPress={() => navigation.navigate('Savings')}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="analytics" size={24} color="#1976D2" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>ASI Savings Agent</Text>
            <Text style={styles.featureDescription}>AI-powered yield optimization with volatility analysis</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.featureItem}
          onPress={() => navigation.navigate('Copilot')}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="chatbubble-ellipses" size={24} color="#F57C00" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>AI Copilot</Text>
            <Text style={styles.featureDescription}>Smart transaction analysis with Blockscout integration</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.featureItem}
          onPress={() => navigation.navigate('Explorer')}
        >
          <View style={[styles.featureIcon, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="globe" size={24} color="#7B1FA2" />
          </View>
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Blockchain Explorer</Text>
            <Text style={styles.featureDescription}>Live blockchain data and transaction monitoring</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        </View>

        {/* Live Transactions Section */}
        <View style={styles.transactionsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={fetchLiveTransactions} disabled={loadingTxs}>
              <Ionicons 
                name="refresh" 
                size={20} 
                color={loadingTxs ? "#9CA3AF" : "#6B7280"} 
                style={{ transform: [{ rotate: loadingTxs ? '180deg' : '0deg' }] }}
              />
            </TouchableOpacity>
          </View>
          
          {loadingTxs ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : liveTransactions.length > 0 ? (
            liveTransactions.slice(0, 3).map((tx, index) => (
              <TouchableOpacity 
                key={tx.hash} 
                style={styles.transactionItem}
                onPress={() => {
                  const explorerUrl = `https://eth-sepolia.blockscout.com/tx/${tx.hash}`;
                  Alert.alert(
                    'Transaction Details',
                    `Hash: ${tx.hash.slice(0, 10)}...\\nStatus: ${tx.status}\\nTimestamp: ${new Date(tx.timestamp).toLocaleString()}`,
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'View on Explorer', onPress: () => console.log('Open:', explorerUrl) }
                    ]
                  );
                }}
              >
                <View style={styles.transactionIcon}>
                  <Ionicons 
                    name={tx.from.toLowerCase() === account?.address?.toLowerCase() ? "arrow-up" : "arrow-down"} 
                    size={16} 
                    color={tx.from.toLowerCase() === account?.address?.toLowerCase() ? "#EF4444" : "#10B981"} 
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionHash}>{tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}</Text>
                  <Text style={styles.transactionTime}>
                    {new Date(tx.timestamp).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={styles.transactionValue}>
                    {tx.tokenTransfers && tx.tokenTransfers.length > 0 
                      ? `${(parseFloat(tx.tokenTransfers[0].value) / Math.pow(10, tx.tokenTransfers[0].token.decimals)).toFixed(2)} ${tx.tokenTransfers[0].token.symbol}`
                      : `${(parseFloat(tx.value) / 1e18).toFixed(4)} ETH`
                    }
                  </Text>
                  <Text style={[styles.transactionStatus, { color: tx.status === 'ok' ? '#10B981' : '#EF4444' }]}>
                    {tx.status === 'ok' ? '✓' : '✗'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyTransactions}>
              <Text style={styles.emptyTransactionsText}>No recent transactions found</Text>
            </View>
          )}
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appTagline}>Split bills seamlessly, settle with PYUSD, and optimize yields via AI agents across chains</Text>
        </View>
      </ScrollView>
    </View>
  );
}

// Enhanced Add Expense Screen
function AddExpenseScreen({ navigation }: any) {
  const [userData, setUserData] = useState({
    balance: '0.00',
    address: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [splitType, setSplitType] = useState('equal');
  const [participants, setParticipants] = useState([
    { id: '1', name: 'Andy', address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', selected: true },
    { id: '2', name: 'Mike', address: '0x1234567890123456789012345678901234567890', selected: true },
    { id: '3', name: 'Bob', address: '0x0987654321098765432109876543210987654321', selected: false },
  ]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [savedUsers, setSavedUsers] = useState<any[]>([]);

  const categories = ['Food & Dining', 'Transportation', 'Entertainment', 'Shopping', 'Utilities', 'Other'];
  const splitTypes = [
    { id: 'equal', name: 'Split Equally', icon: 'people-outline' },
    { id: 'exact', name: 'Exact Amounts', icon: 'calculator-outline' },
    { id: 'percentage', name: 'Percentage', icon: 'pie-chart-outline' },
  ];

  const selectedParticipants = participants.filter(p => p.selected);
  const splitAmount = amount ? (parseFloat(amount) / selectedParticipants.length).toFixed(2) : '0.00';

  // Load saved users when component mounts
  useEffect(() => {
    loadSavedUsers();
  }, []);

  const loadSavedUsers = async () => {
    try {
      const users = await userService.loadUsers();
      setSavedUsers(users);
      
      // Add saved users to participants list
      const newParticipants = users.map(user => ({
        id: user.id,
        name: user.ensName || user.name,
        address: user.address,
        selected: false
      }));
      
      // Merge with existing participants, avoiding duplicates
      setParticipants(prev => {
        const existing = prev.map(p => p.address.toLowerCase());
        const filtered = newParticipants.filter(p => !existing.includes(p.address.toLowerCase()));
        return [...prev, ...filtered];
      });
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddUser = async (userData: any) => {
    try {
      const newUser = await userService.addUser(userData);
      
      // Add to participants list
      const newParticipant = {
        id: newUser.id,
        name: newUser.ensName || newUser.name,
        address: newUser.address,
        selected: false
      };
      
      setParticipants(prev => [...prev, newParticipant]);
      
      Alert.alert('Success', `${newUser.name} added successfully!`);
    } catch (error) {
      Alert.alert('Error', (error as Error).message || 'Failed to add user');
    }
  };

  const handleAddExpense = async () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (selectedParticipants.length === 0) {
      Alert.alert('Error', 'Please select at least one person to split with');
      return;
    }

    try {
      // Create receipts for each selected participant
      const receipts = await Promise.all(
        selectedParticipants.map(async (participant) => {
          const receipt = await receiptService.addReceipt({
            title: `${description} - ${category}`,
            amount: parseFloat(splitAmount),
            payer: '0x5A26514ce0AF943540407170B09ceA03cBFf5570', // You (who paid initially)
            recipient: participant.address, // Person who needs to pay you back
            status: 'pending',
            category,
            description,
            groupName: 'Split Expense',
            participants: selectedParticipants.map(p => ({
              id: p.id,
              name: p.name,
              address: p.address,
              amount: parseFloat(splitAmount)
            }))
          });
          return receipt;
        })
      );

      Alert.alert(
        'Expense Added!',
        `$${amount} for "${description}" split among ${selectedParticipants.length} people ($${splitAmount} each). ${receipts.length} receipts created.`,
        [
          { text: 'Add Another', onPress: () => {
            setAmount('');
            setDescription('');
            // Keep participants selected for convenience
          }},
          { text: 'View Receipts', onPress: () => navigation.navigate('Receipts') }
        ]
      );
    } catch (error) {
      console.error('Error creating receipts:', error);
      Alert.alert('Error', 'Failed to create receipts. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.addExpenseContainer}>
        {/* Header */}
        <View style={styles.addExpenseHeader}>
          <Text style={styles.title}>Add Expense</Text>
          <Text style={styles.subtitle}>Split bills with your group</Text>
        </View>

        {/* Amount Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Amount (PYUSD)</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Description Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Description</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="What's this expense for?"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Category Selection */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, category === cat && styles.categoryChipSelected]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.categoryText, category === cat && styles.categoryTextSelected]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Split Type */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Split Type</Text>
          {splitTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.splitTypeOption, splitType === type.id && styles.splitTypeSelected]}
              onPress={() => setSplitType(type.id)}
            >
              <Ionicons 
                name={type.icon as any} 
                size={24} 
                color={splitType === type.id ? '#007AFF' : '#6B7280'} 
              />
              <Text style={[styles.splitTypeText, splitType === type.id && styles.splitTypeTextSelected]}>
                {type.name}
              </Text>
              {splitType === type.id && (
                <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Participants */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Split With ({selectedParticipants.length} people)</Text>
          {participants.map((participant) => (
            <TouchableOpacity
              key={participant.id}
              style={styles.participantItem}
              onPress={() => {
                setParticipants(participants.map(p => 
                  p.id === participant.id ? { ...p, selected: !p.selected } : p
                ));
              }}
            >
              <View style={styles.participantInfo}>
                <View style={[styles.participantAvatar, { backgroundColor: participant.selected ? '#007AFF' : '#E5E7EB' }]}>
                  <Text style={[styles.participantAvatarText, { color: participant.selected ? '#FFFFFF' : '#6B7280' }]}>
                    {participant.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.participantDetails}>
                  <Text style={styles.participantName}>{participant.name}</Text>
                  <Text style={styles.participantAddress}>
                    {participant.address.slice(0, 6)}...{participant.address.slice(-4)}
                  </Text>
                </View>
              </View>
              <View style={styles.participantAmount}>
                {participant.selected && (
                  <Text style={styles.participantAmountText}>${splitAmount}</Text>
                )}
                <Ionicons 
                  name={participant.selected ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={participant.selected ? "#10B981" : "#D1D5DB"} 
                />
              </View>
            </TouchableOpacity>
          ))}
          
          {/* Add New Person Button */}
          <TouchableOpacity
            style={styles.addPersonButton}
            onPress={() => setShowAddUserModal(true)}
          >
            <View style={styles.addPersonIcon}>
              <Ionicons name="person-add" size={20} color="#007AFF" />
            </View>
            <Text style={styles.addPersonText}>Add New Person</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Summary */}
        {amount && selectedParticipants.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Split Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Amount:</Text>
              <Text style={styles.summaryValue}>${amount} PYUSD</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Per Person:</Text>
              <Text style={styles.summaryValue}>${splitAmount} PYUSD</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Network:</Text>
              <Text style={styles.summaryValue}>Ethereum Sepolia</Text>
            </View>
          </View>
        )}

        {/* Add Button */}
        <TouchableOpacity 
          style={[styles.addButton, (!amount || !description) && styles.addButtonDisabled]}
          onPress={handleAddExpense}
          disabled={!amount || !description}
        >
          <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Add User Modal */}
      <AddUserModal
        visible={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onAddUser={handleAddUser}
      />
    </SafeAreaView>
  );
}


function SettingsScreen() {
  const { account, isAuthenticated } = useSmartWallet();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [autoLockEnabled, setAutoLockEnabled] = useState(false);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.content}>App settings and wallet configuration</Text>
        </View>
      
      {/* Wallet Configuration */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Wallet Configuration</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Connection Status</Text>
            <Text style={styles.settingDescription}> wallet connection state</Text>
          </View>
          <View style={styles.settingValue}>
            <View style={styles.statusRow}>
              <View style={[styles.statusIndicator, { backgroundColor: account ? (isAuthenticated ? '#10B981' : '#EF4444') : '#EF4444' }]} />
              <Text style={styles.statusText}>
                {account ? (isAuthenticated ? 'Active' : 'Locked') : 'Disconnected'}
              </Text>
            </View>
          </View>
        </View>
        
        {account && (
          <>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Wallet Address</Text>
                <Text style={styles.settingDescription}>Your smart contract wallet address</Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.addressValue}>
                  {account.address.slice(0, 6)}...{account.address.slice(-4)}
                </Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Network Configuration */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Network Configuration</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Active Network</Text>
            <Text style={styles.settingDescription}> blockchain network</Text>
          </View>
          <View style={styles.settingValue}>
            <View style={styles.networkBadge}>
              <View style={styles.networkDot} />
              <Text style={styles.networkText}>Ethereum Sepolia</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Chain ID</Text>
            <Text style={styles.settingDescription}>Network identifier</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.valueText}>11155111</Text>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Block Explorer</Text>
            <Text style={styles.settingDescription}>Blockchain data explorer</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.valueText}>Blockscout</Text>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Yellow Network</Text>
            <Text style={styles.settingDescription}>Off-chain payment channel status</Text>
          </View>
          <View style={styles.settingValue}>
            <View style={styles.networkBadge}>
              <View style={styles.networkDot} />
              <Text style={styles.networkText}>Active Channel</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ASI Savings */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>ASI Savings</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>ASI Interaction</Text>
            <Text style={styles.settingDescription}>AI-powered savings optimization</Text>
          </View>
          <View style={styles.settingValue}>
            <TouchableOpacity 
              style={[styles.toggleSwitch, analyticsEnabled && styles.toggleSwitchActive]}
              onPress={() => setAnalyticsEnabled(!analyticsEnabled)}
            >
              <View style={[styles.toggleThumb, analyticsEnabled && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Savings Strategy</Text>
            <Text style={styles.settingDescription}>Current AI optimization strategy</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.valueText}>Aggressive Growth</Text>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto Rebalance</Text>
            <Text style={styles.settingDescription}>Automatic portfolio rebalancing</Text>
          </View>
          <View style={styles.settingValue}>
            <TouchableOpacity 
              style={[styles.toggleSwitch, autoLockEnabled && styles.toggleSwitchActive]}
              onPress={() => setAutoLockEnabled(!autoLockEnabled)}
            >
              <View style={[styles.toggleThumb, autoLockEnabled && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* App Features */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>App Features</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Push Notifications</Text>
            <Text style={styles.settingDescription}>Receive transaction and security alerts</Text>
          </View>
          <View style={styles.settingValue}>
            <TouchableOpacity 
              style={[styles.toggleSwitch, notificationsEnabled && styles.toggleSwitchActive]}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            >
              <View style={[styles.toggleThumb, notificationsEnabled && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Biometric Security</Text>
            <Text style={styles.settingDescription}>Use Face ID or fingerprint for authentication</Text>
          </View>
          <View style={styles.settingValue}>
            <TouchableOpacity 
              style={[styles.toggleSwitch, biometricEnabled && styles.toggleSwitchActive]}
              onPress={() => setBiometricEnabled(!biometricEnabled)}
            >
              <View style={[styles.toggleThumb, biometricEnabled && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Auto Lock</Text>
            <Text style={styles.settingDescription}>Automatically lock app when inactive</Text>
          </View>
          <View style={styles.settingValue}>
            <TouchableOpacity 
              style={[styles.toggleSwitch, autoLockEnabled && styles.toggleSwitchActive]}
              onPress={() => setAutoLockEnabled(!autoLockEnabled)}
            >
              <View style={[styles.toggleThumb, autoLockEnabled && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Analytics</Text>
            <Text style={styles.settingDescription}>Help improve the app with usage data</Text>
          </View>
          <View style={styles.settingValue}>
            <TouchableOpacity 
              style={[styles.toggleSwitch, analyticsEnabled && styles.toggleSwitchActive]}
              onPress={() => setAnalyticsEnabled(!analyticsEnabled)}
            >
              <View style={[styles.toggleThumb, analyticsEnabled && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Application Information */}
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Application Information</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingDescription}>Current application version</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.valueText}>1.0.0</Text>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Authentication Method</Text>
            <Text style={styles.settingDescription}>Secure login mechanism</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.valueText}>Biometric Passkeys</Text>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Account Standard</Text>
            <Text style={styles.settingDescription}>Smart contract wallet type</Text>
          </View>
          <View style={styles.settingValue}>
            <Text style={styles.valueText}>ERC-4337</Text>
          </View>
        </View>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Add') {
            iconName = focused ? 'add-circle' : 'add-circle-outline';
          } else if (route.name === 'Receipts') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Users') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Add" component={AddExpenseScreen} />
      <Tab.Screen name="Receipts" component={ReceiptsScreen} />
      <Tab.Screen name="Users" component={UsersScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <SmartWalletProvider>
          <NavigationContainer>
            <Stack.Navigator>
              <Stack.Screen 
                name="Main" 
                component={TabNavigator} 
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Receive" 
                component={ReceiveScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="PaymentRequest" 
                component={PaymentRequestScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Savings" 
                component={EnhancedSavingsScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Copilot" 
                component={CopilotScreenDemo}
                options={{ headerShown: false }}
              />
              <Stack.Screen 
                name="Explorer" 
                component={MiniExplorerScreen}
                options={{ headerShown: false }}
              />
            </Stack.Navigator>
          </NavigationContainer>
          <StatusBar style="auto" />
        </SmartWalletProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  // New modern styles
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  notificationButton: {
    padding: 8,
  },
  balanceCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 12,
    flex: 1,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  appInfo: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 13,
    paddingTop: 5,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  // Legacy styles for other screens
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  content: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  settingsContainer: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
    marginTop: 12,
  },
  settingsValue: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  // Add Expense Screen Styles
  addExpenseContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  addExpenseHeader: {
    padding: 20,
    paddingTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  inputSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    paddingVertical: 16,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: '#007AFF',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  categoryTextSelected: {
    color: '#FFFFFF',
  },
  splitTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  splitTypeSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  splitTypeText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
  },
  splitTypeTextSelected: {
    color: '#007AFF',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantDetails: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  participantAddress: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  participantAmount: {
    alignItems: 'flex-end',
  },
  participantAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  addPersonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  addPersonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  addPersonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    flex: 1,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 40,
    gap: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Smart Wallet Status Styles
  smartWalletStatus: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  walletIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  walletAddressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  loginSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginPrompt: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  headerWalletButton: {
    marginRight: 12,
    transform: [{ scale: 0.8 }], // Make it smaller for header
  },
  professionalLoginButton: {
    // Clean container for login button
  },
  walletConnectedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  walletButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  // Wallet Details Card Styles
  walletDetailsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  walletStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  walletStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  walletAddressSection: {
    marginBottom: 16,
  },
  walletAddressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  walletAddressFull: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#374151',
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  walletActions: {
    flexDirection: 'row',
    gap: 12,
  },
  qrButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  qrButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  detailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  logoutButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EF4444',
  },
  // ScrollView Styles
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  // Settings Screen Styles
  settingsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingItem: {
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressText: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  // Professional Settings Styles
  headerSection: {
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 3,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  settingValue: {
    alignItems: 'flex-end',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginLeft: 8,
  },
  addressValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'monospace',
  },
  valueText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'right',
  },
  // Toggle Switch Styles (Blue theme)
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    padding: 2,
    justifyContent: 'center',
  },
  toggleSwitchActive: {
    backgroundColor: '#007AFF', // Blue color
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },
  // Network Badge Styles (Yellow theme)
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7', // Light yellow background
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F59E0B', // Yellow/orange dot
  },
  networkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#92400E', // Dark yellow text
  },
  
  // Live Transactions Styles
  transactionsSection: {
    marginTop: 24,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 14,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionHash: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    fontFamily: 'monospace',
  },
  transactionTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  transactionStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  emptyTransactions: {
    padding: 20,
    alignItems: 'center',
  },
  emptyTransactionsText: {
    color: '#6B7280',
    fontSize: 14,
  },
});
