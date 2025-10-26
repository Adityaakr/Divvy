import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const queryClient = new QueryClient();

// Import enhanced screens (without Privy for now)
import ReceiveScreen from './src/screens/ReceiveScreen';
import PaymentRequestScreen from './src/screens/PaymentRequestScreen';
import EnhancedSavingsScreen from './src/screens/EnhancedSavingsScreen';
import CopilotScreen from './src/screens/CopilotScreen';
import MiniExplorerScreen from './src/screens/MiniExplorerScreen';

// Simple demo home screen
function DemoHomeScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>🚀 SplitSafe Demo</Text>
      <Text style={styles.subtitle}>Complete Web3 DeFi Mobile App</Text>
      <View style={styles.featureList}>
        <Text style={styles.feature}>✅ ASI-Powered Savings Agent</Text>
        <Text style={styles.feature}>✅ Yellow Session Mode (State Channels)</Text>
        <Text style={styles.feature}>✅ QR Code Payments & Deep Links</Text>
        <Text style={styles.feature}>✅ AI Copilot with Blockscout Integration</Text>
        <Text style={styles.feature}>✅ Mini Blockchain Explorer</Text>
        <Text style={styles.feature}>✅ Payment Request Links</Text>
      </View>
      <Text style={styles.instruction}>
        Navigate through the tabs to explore all features!
      </Text>
    </View>
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
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.content}>Manage your app settings and wallet connection</Text>
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
      <Tab.Screen name="Home" component={DemoHomeScreen} />
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
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 32,
    textAlign: 'center',
  },
  featureList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  feature: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    paddingLeft: 8,
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
});
