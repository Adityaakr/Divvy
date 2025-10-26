import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { usePrivy } from '@privy-io/expo';
import { asiAgent } from '../lib/savings/asiAgent';
import { formatCurrency } from '../lib/calc';

export default function SavingsScreen({ navigation }: any) {
  const { user } = usePrivy();
  const [yieldOpportunities, setYieldOpportunities] = useState<any[]>([]);
  const [savingsPositions, setSavingsPositions] = useState<any[]>([]);
  const [agentRecommendation, setAgentRecommendation] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalYield, setTotalYield] = useState(0);

  useEffect(() => {
    loadSavingsData();
  }, []);

  const loadSavingsData = async () => {
    try {
      const opportunities = asiAgent.getYieldOpportunities();
      const positions = asiAgent.getSavingsPositions();
      
      setYieldOpportunities(opportunities);
      setSavingsPositions(positions);
      
      // Calculate total yield
      const total = positions.reduce((sum, pos) => sum + pos.totalYield, 0);
      setTotalYield(total);

      // Get agent recommendation for mock group
      const mockAnalytics = {
        groupId: 'mock-group',
        totalPot: 500,
        averageTTL: 4 * 60 * 60 * 1000, // 4 hours
        claimFrequency: 0.3,
        refundRate: 0.1,
        lastActivity: Date.now() - 60 * 60 * 1000, // 1 hour ago
      };
      
      const recommendation = await asiAgent.analyzeGroup(mockAnalytics);
      setAgentRecommendation(recommendation);
    } catch (error) {
      console.error('Error loading savings data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSavingsData();
    setIsRefreshing(false);
  };

  const handleDeposit = async (opportunity: any) => {
    Alert.alert(
      'Deposit to Savings',
      `Deposit PYUSD to ${opportunity.protocol} for ${opportunity.apr}% APR?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deposit $100',
          onPress: async () => {
            try {
              await asiAgent.depositToSavings(opportunity.protocol, 'PYUSD', 100);
              Alert.alert('Success', `Deposited $100 to ${opportunity.protocol}`);
              loadSavingsData();
            } catch (error) {
              Alert.alert('Error', 'Failed to deposit to savings');
            }
          },
        },
      ]
    );
  };

  const handleWithdraw = async (position: any) => {
    Alert.alert(
      'Withdraw from Savings',
      `Withdraw $${position.amount.toFixed(2)} from ${position.protocol}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              await asiAgent.withdrawFromSavings(position.id);
              Alert.alert('Success', 'Withdrawal initiated');
              loadSavingsData();
            } catch (error) {
              Alert.alert('Error', 'Failed to withdraw from savings');
            }
          },
        },
      ]
    );
  };

  const handleFollowRecommendation = async () => {
    if (!agentRecommendation) return;

    if (agentRecommendation.type === 'ENABLE_SAVINGS') {
      const bestOpportunity = asiAgent.getBestYieldOpportunity();
      await handleDeposit(bestOpportunity);
    } else if (agentRecommendation.type === 'WITHDRAW_SAVINGS') {
      const activePosition = savingsPositions.find(p => p.status === 'ACTIVE');
      if (activePosition) {
        await handleWithdraw(activePosition);
      }
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'LOW': return '#10B981';
      case 'MEDIUM': return '#F59E0B';
      case 'HIGH': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#10B981';
      case 'WITHDRAWING': return '#F59E0B';
      case 'WITHDRAWN': return '#6B7280';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Savings & Yield</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Total Yield Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Total Yield Earned</Text>
          <Text style={styles.summaryAmount}>{formatCurrency(totalYield)}</Text>
          <Text style={styles.summarySubtext}>
            From {savingsPositions.filter(p => p.status === 'ACTIVE').length} active positions
          </Text>
        </View>

        {/* AI Agent Recommendation */}
        {agentRecommendation && (
          <View style={styles.recommendationContainer}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="bulb" size={20} color="#F59E0B" />
              <Text style={styles.recommendationTitle}>AI Agent Recommendation</Text>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>{agentRecommendation.confidence}%</Text>
              </View>
            </View>
            
            <Text style={styles.recommendationDescription}>
              {agentRecommendation.description}
            </Text>
            
            <Text style={styles.recommendationReasoning}>
              {agentRecommendation.reasoning}
            </Text>

            {agentRecommendation.actions.length > 0 && (
              <TouchableOpacity 
                onPress={handleFollowRecommendation}
                style={styles.recommendationAction}
              >
                <Text style={styles.recommendationActionText}>
                  Follow Recommendation
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Active Positions */}
        {savingsPositions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Positions</Text>
            {savingsPositions.map((position) => (
              <View key={position.id} style={styles.positionCard}>
                <View style={styles.positionHeader}>
                  <View>
                    <Text style={styles.positionProtocol}>{position.protocol}</Text>
                    <Text style={styles.positionToken}>{position.token}</Text>
                  </View>
                  <View style={styles.positionStatus}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(position.status) }]} />
                    <Text style={[styles.statusText, { color: getStatusColor(position.status) }]}>
                      {position.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.positionMetrics}>
                  <View style={styles.positionMetric}>
                    <Text style={styles.metricLabel}>Amount</Text>
                    <Text style={styles.metricValue}>{formatCurrency(position.amount)}</Text>
                  </View>
                  <View style={styles.positionMetric}>
                    <Text style={styles.metricLabel}>APR</Text>
                    <Text style={styles.metricValue}>{position.apr.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.positionMetric}>
                    <Text style={styles.metricLabel}>Yield</Text>
                    <Text style={[styles.metricValue, { color: '#10B981' }]}>
                      {formatCurrency(position.totalYield)}
                    </Text>
                  </View>
                </View>

                {position.status === 'ACTIVE' && (
                  <TouchableOpacity 
                    onPress={() => handleWithdraw(position)}
                    style={styles.withdrawButton}
                  >
                    <Text style={styles.withdrawButtonText}>Withdraw</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Yield Opportunities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Opportunities</Text>
          {yieldOpportunities.map((opportunity, index) => (
            <View key={index} style={styles.opportunityCard}>
              <View style={styles.opportunityHeader}>
                <View>
                  <Text style={styles.opportunityProtocol}>{opportunity.protocol}</Text>
                  <Text style={styles.opportunityDescription}>{opportunity.description}</Text>
                </View>
                <View style={styles.opportunityAPR}>
                  <Text style={styles.aprValue}>{opportunity.apr.toFixed(1)}%</Text>
                  <Text style={styles.aprLabel}>APR</Text>
                </View>
              </View>

              <View style={styles.opportunityMetrics}>
                <View style={styles.opportunityMetric}>
                  <Text style={styles.metricLabel}>TVL</Text>
                  <Text style={styles.metricValue}>
                    {formatCurrency(opportunity.tvl)}
                  </Text>
                </View>
                <View style={styles.opportunityMetric}>
                  <Text style={styles.metricLabel}>Risk</Text>
                  <Text style={[styles.metricValue, { color: getRiskColor(opportunity.riskLevel) }]}>
                    {opportunity.riskLevel}
                  </Text>
                </View>
                <View style={styles.opportunityMetric}>
                  <Text style={styles.metricLabel}>Token</Text>
                  <Text style={styles.metricValue}>{opportunity.token}</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => handleDeposit(opportunity)}
                style={styles.depositButton}
              >
                <Text style={styles.depositButtonText}>Deposit</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Cross-Chain Plans (Demo) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cross-Chain Opportunities</Text>
          <View style={styles.crossChainCard}>
            <View style={styles.crossChainHeader}>
              <Ionicons name="swap-horizontal" size={20} color="#8B5CF6" />
              <Text style={styles.crossChainTitle}>Bridge to Polygon</Text>
              <View style={styles.demoBadge}>
                <Text style={styles.demoText}>DEMO</Text>
              </View>
            </View>
            <Text style={styles.crossChainDescription}>
              Higher yields available on Polygon (6.2% APR)
            </Text>
            <View style={styles.crossChainMetrics}>
              <Text style={styles.crossChainMetric}>Bridge time: ~5 minutes</Text>
              <Text style={styles.crossChainMetric}>Estimated cost: $2.50</Text>
            </View>
            <TouchableOpacity style={styles.crossChainButton} disabled>
              <Text style={styles.crossChainButtonText}>Not Executable (Demo)</Text>
            </TouchableOpacity>
          </View>
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
  refreshButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#10B981',
    marginBottom: 4,
  },
  summarySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  recommendationContainer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
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
    flex: 1,
  },
  confidenceBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  positionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  positionProtocol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  positionToken: {
    fontSize: 14,
    color: '#6B7280',
  },
  positionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  positionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  positionMetric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  withdrawButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  withdrawButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  opportunityCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  opportunityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  opportunityProtocol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  opportunityDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  opportunityAPR: {
    alignItems: 'center',
  },
  aprValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10B981',
  },
  aprLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  opportunityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  opportunityMetric: {
    alignItems: 'center',
  },
  depositButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  depositButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  crossChainCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    opacity: 0.7,
  },
  crossChainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  crossChainTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  demoBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  demoText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  crossChainDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  crossChainMetrics: {
    marginBottom: 12,
  },
  crossChainMetric: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  crossChainButton: {
    backgroundColor: '#9CA3AF',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  crossChainButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
