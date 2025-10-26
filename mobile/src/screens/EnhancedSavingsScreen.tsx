import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Switch,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// Removed Privy dependency for clean demo
import { volatilityOracle, VolLevel } from '../lib/asi/volatilityOracle';
import { savingsPolicy, DecisionLog, SavingsPosition } from '../lib/asi/savingsPolicy';
import { defaultAdapter, AdapterFactory } from '../lib/asi/savingsAdapters';
import { authHelpers } from '../lib/auth/privyClient';
import { formatCurrency } from '../lib/calc';

export default function EnhancedSavingsScreen({ navigation }: any) {
  // Mock user for demo
  const user = {
    wallet: { address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4' },
    linked_accounts: [
      { type: 'wallet', address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4' }
    ]
  };
  const [volatility, setVolatility] = useState<any>(null);
  const [position, setPosition] = useState<SavingsPosition | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<DecisionLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savingsEnabled, setSavingsEnabled] = useState(true);
  const [agentPaused, setAgentPaused] = useState(false);
  const [riskPreference, setRiskPreference] = useState<'Low' | 'Default' | 'High'>('Default');
  const [isProcessing, setIsProcessing] = useState(false);

  const connectedAddress = authHelpers.getPrimaryAddress(user);

  useEffect(() => {
    loadSavingsData();
    
    // Set up real-time volatility updates
    const interval = setInterval(loadVolatilityData, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [connectedAddress]);

  const loadSavingsData = async () => {
    if (!connectedAddress) return;

    try {
      await Promise.all([
        loadVolatilityData(),
        loadPositionData(),
        loadDecisionHistory(),
      ]);
    } catch (error) {
      console.error('Error loading savings data:', error);
    }
  };

  const loadVolatilityData = async () => {
    try {
      const vol = await volatilityOracle.fetchVolatility();
      setVolatility(vol);
    } catch (error) {
      console.error('Error fetching volatility:', error);
    }
  };

  const loadPositionData = async () => {
    if (!connectedAddress) return;

    try {
      const pos = await defaultAdapter.readPosition(connectedAddress);
      setPosition(pos);
    } catch (error) {
      console.error('Error reading position:', error);
    }
  };

  const loadDecisionHistory = () => {
    const history = savingsPolicy.getDecisionHistory();
    setDecisionHistory(history);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSavingsData();
    setIsRefreshing(false);
  };

  const runAgentDecision = async () => {
    if (!connectedAddress || !volatility || agentPaused) return;

    setIsProcessing(true);
    try {
      // Get agent decision
      const decision = await savingsPolicy.decideSavingsAction(
        connectedAddress,
        defaultAdapter,
        volatility
      );

      // Execute if not plan-only
      if (!decision.planOnly && decision.action !== 'HOLD') {
        const result = await savingsPolicy.executeDecision(decision, defaultAdapter);
        
        if (result.mode === 'EXECUTED') {
          Alert.alert(
            'Action Executed',
            `${decision.action} completed successfully!`,
            [
              { text: 'OK' },
              {
                text: 'View on Blockscout',
                onPress: () => decision.blockscoutUrl && Linking.openURL(decision.blockscoutUrl),
              },
            ]
          );
        } else if (result.mode === 'FAILED') {
          Alert.alert('Execution Failed', result.error || 'Unknown error occurred');
        }
      }

      // Refresh data
      await loadSavingsData();
    } catch (error) {
      Alert.alert('Error', 'Failed to run agent decision');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateRiskPreference = (preference: 'Low' | 'Default' | 'High') => {
    setRiskPreference(preference);
    
    // Update max leverage based on preference
    const leverageMap = { Low: 1.05, Default: 1.10, High: 1.12 };
    savingsPolicy.updateConfig({ MAX_LEVERAGE: leverageMap[preference] });
  };

  const getVolatilityColor = (level: VolLevel) => {
    switch (level) {
      case 'LOW': return '#10B981';
      case 'MID': return '#F59E0B';
      case 'HIGH': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getVolatilityLevel = (): VolLevel => {
    if (!volatility) return 'MID';
    return volatilityOracle.getVolatilityLevel(volatility.value);
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() / 1000 - timestamp;
    const minutes = Math.floor(diff / 60);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const volLevel = getVolatilityLevel();
  const riskAssessment = position && volatility ? 
    savingsPolicy.assessRisk(position, volatility.value) : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>ASI Savings Agent</Text>
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
        {/* Volatility Gauge */}
        {volatility && (
          <View style={styles.volatilityContainer}>
            <View style={styles.volatilityHeader}>
              <Text style={styles.sectionTitle}>Market Volatility</Text>
              <View style={[styles.levelBadge, { backgroundColor: getVolatilityColor(volLevel) }]}>
                <Text style={styles.levelText}>{volLevel}</Text>
              </View>
            </View>
            
            <View style={styles.gaugeContainer}>
              <View style={styles.gauge}>
                <View 
                  style={[
                    styles.gaugeFill, 
                    { 
                      width: `${volatility.value}%`,
                      backgroundColor: getVolatilityColor(volLevel)
                    }
                  ]} 
                />
              </View>
              <Text style={styles.gaugeValue}>{volatility.value}/100</Text>
            </View>
            
            <Text style={styles.volatilitySource}>
              Source: {volatility.source} • Updated {volatility.recencySec}s ago
            </Text>
          </View>
        )}

        {/* Agent Controls */}
        <View style={styles.controlsContainer}>
          <Text style={styles.sectionTitle}>Agent Controls</Text>
          
          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Enable Savings</Text>
            <Switch
              value={savingsEnabled}
              onValueChange={setSavingsEnabled}
              trackColor={{ false: '#E5E7EB', true: '#DBEAFE' }}
              thumbColor={savingsEnabled ? '#007AFF' : '#F3F4F6'}
            />
          </View>

          <View style={styles.controlRow}>
            <Text style={styles.controlLabel}>Pause Agent</Text>
            <Switch
              value={agentPaused}
              onValueChange={setAgentPaused}
              trackColor={{ false: '#E5E7EB', true: '#FEE2E2' }}
              thumbColor={agentPaused ? '#EF4444' : '#F3F4F6'}
            />
          </View>

          <View style={styles.riskPreferenceContainer}>
            <Text style={styles.controlLabel}>Risk Preference</Text>
            <View style={styles.riskButtons}>
              {(['Low', 'Default', 'High'] as const).map((pref) => (
                <TouchableOpacity
                  key={pref}
                  style={[
                    styles.riskButton,
                    riskPreference === pref && styles.riskButtonActive
                  ]}
                  onPress={() => updateRiskPreference(pref)}
                >
                  <Text style={[
                    styles.riskButtonText,
                    riskPreference === pref && styles.riskButtonTextActive
                  ]}>
                    {pref}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity 
            style={[
              styles.runAgentButton,
              (isProcessing || agentPaused || !savingsEnabled) && styles.disabledButton
            ]}
            onPress={runAgentDecision}
            disabled={isProcessing || agentPaused || !savingsEnabled}
          >
            {isProcessing ? (
              <Text style={styles.runAgentButtonText}>Processing...</Text>
            ) : (
              <>
                <Ionicons name="play" size={20} color="#FFFFFF" />
                <Text style={styles.runAgentButtonText}>Run Agent Decision</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Current Position */}
        {position && (
          <View style={styles.positionContainer}>
            <Text style={styles.sectionTitle}>Current Position</Text>
            
            <View style={styles.positionCard}>
              <View style={styles.positionHeader}>
                <Text style={styles.protocolName}>{defaultAdapter.name}</Text>
                <View style={styles.positionBadges}>
                  {!defaultAdapter.isExecutable && (
                    <View style={styles.demoBadge}>
                      <Text style={styles.demoText}>DEMO</Text>
                    </View>
                  )}
                  {riskAssessment && (
                    <View style={[
                      styles.riskBadge,
                      { backgroundColor: getVolatilityColor(riskAssessment.riskLevel as any) }
                    ]}>
                      <Text style={styles.riskText}>{riskAssessment.riskLevel} RISK</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.positionMetrics}>
                <View style={styles.positionMetric}>
                  <Text style={styles.metricLabel}>Deposited</Text>
                  <Text style={styles.metricValue}>${position.deposited}</Text>
                </View>
                <View style={styles.positionMetric}>
                  <Text style={styles.metricLabel}>Borrowed</Text>
                  <Text style={styles.metricValue}>${position.borrowed}</Text>
                </View>
                <View style={styles.positionMetric}>
                  <Text style={styles.metricLabel}>Leverage</Text>
                  <Text style={styles.metricValue}>{position.leverage.toFixed(2)}x</Text>
                </View>
                <View style={styles.positionMetric}>
                  <Text style={styles.metricLabel}>APY</Text>
                  <Text style={[styles.metricValue, { color: '#10B981' }]}>
                    {position.apy.toFixed(1)}%
                  </Text>
                </View>
              </View>

              {position.healthFactor && (
                <View style={styles.healthFactorContainer}>
                  <Text style={styles.healthFactorLabel}>Health Factor</Text>
                  <Text style={[
                    styles.healthFactorValue,
                    { color: position.healthFactor > 2 ? '#10B981' : '#EF4444' }
                  ]}>
                    {position.healthFactor.toFixed(2)}
                  </Text>
                </View>
              )}

              {riskAssessment && (
                <View style={styles.riskAssessmentContainer}>
                  <Text style={styles.riskAssessmentTitle}>Risk Assessment</Text>
                  <Text style={styles.riskRecommendation}>{riskAssessment.recommendation}</Text>
                  {riskAssessment.factors.length > 0 && (
                    <View style={styles.riskFactors}>
                      {riskAssessment.factors.map((factor, index) => (
                        <Text key={index} style={styles.riskFactor}>• {factor}</Text>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Decision History */}
        <View style={styles.historyContainer}>
          <Text style={styles.sectionTitle}>Decision Log</Text>
          
          {decisionHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="analytics-outline" size={48} color="#6B7280" />
              <Text style={styles.emptyHistoryText}>No decisions yet</Text>
              <Text style={styles.emptyHistorySubtext}>
                Run the agent to see decision history
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {decisionHistory.slice(0, 10).map((decision) => (
                <View key={decision.id} style={styles.decisionCard}>
                  <View style={styles.decisionHeader}>
                    <View style={styles.decisionInfo}>
                      <Text style={styles.decisionAction}>{decision.action}</Text>
                      <Text style={styles.decisionTime}>{formatTimeAgo(decision.ts)}</Text>
                    </View>
                    <View style={styles.decisionBadges}>
                      <View style={[
                        styles.volBadge,
                        { backgroundColor: getVolatilityColor(decision.volLevel) }
                      ]}>
                        <Text style={styles.volBadgeText}>{decision.volValue}</Text>
                      </View>
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceText}>
                          {Math.round(decision.confidence * 100)}%
                        </Text>
                      </View>
                      {decision.planOnly ? (
                        <View style={styles.planOnlyBadge}>
                          <Text style={styles.planOnlyText}>PLAN</Text>
                        </View>
                      ) : decision.txHash ? (
                        <TouchableOpacity
                          style={styles.executedBadge}
                          onPress={() => decision.blockscoutUrl && Linking.openURL(decision.blockscoutUrl)}
                        >
                          <Text style={styles.executedText}>EXECUTED</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                  
                  <Text style={styles.decisionReason}>{decision.reason}</Text>
                  
                  {decision.targetLeverage !== 1.0 && (
                    <Text style={styles.decisionTarget}>
                      Target Leverage: {decision.targetLeverage}x
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Safety Information */}
        <View style={styles.safetyContainer}>
          <Text style={styles.safetyTitle}>Safety Guarantees</Text>
          <Text style={styles.safetyText}>
            • Escrowed funds are never touched - only opt-in group pot is used
          </Text>
          <Text style={styles.safetyText}>
            • Maximum leverage capped at {savingsPolicy.getConfig().MAX_LEVERAGE}x
          </Text>
          <Text style={styles.safetyText}>
            • Health factor always maintained above {savingsPolicy.getConfig().MIN_HEALTH}
          </Text>
          <Text style={styles.safetyText}>
            • All decisions logged with confidence scores and reasoning
          </Text>
          <Text style={styles.safetyText}>
            • {defaultAdapter.isExecutable ? 'Live execution on' : 'Demo mode on'} {defaultAdapter.name}
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
  refreshButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  volatilityContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  volatilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  levelText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  gaugeContainer: {
    marginBottom: 12,
  },
  gauge: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 4,
  },
  gaugeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  volatilitySource: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  controlsContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  riskPreferenceContainer: {
    paddingTop: 12,
  },
  riskButtons: {
    flexDirection: 'row',
    marginTop: 8,
  },
  riskButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  riskButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  riskButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  riskButtonTextActive: {
    color: '#FFFFFF',
  },
  runAgentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  runAgentButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  positionContainer: {
    marginBottom: 20,
  },
  positionCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  positionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  protocolName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  positionBadges: {
    flexDirection: 'row',
    gap: 8,
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
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  positionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  positionMetric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  healthFactorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    marginBottom: 12,
  },
  healthFactorLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  healthFactorValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  riskAssessmentContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  riskAssessmentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  riskRecommendation: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  riskFactors: {
    marginTop: 4,
  },
  riskFactor: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  historyContainer: {
    marginBottom: 20,
  },
  emptyHistory: {
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
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  historyList: {
    gap: 12,
  },
  decisionCard: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  decisionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  decisionInfo: {
    flex: 1,
  },
  decisionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  decisionTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  decisionBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  volBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  volBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  confidenceBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  planOnlyBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  planOnlyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626',
  },
  executedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  executedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#059669',
  },
  decisionReason: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  decisionTarget: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  safetyContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  safetyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  safetyText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    lineHeight: 20,
  },
});
