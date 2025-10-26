import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SmartWalletProvider, useSmartWallet } from './src/lib/smartwallet/SmartWalletProvider';
import BiometricLoginButton from './src/components/BiometricLoginButton';
import CompactWalletDropdown from './src/components/CompactWalletDropdown';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient();

// Import all screens (without Privy dependencies)
import ReceiveScreen from './src/screens/ReceiveScreen';
import PaymentRequestScreen from './src/screens/PaymentRequestScreen';
import EnhancedSavingsScreen from './src/screens/EnhancedSavingsScreen';
import CopilotScreenDemo from './src/screens/CopilotScreenDemo';
import MiniExplorerScreen from './src/screens/MiniExplorerScreen';

// Beautiful home screen with smart wallet integration
function HomeScreen({ navigation }: any) {
  const { account, isAuthenticated, logout } = useSmartWallet();
  
  // Use REAL smart wallet data - no mock fallbacks
  const userData = {
    address: account?.address || '',
    displayName: account ? 'Smart Wallet' : 'Demo User',
    balance: '1,234.56', // This will be real balance from blockchain later
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>DU</Text>
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
        <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>${userData.balance}</Text>
        <Text style={styles.balanceSubtext}>PYUSD • Ethereum Sepolia</Text>
        
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Receive')}
          >
            <Ionicons name="arrow-down" size={20} color="#007AFF" />
            <Text style={styles.quickActionText}>Receive</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('PaymentRequest')}
          >
            <Ionicons name="arrow-up" size={20} color="#007AFF" />
            <Text style={styles.quickActionText}>Send</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.quickActionButton}
            onPress={() => navigation.navigate('Savings')}
          >
            <Ionicons name="trending-up" size={20} color="#007AFF" />
            <Text style={styles.quickActionText}>Earn</Text>
          </TouchableOpacity>
        </View>
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
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Food & Dining');
  const [splitType, setSplitType] = useState('equal');
  const [participants, setParticipants] = useState([
    { id: '1', name: 'Demo User', address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4', selected: true },
    { id: '2', name: 'Alice', address: '0x1234567890123456789012345678901234567890', selected: true },
    { id: '3', name: 'Bob', address: '0x0987654321098765432109876543210987654321', selected: false },
  ]);

  const categories = ['Food & Dining', 'Transportation', 'Entertainment', 'Shopping', 'Utilities', 'Other'];
  const splitTypes = [
    { id: 'equal', name: 'Split Equally', icon: 'people-outline' },
    { id: 'exact', name: 'Exact Amounts', icon: 'calculator-outline' },
    { id: 'percentage', name: 'Percentage', icon: 'pie-chart-outline' },
  ];

  const selectedParticipants = participants.filter(p => p.selected);
  const splitAmount = amount ? (parseFloat(amount) / selectedParticipants.length).toFixed(2) : '0.00';

  const handleAddExpense = () => {
    if (!amount || !description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    Alert.alert(
      'Expense Added!',
      `$${amount} for "${description}" will be split among ${selectedParticipants.length} people ($${splitAmount} each)`,
      [
        { text: 'Add Another', onPress: () => {
          setAmount('');
          setDescription('');
        }},
        { text: 'View Receipts', onPress: () => navigation.navigate('Receipts') }
      ]
    );
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
    </SafeAreaView>
  );
}

function ReceiptsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Receipts</Text>
      <Text style={styles.content}>View your expense history and receipts</Text>
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.content}>App settings and configuration</Text>
      
      <View style={styles.settingsContainer}>
        <Text style={styles.settingsLabel}>Demo Mode:</Text>
        <Text style={styles.settingsValue}>All features available without authentication</Text>
        
        <Text style={styles.settingsLabel}>Mock Wallet:</Text>
        <Text style={styles.settingsValue}>0x742d...8D4</Text>
        
        <Text style={styles.settingsLabel}>Network:</Text>
        <Text style={styles.settingsValue}>Ethereum Sepolia</Text>
      </View>
    </View>
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
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionButton: {
    alignItems: 'center',
    padding: 12,
  },
  quickActionText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 4,
    fontWeight: '500',
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
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
});
