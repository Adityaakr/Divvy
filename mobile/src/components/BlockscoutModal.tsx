import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BLOCKSCOUT } from '../lib/chains';

interface BlockscoutModalProps {
  visible: boolean;
  onClose: () => void;
  url?: string;
  txHash?: string;
  address?: string;
  title?: string;
}

export default function BlockscoutModal({
  visible,
  onClose,
  url,
  txHash,
  address,
  title = 'Blockscout',
}: BlockscoutModalProps) {

  // Determine the URL to load
  const getBlockscoutUrl = (): string => {
    if (url) return url;
    if (txHash) return `${BLOCKSCOUT.baseUrl}/tx/${txHash}`;
    if (address) return `${BLOCKSCOUT.baseUrl}/address/${address}`;
    return BLOCKSCOUT.baseUrl;
  };

  const blockscoutUrl = getBlockscoutUrl();

  const handleOpenInBrowser = () => {
    Linking.openURL(blockscoutUrl).catch(() => {
      Alert.alert('Error', 'Unable to open URL in browser');
    });
    onClose();
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check this out on Blockscout: ${blockscoutUrl}`,
        url: blockscoutUrl,
      });
    } catch (error) {
      console.warn('Error sharing:', error);
    }
  };

  const getDisplayTitle = (): string => {
    if (txHash) return 'Transaction Details';
    if (address) return 'Address Details';
    return title;
  };

  const getDisplayUrl = (): string => {
    const url = blockscoutUrl;
    if (url.length > 50) {
      return url.substring(0, 47) + '...';
    }
    return url;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <View style={styles.titleContainer}>
              <Text style={styles.title}>{getDisplayTitle()}</Text>
              <Text style={styles.subtitle}>{BLOCKSCOUT.chainName}</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.infoCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="globe-outline" size={48} color="#007AFF" />
            </View>
            
            <Text style={styles.cardTitle}>View on Blockscout</Text>
            <Text style={styles.cardDescription}>
              Open this {txHash ? 'transaction' : address ? 'address' : 'page'} on the Blockscout blockchain explorer
            </Text>
            
            <View style={styles.urlContainer}>
              <Text style={styles.urlText}>{getDisplayUrl()}</Text>
            </View>

            <View style={styles.networkBadge}>
              <Text style={styles.networkText}>{BLOCKSCOUT.chainName}</Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={handleOpenInBrowser}
            >
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Open in Browser</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={handleShare}
            >
              <Ionicons name="share-outline" size={20} color="#007AFF" />
              <Text style={styles.secondaryButtonText}>Share Link</Text>
            </TouchableOpacity>
          </View>

          {/* Additional Info */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>About Blockscout</Text>
            <Text style={styles.infoText}>
              Blockscout is an open-source blockchain explorer that provides detailed information about transactions, addresses, and smart contracts.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerButton: {
    padding: 8,
  },
  titleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  urlContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  urlText: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
  networkBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  networkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actions: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});
