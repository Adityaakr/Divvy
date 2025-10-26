import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { 
  bsBlocks, 
  bsTransactions, 
  bsAddress,
  formatAddress,
  getBlockscoutTxUrl,
  getBlockscoutAddressUrl,
  type BlockscoutBlock,
  type BlockscoutTransaction,
  type BlockscoutAddress
} from '../lib/partners/blockscout';
import { BLOCKSCOUT } from '../lib/chains';
import BlockscoutModal from '../components/BlockscoutModal';

export default function MiniExplorerScreen({ navigation }: any) {
  const [blocks, setBlocks] = useState<BlockscoutBlock[]>([]);
  const [transactions, setTransactions] = useState<BlockscoutTransaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<BlockscoutAddress | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'blocks' | 'transactions'>('blocks');
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTxHash, setModalTxHash] = useState<string>('');
  const [modalAddress, setModalAddress] = useState<string>('');
  const [isOffline, setIsOffline] = useState(false);

  // Mock app metrics
  const [appMetrics] = useState({
    avgClaimTime: 45,
    claimedPercent: 78,
    refundedPercent: 12,
    totalTransactions: 1247,
  });

  useEffect(() => {
    loadExplorerData();
    
    // Set up polling for live updates
    const interval = setInterval(loadExplorerData, 4000); // Every 4 seconds
    return () => clearInterval(interval);
  }, []);

  const loadExplorerData = async () => {
    try {
      setIsOffline(false);
      
      const [blocksResponse, txsResponse] = await Promise.all([
        bsBlocks(1),
        bsTransactions(1),
      ]);

      if (blocksResponse?.items) {
        setBlocks(blocksResponse.items.slice(0, 10));
      }
      
      if (txsResponse?.items) {
        setTransactions(txsResponse.items.slice(0, 10));
      }
    } catch (error) {
      console.warn('Explorer data unavailable, using cached/mock data:', error);
      setIsOffline(true);
      
      // Use mock data when offline
      setBlocks(generateMockBlocks());
      setTransactions(generateMockTransactions());
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadExplorerData();
    setIsRefreshing(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      // Check if it's an address (0x followed by 40 hex chars)
      if (/^0x[a-fA-F0-9]{40}$/.test(searchQuery.trim())) {
        const addressInfo = await bsAddress(searchQuery.trim() as `0x${string}`);
        setSearchResult(addressInfo);
      } else {
        Alert.alert('Invalid Format', 'Please enter a valid Ethereum address (0x...)');
      }
    } catch (error) {
      Alert.alert('Search Error', 'Unable to fetch address information');
    } finally {
      setIsSearching(false);
    }
  };

  const handleBlockPress = (block: BlockscoutBlock) => {
    Alert.alert(
      'Block Details',
      `Block #${block.height}\nTransactions: ${block.tx_count}\nMiner: ${formatAddress(block.miner.hash)}`,
      [
        { text: 'OK' },
        {
          text: 'View on Blockscout',
          onPress: () => openBlockscout(`/block/${block.height}`),
        },
      ]
    );
  };

  const handleTxPress = (tx: BlockscoutTransaction) => {
    setModalTxHash(tx.hash);
    setModalVisible(true);
  };

  const handleAddressPress = (address: string) => {
    setModalAddress(address);
    setModalVisible(true);
  };

  const openBlockscout = (path: string) => {
    const url = `${BLOCKSCOUT.baseUrl}${path}`;
    setModalVisible(true);
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

  const generateMockBlocks = (): BlockscoutBlock[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      height: 5000000 + i,
      timestamp: new Date(Date.now() - i * 12000).toISOString(),
      tx_count: Math.floor(Math.random() * 200) + 50,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      parent_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      miner: {
        hash: `0x${Math.random().toString(16).substr(2, 40)}`,
        name: 'Mock Miner',
      },
      size: Math.floor(Math.random() * 100000) + 50000,
      gas_used: (Math.floor(Math.random() * 20000000) + 10000000).toString(),
      gas_limit: '30000000',
    }));
  };

  const generateMockTransactions = (): BlockscoutTransaction[] => {
    return Array.from({ length: 10 }, (_, i) => ({
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      block_number: 5000000 + i,
      from: {
        hash: `0x${Math.random().toString(16).substr(2, 40)}`,
        is_contract: Math.random() > 0.7,
        is_verified: Math.random() > 0.3,
      },
      to: {
        hash: `0x${Math.random().toString(16).substr(2, 40)}`,
        is_contract: Math.random() > 0.5,
        is_verified: Math.random() > 0.2,
      },
      value: (Math.random() * 10).toFixed(6),
      gas_limit: '21000',
      gas_used: '21000',
      gas_price: '20000000000',
      status: Math.random() > 0.1 ? 'ok' : 'error',
      method: ['transfer', 'approve', 'swap', null][Math.floor(Math.random() * 4)],
      timestamp: new Date(Date.now() - i * 30000).toISOString(),
      confirmations: Math.floor(Math.random() * 100) + 1,
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Mini Explorer</Text>
        <View style={styles.headerRight}>
          {isOffline && (
            <View style={styles.offlineBadge}>
              <Text style={styles.offlineText}>MOCK</Text>
            </View>
          )}
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Network Info */}
        <View style={styles.networkCard}>
          <View style={styles.networkHeader}>
            <Ionicons name="globe-outline" size={20} color="#007AFF" />
            <Text style={styles.networkName}>{BLOCKSCOUT.chainName}</Text>
            <View style={[styles.statusDot, { backgroundColor: isOffline ? '#EF4444' : '#10B981' }]} />
          </View>
          <Text style={styles.networkUrl}>{BLOCKSCOUT.baseUrl}</Text>
        </View>

        {/* Quick Address Lookup */}
        <View style={styles.searchContainer}>
          <Text style={styles.sectionTitle}>Quick Address Lookup</Text>
          <View style={styles.searchInputContainer}>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Enter address (0x...)"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity 
              onPress={handleSearch}
              style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="search" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {searchResult && (
            <View style={styles.searchResult}>
              <View style={styles.searchResultHeader}>
                <Text style={styles.searchResultAddress}>
                  {formatAddress(searchResult.hash)}
                </Text>
                <View style={styles.searchResultBadges}>
                  {searchResult.is_contract && (
                    <View style={styles.contractBadge}>
                      <Text style={styles.badgeText}>Contract</Text>
                    </View>
                  )}
                  {searchResult.is_verified && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.badgeText}>Verified</Text>
                    </View>
                  )}
                </View>
              </View>
              {searchResult.name && (
                <Text style={styles.searchResultName}>{searchResult.name}</Text>
              )}
              <TouchableOpacity 
                style={styles.viewAddressButton}
                onPress={() => handleAddressPress(searchResult.hash)}
              >
                <Text style={styles.viewAddressButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* App Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Divvy Metrics</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{appMetrics.avgClaimTime}s</Text>
              <Text style={styles.metricLabel}>Avg Claim Time</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{appMetrics.claimedPercent}%</Text>
              <Text style={styles.metricLabel}>Claimed</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{appMetrics.refundedPercent}%</Text>
              <Text style={styles.metricLabel}>Refunded</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricValue}>{appMetrics.totalTransactions}</Text>
              <Text style={styles.metricLabel}>Total TXs</Text>
            </View>
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'blocks' && styles.activeTab]}
            onPress={() => setSelectedTab('blocks')}
          >
            <Text style={[styles.tabText, selectedTab === 'blocks' && styles.activeTabText]}>
              Live Blocks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'transactions' && styles.activeTab]}
            onPress={() => setSelectedTab('transactions')}
          >
            <Text style={[styles.tabText, selectedTab === 'transactions' && styles.activeTabText]}>
              Recent Transactions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Live Blocks */}
        {selectedTab === 'blocks' && (
          <View style={styles.listContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
            ) : (
              blocks.map((block, index) => (
                <TouchableOpacity
                  key={block.hash}
                  style={styles.blockItem}
                  onPress={() => handleBlockPress(block)}
                >
                  <View style={styles.blockLeft}>
                    <Text style={styles.blockHeight}>#{block.height.toLocaleString()}</Text>
                    <Text style={styles.blockTime}>{formatTimeAgo(block.timestamp)}</Text>
                  </View>
                  <View style={styles.blockRight}>
                    <Text style={styles.blockTxCount}>{block.tx_count} txs</Text>
                    <Text style={styles.blockMiner}>
                      {formatAddress(block.miner.hash)}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Recent Transactions */}
        {selectedTab === 'transactions' && (
          <View style={styles.listContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
            ) : (
              transactions.map((tx, index) => (
                <TouchableOpacity
                  key={tx.hash}
                  style={styles.txItem}
                  onPress={() => handleTxPress(tx)}
                >
                  <View style={styles.txLeft}>
                    <View style={[
                      styles.txStatus,
                      { backgroundColor: tx.status === 'ok' ? '#10B981' : '#EF4444' }
                    ]} />
                    <View style={styles.txInfo}>
                      <Text style={styles.txHash}>{formatAddress(tx.hash)}</Text>
                      <Text style={styles.txTime}>{formatTimeAgo(tx.timestamp)}</Text>
                    </View>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txValue}>{tx.value} ETH</Text>
                    {tx.method && (
                      <Text style={styles.txMethod}>{tx.method}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Blockscout Modal */}
      <BlockscoutModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setModalTxHash('');
          setModalAddress('');
        }}
        txHash={modalTxHash || undefined}
        address={modalAddress || undefined}
      />
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offlineText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  refreshButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  networkCard: {
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
  networkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  networkName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  networkUrl: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
  searchContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 14,
    fontFamily: 'monospace',
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchResult: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchResultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchResultAddress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    fontFamily: 'monospace',
  },
  searchResultBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  contractBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  searchResultName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  viewAddressButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: 'center',
  },
  viewAddressButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  metricsContainer: {
    marginBottom: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContainer: {
    gap: 8,
  },
  loader: {
    marginVertical: 32,
  },
  blockItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  blockLeft: {
    flex: 1,
  },
  blockHeight: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  blockTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  blockRight: {
    alignItems: 'flex-end',
  },
  blockTxCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#059669',
  },
  blockMiner: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
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
    fontWeight: '500',
    color: '#059669',
  },
  txMethod: {
    fontSize: 12,
    color: '#8B5CF6',
    marginTop: 2,
  },
});
