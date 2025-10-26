import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useSmartWallet } from '../lib/smartwallet/SmartWalletProvider';

export const CompactWalletDropdown: React.FC = () => {
  const { account, isAuthenticated, logout } = useSmartWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);

  if (!account) return null;

  const handleCopy = async () => {
    if (account?.address) {
      await Clipboard.setStringAsync(account.address);
      Alert.alert('Copied!', 'Wallet address copied to clipboard');
      setIsDropdownOpen(false);
    }
  };

  const handleShowQR = () => {
    setShowQRModal(true);
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            setIsDropdownOpen(false);
            Alert.alert('Logged Out', 'You have been logged out successfully');
          }
        }
      ]
    );
  };

  return (
    <>
      {/* Compact Wallet Button */}
      <TouchableOpacity 
        style={styles.compactButton}
        onPress={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <View style={[styles.statusDot, { backgroundColor: isAuthenticated ? '#10B981' : '#EF4444' }]} />
        <Text style={styles.addressText}>
          {account.address.slice(0, 6)}...{account.address.slice(-4)}
        </Text>
        <Ionicons 
          name={isDropdownOpen ? "chevron-up" : "chevron-down"} 
          size={16} 
          color="#6B7280" 
        />
      </TouchableOpacity>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <View style={styles.dropdown}>
          <TouchableOpacity style={styles.dropdownItem} onPress={handleCopy}>
            <Ionicons name="copy-outline" size={18} color="#007AFF" />
            <Text style={styles.dropdownText}>Copy Address</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dropdownItem} onPress={handleShowQR}>
            <Ionicons name="qr-code-outline" size={18} color="#007AFF" />
            <Text style={styles.dropdownText}>Show QR Code</Text>
          </TouchableOpacity>
          
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={[styles.dropdownText, { color: '#EF4444' }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModal}>
            <View style={styles.qrHeader}>
              <Text style={styles.qrTitle}>Wallet QR Code</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.qrContainer}>
              <QRCode
                value={account.address}
                size={200}
                backgroundColor="white"
                color="black"
              />
            </View>
            
            <Text style={styles.qrAddress}>{account.address}</Text>
            
            <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
              <Ionicons name="copy-outline" size={20} color="#007AFF" />
              <Text style={styles.copyButtonText}>Copy Address</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  compactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
    minWidth: 120,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
    fontFamily: 'monospace',
  },
  dropdown: {
    position: 'absolute',
    top: 45,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 180,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  qrTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  qrAddress: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default CompactWalletDropdown;
