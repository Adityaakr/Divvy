import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/expo';
import { useStore } from '../lib/store';
import { calculateBalances, formatCurrency, generateId } from '../lib/calc';
import { authHelpers } from '../lib/auth/privyClient';
import { clearNodeClient } from '../lib/yellow/clearNodeClient';
import { asiAgent } from '../lib/savings/asiAgent';

export default function EnhancedHomeScreen({ navigation }: any) {
  const { login, logout, user, isAuthenticated, isLoading } = usePrivy();
  const { groups, addGroup, expenses, getExpensesByGroup, getGlobalMetrics } = useStore();
  const metrics = getGlobalMetrics();
  
  const [sessionMode, setSessionMode] = useState(false);
  const [savingsEnabled, setSavingsEnabled] = useState(false);
  const [agentRecommendation, setAgentRecommendation] = useState<any>(null);

  const connectedAddress = authHelpers.getPrimaryAddress(user);
  const displayName = authHelpers.getDisplayName(user);

  useEffect(() => {
    // Initialize Yellow session mode if enabled
    if (clearNodeClient.isEnabled()) {
      console.log('Yellow/ClearNode integration enabled');
    }

    // Get AI agent recommendation for the first group
    if (groups.length > 0 && connectedAddress) {
      const firstGroup = groups[0];
      const groupExpenses = getExpensesByGroup(firstGroup.id);
      const analytics = asiAgent.calculateGroupAnalytics(firstGroup.id, groupExpenses, []);
      
      asiAgent.analyzeGroup(analytics).then(recommendation => {
        setAgentRecommendation(recommendation);
      });
    }
  }, [groups, connectedAddress]);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      Alert.alert('Login Error', 'Failed to login. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      Alert.alert('Logout Error', 'Failed to logout. Please try again.');
    }
  };

  const toggleSessionMode = () => {
    setSessionMode(!sessionMode);
    if (!sessionMode && clearNodeClient.isEnabled()) {
      clearNodeClient.createSession();
      Alert.alert('Session Mode', 'Yellow session mode enabled. Escrows will be queued for batch settlement.');
    } else {
      clearNodeClient.clearSession();
      Alert.alert('Session Mode', 'Session mode disabled.');
    }
  };

  const toggleSavings = async () => {
    if (!savingsEnabled && agentRecommendation?.type === 'ENABLE_SAVINGS') {
      try {
        const opportunity = asiAgent.getBestYieldOpportunity();
        await asiAgent.depositToSavings(opportunity.protocol, 'PYUSD', 100); // Example amount
        setSavingsEnabled(true);
        Alert.alert('Savings Enabled', `Now earning ${opportunity.apr}% APR on PYUSD`);
      } catch (error) {
        Alert.alert('Error', 'Failed to enable savings');
      }
    } else {
      setSavingsEnabled(false);
      Alert.alert('Savings Disabled', 'Funds withdrawn from yield protocols');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>Split<Text style={styles.logoAccent}>Safe</Text></Text>
            <Text style={styles.tagline}>Split bills. Settle with PYUSD. Claim or refund safely.</Text>
          </View>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Ionicons name="people" size={24} color="#007AFF" />
              <Text style={styles.featureText}>Create expense groups</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="flash" size={24} color="#FFD700" />
              <Text style={styles.featureText}>Yellow session mode</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="trending-up" size={24} color="#10B981" />
              <Text style={styles.featureText}>AI-powered savings</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="qr-code" size={24} color="#8B5CF6" />
              <Text style={styles.featureText}>QR payments & sharing</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Connect Wallet & Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header with user info */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>
              Split<Text style={styles.titleAccent}>Safe</Text>
            </Text>
            <Text style={styles.welcomeText}>Welcome back, {displayName}</Text>
            {connectedAddress && (
              <Text style={styles.addressText}>
                {authHelpers.formatAddress(connectedAddress)}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Session Mode Toggle */}
        {clearNodeClient.isEnabled() && (
          <View style={[styles.modeContainer, sessionMode && styles.sessionModeActive]}>
            <View style={styles.modeInfo}>
              <Ionicons 
                name="flash" 
                size={20} 
                color={sessionMode ? "#FFD700" : "#6B7280"} 
              />
              <Text style={[styles.modeText, sessionMode && styles.sessionModeText]}>
                Session Mode {sessionMode ? 'ON' : 'OFF'}
              </Text>
            </View>
            <TouchableOpacity onPress={toggleSessionMode} style={styles.modeToggle}>
              <Text style={styles.modeToggleText}>
                {sessionMode ? 'Disable' : 'Enable'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AI Agent Recommendation */}
        {agentRecommendation && (
          <View style={styles.recommendationContainer}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.recommendationTitle}>{agentRecommendation.title}</Text>
            </View>
            <Text style={styles.recommendationDescription}>
              {agentRecommendation.description}
            </Text>
            <Text style={styles.recommendationReasoning}>
              {agentRecommendation.reasoning}
            </Text>
            {agentRecommendation.type === 'ENABLE_SAVINGS' && (
              <TouchableOpacity onPress={toggleSavings} style={styles.recommendationAction}>
                <Text style={styles.recommendationActionText}>
                  {savingsEnabled ? 'Disable Savings' : 'Enable Savings'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatCurrency(metrics.escrowed)}</Text>
            <Text style={styles.metricLabel}>Escrowed</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatCurrency(metrics.claimed)}</Text>
            <Text style={styles.metricLabel}>Claimed</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatCurrency(metrics.refunded)}</Text>
            <Text style={styles.metricLabel}>Refunded</Text>
          </View>
        </View>

        {/* Groups Section */}
        <View style={styles.groupsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Groups</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CreateGroup')}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
              <Text style={styles.addButtonText}>New Group</Text>
            </TouchableOpacity>
          </View>

          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={48} color="#007AFF" />
              </View>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your first group to start splitting expenses
              </Text>
            </View>
          ) : (
            <View style={styles.groupsList}>
              {groups.map((group) => {
                const groupExpenses = getExpensesByGroup(group.id);
                const balances = calculateBalances(groupExpenses, group.members);
                const myBalance = connectedAddress
                  ? balances.find(b => b.member === connectedAddress)?.amount || 0
                  : 0;

                return (
                  <TouchableOpacity
                    key={group.id}
                    style={styles.groupCard}
                    onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
                  >
                    <View style={styles.groupHeader}>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.memberCount}>{group.members.length} members</Text>
                    </View>
                    <View style={styles.balanceContainer}>
                      <Text style={styles.balanceLabel}>Your balance:</Text>
                      <Text style={[
                        styles.balanceAmount,
                        { color: myBalance >= 0 ? '#10B981' : '#EF4444' }
                      ]}>
                        {formatCurrency(myBalance)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#6B7280',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  logoAccent: {
    color: '#007AFF',
  },
  tagline: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 12,
  },
  loginButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  titleAccent: {
    color: '#007AFF',
  },
  welcomeText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 2,
  },
  addressText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  logoutButton: {
    padding: 8,
  },
  modeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  sessionModeActive: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FFD700',
  },
  modeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  sessionModeText: {
    color: '#F59E0B',
  },
  modeToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  modeToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  recommendationContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 4,
  },
  recommendationReasoning: {
    fontSize: 12,
    color: '#A16207',
    marginBottom: 12,
  },
  recommendationAction: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  recommendationActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  groupsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyIcon: {
    backgroundColor: '#E3F2FD',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  groupsList: {
    gap: 12,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupHeader: {
    marginBottom: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
});
