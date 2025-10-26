import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PrivyProvider, usePrivy } from '@privy-io/expo';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient();

// Real Privy configuration for web
const PRIVY_APP_ID = 'cmh7ao9bf009tjy0cs74zy2j4';

// Import all real screens
import ReceiveScreen from './src/screens/ReceiveScreen';
import PaymentRequestScreen from './src/screens/PaymentRequestScreen';
import EnhancedSavingsScreen from './src/screens/EnhancedSavingsScreen';
import CopilotScreen from './src/screens/CopilotScreen';
import MiniExplorerScreen from './src/screens/MiniExplorerScreen';
import LoginScreen from './src/screens/LoginScreen';

// Real authenticated home screen
function AuthenticatedHomeScreen({ navigation }: any) {
  const { user, logout } = usePrivy();

  const getPrimaryAddress = (user: any): string | null => {
    if (!user) return null;
    
    // Try embedded wallet first
    if (user.wallet?.address) {
      return user.wallet.address;
    }
    
    // Try linked wallet accounts
    const walletAccount = user.linked_accounts?.find(
      (account: any) => account.type === 'wallet' && account.address
    );
    
    return walletAccount?.address || null;
  };

  const userAddress = getPrimaryAddress(user);
  const displayName = user?.email?.address?.split('@')[0] || 
                     (userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'User');

  return (
    <View style={styles.screen}>
      {/* User Info Header */}
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.welcomeText}>Welcome back, {displayName}!</Text>
          {userAddress && (
            <Text style={styles.addressText}>
              Wallet: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>🚀 Divvy</Text>
      <Text style={styles.subtitle}>Split bills seamlessly, settle with PYUSD, and optimize yields via AI agents across chains.</Text>
      
      <View style={styles.featureGrid}>
        <View style={styles.featureCard}>
          <Ionicons name="analytics-outline" size={32} color="#007AFF" />
          <Text style={styles.featureTitle}>ASI Savings Agent</Text>
          <Text style={styles.featureDesc}>AI-powered yield optimization</Text>
        </View>
        
        <View style={styles.featureCard}>
          <Ionicons name="flash-outline" size={32} color="#10B981" />
          <Text style={styles.featureTitle}>Yellow Sessions</Text>
          <Text style={styles.featureDesc}>State channel batching</Text>
        </View>
        
        <View style={styles.featureCard}>
          <Ionicons name="qr-code-outline" size={32} color="#8B5CF6" />
          <Text style={styles.featureTitle}>QR Payments</Text>
          <Text style={styles.featureDesc}>Instant payment links</Text>
        </View>
        
        <View style={styles.featureCard}>
          <Ionicons name="chatbubble-ellipses-outline" size={32} color="#F59E0B" />
          <Text style={styles.featureTitle}>AI Copilot</Text>
          <Text style={styles.featureDesc}>Blockscout integration</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#007AFF' }]}
            onPress={() => navigation.navigate('Receive')}
          >
            <Ionicons name="download-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Receive</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => navigation.navigate('PaymentRequest')}
          >
            <Ionicons name="share-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Request</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#8B5CF6' }]}
            onPress={() => navigation.navigate('Savings')}
          >
            <Ionicons name="trending-up-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Savings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#F59E0B' }]}
            onPress={() => navigation.navigate('Copilot')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>AI Copilot</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.fullWidthButton, { backgroundColor: '#6B7280' }]}
          onPress={() => navigation.navigate('Explorer')}
        >
          <Ionicons name="globe-outline" size={20} color="#FFFFFF" />
          <Text style={styles.buttonText}>Blockchain Explorer</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.instruction}>
        🎯 Real Web3 DeFi features with live data
      </Text>
    </View>
  );
}

import { TouchableOpacity } from 'react-native';

// Authentication wrapper component
function AuthenticatedApp() {
  const { user, ready } = usePrivy();
  const authenticated = !!user;

  // Show loading while Privy initializes
  if (!ready) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Divvy...</Text>
      </View>
    );
  }

  // Show login screen if not authenticated
  if (!authenticated) {
    return <LoginScreen />;
  }

  // Show main app if authenticated
  return (
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
          component={CopilotScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Explorer" 
          component={MiniExplorerScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Simple placeholder screens for tabs
function AddExpenseScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Add Expense</Text>
      <Text style={styles.content}>Add a new expense to split with your group</Text>
    </View>
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
  const { user, logout } = usePrivy();
  
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.content}>Manage your app settings and wallet connection</Text>
      
      {user && (
        <View style={styles.settingsContainer}>
          <Text style={styles.settingsLabel}>Connected Account:</Text>
          <Text style={styles.settingsValue}>
            {user.email?.address || 'No email'}
          </Text>
          
          <TouchableOpacity style={styles.logoutButton} onPress={logout}>
            <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      )}
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
      <Tab.Screen name="Home" component={AuthenticatedHomeScreen} />
      <Tab.Screen name="Add" component={AddExpenseScreen} />
      <Tab.Screen name="Receipts" component={ReceiptsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider 
        appId={PRIVY_APP_ID}
        config={{
          embeddedWallets: {
            createOnLogin: 'users-without-wallets',
            requireUserPasswordOnCreate: false,
          },
          appearance: { 
            theme: 'light', 
            accentColor: '#007AFF',
          },
        }}
      >
        <SafeAreaProvider>
          <AuthenticatedApp />
          <StatusBar style="auto" />
        </SafeAreaProvider>
      </PrivyProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  userInfo: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  addressText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'monospace',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  actionButtons: {
    width: '100%',
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    gap: 8,
  },
  fullWidthButton: {
    marginHorizontal: 4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instruction: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
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
  },
  settingsValue: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
});
