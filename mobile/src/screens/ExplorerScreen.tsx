import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { blockscoutClient } from '../lib/ai/blockscoutClient';

export default function ExplorerScreen({ navigation }: any) {
  const [blockData, setBlockData] = useState<any>(null);
  const [recentTxs, setRecentTxs] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('ethereum-sepolia');
  const [stats, setStats] = useState({
    txVolume24h: 1250000,
    avgClaimTime: 45,
    claimedPercent: 78,
    refundedPercent: 12,
  });

  const networks = [
    { id: 'ethereum-sepolia', name: 'Ethereum Sepolia', color: '#007AFF' },
    { id: 'polygon', name: 'Polygon', color: '#8B5CF6' },
    { id: 'mainnet', name: 'Ethereum', color: '#627EEA' },
  ];

  useEffect(() => {
    loadExplorerData();
    const interval = setInterval(loadExplorerData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [selectedNetwork]);

  const loadExplorerData = async () => {
    try {
      // Mock block data (in real app, this would come from Blockscout API)
      const mockBlockData = {
        height: Math.floor(Math.random() * 1000000) + 5000000,
        txCount: Math.floor(Math.random() * 200) + 50,
        timestamp: new Date().toISOString(),
        gasUsed: Math.floor(Math.random() * 30000000) + 10000000,
        gasLimit: 30000000,
      };

      // Mock recent transactions
      const mockTxs = Array.from({ length: 10 }, (_, i) => ({
        hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        from: `0x${Math.random().toString(16).substr(2, 40)}`,
        to: `0x${Math.random().toString(16).substr(2, 40)}`,
        value: (Math.random() * 10).toFixed(4),
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        status: Math.random() > 0.1 ? 'success' : 'failed',
      }));

      setBlockData(mockBlockData);
      setRecentTxs(mockTxs);
    } catch (error) {
      console.error('Error loading explorer data:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadExplorerData();
    setIsRefreshing(false);
  };

  const handleTxPress = (tx: any) => {
    Alert.alert(
      'Transaction Details',
      `Hash: ${tx.hash}\nFrom: ${tx.from}\nTo: ${tx.to}\nValue: ${tx.value} ETH`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View on Blockscout',
          onPress: () => openBlockscout(`/tx/${tx.hash}`),
        },
      ]
    );
  };

  const handleAddressPress = (address: string) => {
    Alert.alert(
      'Address Details',
      `Address: ${address}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'View on Blockscout',
          onPress: () => openBlockscout(`/address/${address}`),
        },
      ]
    );
  };

  const openBlockscout = (path: string) => {
    const baseUrls = {
      'base-sepolia': 'https://base-sepolia.blockscout.com',
      'polygon': 'https://polygon.blockscout.com',
      'mainnet': 'https://eth.blockscout.com',
    };
    
    const url = `${baseUrls[selectedNetwork as keyof typeof baseUrls]}${path}`;
    Linking.openURL(url);
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getNetworkColor = (networkId: string) => {
    return networks.find(n => n.id === networkId)?.color || '#6B7280';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Blockchain Explorer</Text>
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
        {/* Network Selector */}
        <View style={styles.networkSelector}>
          {networks.map((network) => (
            <TouchableOpacity
              key={network.id}
              style={[
                styles.networkButton,
                selectedNetwork === network.id && styles.networkButtonActive,
                { borderColor: network.color },
              ]}
              onPress={() => setSelectedNetwork(network.id)}
            >
              <View style={[styles.networkDot, { backgroundColor: network.color }]} />
              <Text style={[
                styles.networkText,
                selectedNetwork === network.id && { color: network.color }
              ]}>
                {network.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Live Block Ticker */}
        {blockData && (
          <View style={styles.blockTicker}>
            <View style={styles.tickerHeader}>
              <Ionicons name="cube-outline" size={20} color={getNetworkColor(selectedNetwork)} />
              <Text style={styles.tickerTitle}>Latest Block</Text>
              <View style={styles.liveDot} />
            </View>
            
            <View style={styles.blockInfo}>
              <View style={styles.blockStat}>
                <Text style={styles.blockNumber}>#{blockData.height.toLocaleString()}</Text>
                <Text style={styles.blockLabel}>Block Height</Text>
              </View>
              <View style={styles.blockStat}>
                <Text style={styles.blockNumber}>{blockData.txCount}</Text>
                <Text style={styles.blockLabel}>Transactions</Text>
              </View>
              <View style={styles.blockStat}>
                <Text style={styles.blockNumber}>{formatTimeAgo(blockData.timestamp)}</Text>
                <Text style={styles.blockLabel}>Time</Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats Charts */}
        <View style={styles.chartsContainer}>
          <Text style={styles.sectionTitle}>Network Statistics</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>${stats.txVolume24h.toLocaleString()}</Text>
              <Text style={styles.statLabel}>24h Volume</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-up" size={16} color="#10B981" />
                <Text style={styles.statTrendText}>+12.5%</Text>
              </View>
            </View>
            
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.avgClaimTime}s</Text>
              <Text style={styles.statLabel}>Avg Claim Time</Text>
              <View style={styles.statTrend}>
                <Ionicons name="trending-down" size={16} color="#10B981" />
                <Text style={styles.statTrendText}>-8.2%</Text>
              </View>
            </View>
          </View>

          <View style={styles.percentageStats}>
            <View style={styles.percentageStat}>
              <Text style={styles.percentageValue}>{stats.claimedPercent}%</Text>
              <Text style={styles.percentageLabel}>Claimed</Text>
              <View style={[styles.percentageBar, { width: `${stats.claimedPercent}%`, backgroundColor: '#10B981' }]} />
            </View>
            
            <View style={styles.percentageStat}>
              <Text style={styles.percentageValue}>{stats.refundedPercent}%</Text>
              <Text style={styles.percentageLabel}>Refunded</Text>
              <View style={[styles.percentageBar, { width: `${stats.refundedPercent}%`, backgroundColor: '#EF4444' }]} />
            </View>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.transactionsContainer}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {recentTxs.map((tx, index) => (
            <TouchableOpacity
              key={index}
              style={styles.txItem}
              onPress={() => handleTxPress(tx)}
            >
              <View style={styles.txLeft}>
                <View style={[
                  styles.txStatus,
                  { backgroundColor: tx.status === 'success' ? '#10B981' : '#EF4444' }
                ]} />
                <View style={styles.txInfo}>
                  <Text style={styles.txHash}>{formatAddress(tx.hash)}</Text>
                  <Text style={styles.txTime}>{formatTimeAgo(tx.timestamp)}</Text>
                </View>
              </View>
              
              <View style={styles.txRight}>
                <Text style={styles.txValue}>{tx.value} ETH</Text>
                <View style={styles.txAddresses}>
                  <TouchableOpacity onPress={() => handleAddressPress(tx.from)}>
                    <Text style={styles.txAddress}>{formatAddress(tx.from)}</Text>
                  </TouchableOpacity>
                  <Ionicons name="arrow-forward" size={12} color="#6B7280" />
                  <TouchableOpacity onPress={() => handleAddressPress(tx.to)}>
                    <Text style={styles.txAddress}>{formatAddress(tx.to)}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => openBlockscout('')}
          >
            <Ionicons name="open-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Open Full Blockscout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Copilot')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#007AFF" />
            <Text style={styles.actionText}>Ask AI Copilot</Text>
          </TouchableOpacity>
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
  networkSelector: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  networkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  networkButtonActive: {
    backgroundColor: '#F0F9FF',
  },
  networkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  networkText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  blockTicker: {
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
  tickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  blockInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  blockStat: {
    alignItems: 'center',
  },
  blockNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  blockLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  chartsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8,
  },
  statTrend: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statTrendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
    marginLeft: 4,
  },
  percentageStats: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  percentageStat: {
    marginBottom: 16,
  },
  percentageValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  percentageLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  percentageBar: {
    height: 4,
    borderRadius: 2,
  },
  transactionsContainer: {
    marginBottom: 24,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txHash: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  txTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  txRight: {
    alignItems: 'flex-end',
  },
  txValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginBottom: 2,
  },
  txAddresses: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  txAddress: {
    fontSize: 12,
    color: '#007AFF',
    fontFamily: 'monospace',
    marginHorizontal: 4,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  actionButton: {
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
  actionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 12,
  },
});
