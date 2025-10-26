import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { blockscoutCopilot } from '../lib/copilot/handlers';

export default function CopilotScreenDemo({ navigation }: any) {
  // Mock user for demo
  const mockUser = {
    id: 'demo_user',
    wallet: { address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4' },
    linked_accounts: [
      { type: 'wallet', address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4' }
    ]
  };

  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [queryHistory, setQueryHistory] = useState<any[]>([]);

  const connectedAddress = mockUser.wallet.address;

  const quickQueries = [
    {
      title: 'Explain Transaction',
      description: 'Analyze a transaction hash',
      icon: 'search-outline',
      placeholder: 'Enter transaction hash (0x...)',
      action: 'explain_tx',
    },
    {
      title: 'Check Spender Risk',
      description: 'Analyze token approval risks',
      icon: 'shield-checkmark-outline',
      placeholder: 'Enter spender address (0x...)',
      action: 'check_spender',
    },
    {
      title: 'Settlement Plan',
      description: 'Get optimal settlement strategy',
      icon: 'analytics-outline',
      placeholder: 'Who still owes me?',
      action: 'settlement_plan',
    },
  ];

  const handleQuickQuery = (queryType: string) => {
    switch (queryType) {
      case 'explain_tx':
        setQuery('Explain transaction: ');
        break;
      case 'check_spender':
        setQuery('Is this spender risky: ');
        break;
      case 'settlement_plan':
        setQuery('Who still owes me?');
        handleSubmitQuery('Who still owes me?');
        break;
    }
  };

  const handleSubmitQuery = async (queryText?: string) => {
    const currentQuery = queryText || query;
    if (!currentQuery.trim()) return;

    setIsLoading(true);
    setResponse(null);

    try {
      let copilotResponse;

      // Parse query type and execute appropriate action
      if (currentQuery.toLowerCase().includes('explain transaction') || currentQuery.startsWith('0x')) {
        const txHash = currentQuery.includes('0x') 
          ? currentQuery.match(/0x[a-fA-F0-9]{64}/)?.[0] 
          : currentQuery.replace(/explain transaction:?\s*/i, '').trim();
        
        if (txHash) {
          copilotResponse = await blockscoutCopilot.explainTransaction(txHash as `0x${string}`);
        } else {
          throw new Error('Invalid transaction hash');
        }
      } else if (currentQuery.toLowerCase().includes('spender') || currentQuery.toLowerCase().includes('risky')) {
        const spenderAddress = currentQuery.match(/0x[a-fA-F0-9]{40}/)?.[0];
        
        if (spenderAddress && connectedAddress) {
          copilotResponse = await blockscoutCopilot.analyzeSpenderRisk(spenderAddress as `0x${string}`, connectedAddress as `0x${string}`);
        } else {
          throw new Error('Invalid spender address or no wallet connected');
        }
      } else if (currentQuery.toLowerCase().includes('owe') || currentQuery.toLowerCase().includes('settlement')) {
        if (connectedAddress) {
          // Mock group members for demo
          const mockMembers = [
            connectedAddress,
            '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4',
            '0x8ba1f109551bD432803012645Hac136c0532925a',
          ];
          copilotResponse = await blockscoutCopilot.generateSettlementPlan(connectedAddress as `0x${string}`, mockMembers);
        } else {
          throw new Error('No wallet connected');
        }
      } else {
        // Generic response for unrecognized queries
        copilotResponse = {
          title: 'Query Not Recognized',
          summary: 'I can help you with transaction analysis, spender risk assessment, and settlement planning. Try one of the quick queries above.',
          actions: [],
        };
      }

      setResponse(copilotResponse);
      
      // Add to history
      const historyItem = {
        id: Date.now(),
        query: currentQuery,
        response: copilotResponse,
        timestamp: new Date().toLocaleTimeString(),
      };
      setQueryHistory(prev => [historyItem, ...prev.slice(0, 4)]); // Keep last 5 queries
      
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to process query');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionPress = (action: any) => {
    switch (action.type) {
      case 'view':
        Alert.alert('View Transaction', `Would open Blockscout for tx: ${action.data.txHash}`);
        break;
      case 'revoke':
        Alert.alert('Revoke Approvals', `Would revoke approvals for: ${action.data.spenderAddress}`);
        break;
      case 'limit':
        Alert.alert('Limit Approvals', `Would set spending limits for: ${action.data.spenderAddress}`);
        break;
      case 'settle':
        Alert.alert('Create Settlement', `Would create settlement for: $${action.data.amount || 'amount'}`);
        break;
      case 'approve':
        Alert.alert('Approve Tokens', `Would approve ${action.data.token} spending`);
        break;
      default:
        Alert.alert('Action', `Would execute: ${action.title}`);
    }
  };

  const getRiskScoreColor = (score?: number) => {
    if (!score) return '#6B7280';
    if (score >= 7) return '#EF4444';
    if (score >= 4) return '#F59E0B';
    return '#10B981';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>AI Copilot</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Demo Banner */}
        <View style={styles.demoBanner}>
          <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
          <Text style={styles.demoText}>Demo Mode - Using mock wallet: {connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</Text>
        </View>

        {/* Query Input */}
        <View style={styles.queryContainer}>
          <Text style={styles.queryLabel}>Ask me anything about transactions, risks, or settlements</Text>
          <View style={styles.queryInputContainer}>
            <TextInput
              style={styles.queryInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Enter your question or transaction hash..."
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              onPress={() => handleSubmitQuery()}
              style={[styles.submitButton, (!query.trim() || isLoading) && styles.disabledButton]}
              disabled={!query.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Queries */}
        <View style={styles.quickQueriesContainer}>
          <Text style={styles.sectionTitle}>Quick Queries</Text>
          {quickQueries.map((quickQuery, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quickQueryCard}
              onPress={() => handleQuickQuery(quickQuery.action)}
            >
              <View style={styles.quickQueryIcon}>
                <Ionicons name={quickQuery.icon as any} size={24} color="#007AFF" />
              </View>
              <View style={styles.quickQueryContent}>
                <Text style={styles.quickQueryTitle}>{quickQuery.title}</Text>
                <Text style={styles.quickQueryDescription}>{quickQuery.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Response */}
        {response && (
          <View style={styles.responseContainer}>
            <View style={styles.responseHeader}>
              <Text style={styles.responseTitle}>{response.title}</Text>
              {response.riskScore !== undefined && (
                <View style={[styles.riskBadge, { backgroundColor: getRiskScoreColor(response.riskScore) }]}>
                  <Text style={styles.riskScore}>{response.riskScore}/10</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.responseSummary}>{response.summary}</Text>
            
            {response.actions && response.actions.length > 0 && (
              <View style={styles.actionsContainer}>
                <Text style={styles.actionsTitle}>Recommended Actions:</Text>
                {response.actions.map((action: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.actionCard}
                    onPress={() => handleActionPress(action)}
                  >
                    <View style={styles.actionContent}>
                      <Text style={styles.actionTitle}>{action.title}</Text>
                      <Text style={styles.actionDescription}>{action.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Query History */}
        {queryHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.sectionTitle}>Recent Queries</Text>
            {queryHistory.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.historyItem}
                onPress={() => {
                  setQuery(item.query);
                  setResponse(item.response);
                }}
              >
                <View style={styles.historyContent}>
                  <Text style={styles.historyQuery} numberOfLines={1}>
                    {item.query}
                  </Text>
                  <Text style={styles.historyTime}>{item.timestamp}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Help Section */}
        <View style={styles.helpContainer}>
          <Text style={styles.helpTitle}>What I can help with:</Text>
          <Text style={styles.helpText}>
            • <Text style={styles.helpBold}>Transaction Analysis:</Text> Paste any transaction hash to get a detailed explanation
          </Text>
          <Text style={styles.helpText}>
            • <Text style={styles.helpBold}>Risk Assessment:</Text> Check if token spenders are safe or risky
          </Text>
          <Text style={styles.helpText}>
            • <Text style={styles.helpBold}>Settlement Planning:</Text> Get optimal strategies for group settlements
          </Text>
          <Text style={styles.helpText}>
            • <Text style={styles.helpBold}>Blockscout Integration:</Text> Real-time blockchain data and labels
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  demoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  demoText: {
    fontSize: 14,
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
  },
  queryContainer: {
    marginBottom: 24,
  },
  queryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  queryInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  queryInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    marginRight: 12,
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 8,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  quickQueriesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  quickQueryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quickQueryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickQueryContent: {
    flex: 1,
  },
  quickQueryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  quickQueryDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  responseContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskScore: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  responseSummary: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 16,
  },
  actionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyContainer: {
    marginBottom: 24,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  historyContent: {
    flex: 1,
  },
  historyQuery: {
    fontSize: 14,
    color: '#1F2937',
    marginBottom: 2,
  },
  historyTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  helpContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  helpBold: {
    fontWeight: '600',
    color: '#374151',
  },
});
