import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BLOCKSCOUT } from '../lib/chains';
import { getBlockscoutTxUrl, formatAddress } from '../lib/partners/blockscout';
import BlockscoutModal from './BlockscoutModal';

interface ReceiptItemProps {
  receipt: {
    id: string;
    type: 'Create' | 'Claim' | 'Refund';
    txHash: string;
    amount: number;
    token: string;
    timestamp: string;
    status: 'pending' | 'confirmed' | 'failed';
    from?: string;
    to?: string;
  };
}

export default function ReceiptItem({ receipt }: ReceiptItemProps) {
  const [modalVisible, setModalVisible] = useState(false);

  const getStatusColor = () => {
    switch (receipt.status) {
      case 'confirmed': return '#10B981';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getTypeIcon = () => {
    switch (receipt.type) {
      case 'Create': return 'add-circle-outline';
      case 'Claim': return 'download-outline';
      case 'Refund': return 'return-up-back-outline';
      default: return 'document-outline';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleViewOnBlockscout = () => {
    const url = getBlockscoutTxUrl(receipt.txHash);
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open Blockscout');
    });
  };

  const handleOpenInApp = () => {
    setModalVisible(true);
  };

  const handleMoreActions = () => {
    Alert.alert(
      'Receipt Actions',
      `${receipt.type} transaction`,
      [
        {
          text: 'View on Blockscout',
          onPress: handleViewOnBlockscout,
        },
        {
          text: 'Open in App',
          onPress: handleOpenInApp,
        },
        {
          text: 'Copy Transaction Hash',
          onPress: () => {
            // In a real app, this would copy to clipboard
            Alert.alert('Copied', 'Transaction hash copied to clipboard');
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.leftSection}>
            <View style={[styles.iconContainer, { backgroundColor: getStatusColor() + '20' }]}>
              <Ionicons 
                name={getTypeIcon() as any} 
                size={20} 
                color={getStatusColor()} 
              />
            </View>
            <View style={styles.info}>
              <Text style={styles.type}>{receipt.type}</Text>
              <Text style={styles.timestamp}>{formatTimestamp(receipt.timestamp)}</Text>
            </View>
          </View>
          
          <View style={styles.rightSection}>
            <Text style={styles.amount}>
              {receipt.amount} {receipt.token}
            </Text>
            <View style={styles.statusContainer}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.status, { color: getStatusColor() }]}>
                {receipt.status}
              </Text>
            </View>
          </View>
        </View>

        {/* Transaction Details */}
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction:</Text>
            <Text style={styles.detailValue}>{formatAddress(receipt.txHash)}</Text>
          </View>
          
          {receipt.from && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>From:</Text>
              <Text style={styles.detailValue}>{formatAddress(receipt.from)}</Text>
            </View>
          )}
          
          {receipt.to && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>To:</Text>
              <Text style={styles.detailValue}>{formatAddress(receipt.to)}</Text>
            </View>
          )}
        </View>

        {/* Network Badge */}
        <View style={styles.networkContainer}>
          <View style={styles.networkBadge}>
            <Text style={styles.networkText}>{BLOCKSCOUT.chainName}</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleViewOnBlockscout}
          >
            <Ionicons name="open-outline" size={16} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>View on Blockscout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={handleOpenInApp}
          >
            <Ionicons name="phone-portrait-outline" size={16} color="#007AFF" />
            <Text style={styles.secondaryButtonText}>Open in App</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.moreButton}
            onPress={handleMoreActions}
          >
            <Ionicons name="ellipsis-horizontal" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Blockscout Modal */}
      <BlockscoutModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        txHash={receipt.txHash}
        title={`${receipt.type} Transaction`}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  type: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  status: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  details: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
  networkContainer: {
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  networkBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  networkText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  primaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 4,
  },
  secondaryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  moreButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
