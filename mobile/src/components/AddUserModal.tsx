import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: string;
  name: string;
  address: string;
  ensName?: string;
}

interface AddUserModalProps {
  visible: boolean;
  onClose: () => void;
  onAddUser: (user: User) => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  visible,
  onClose,
  onAddUser,
}) => {
  const [name, setName] = useState('');
  const [addressOrEns, setAddressOrEns] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValidAddress = (address: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const isValidENS = (ens: string) => {
    return ens.endsWith('.eth') && ens.length > 4;
  };

  const handleAddUser = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (!addressOrEns.trim()) {
      Alert.alert('Error', 'Please enter an address or ENS name');
      return;
    }

    let finalAddress = addressOrEns;
    let ensName: string | undefined;

    if (isValidAddress(addressOrEns)) {
      finalAddress = addressOrEns;
    } else if (isValidENS(addressOrEns)) {
      // For demo, we'll use a mock resolved address
      finalAddress = '0x' + Math.random().toString(16).substr(2, 40);
      ensName = addressOrEns;
    } else {
      Alert.alert('Error', 'Please enter a valid Ethereum address or ENS name');
      return;
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: name.trim(),
      address: finalAddress,
      ensName,
    };

    onAddUser(newUser);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setAddressOrEns('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} />
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Add User</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.content}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter user's name"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address or ENS Name</Text>
              <TextInput
                style={styles.input}
                value={addressOrEns}
                onChangeText={setAddressOrEns}
                placeholder="0x... or name.eth"
                placeholderTextColor="#999"
                autoCapitalize="none"
                autoCorrect={false}
              />
              
              {addressOrEns && isValidAddress(addressOrEns) && (
                <View style={styles.validContainer}>
                  <Ionicons name="checkmark-circle" size={16} color="#00C851" />
                  <Text style={styles.validText}>Valid Ethereum address</Text>
                </View>
              )}

              {addressOrEns && isValidENS(addressOrEns) && (
                <View style={styles.validContainer}>
                  <Ionicons name="checkmark-circle" size={16} color="#00C851" />
                  <Text style={styles.validText}>Valid ENS name</Text>
                </View>
              )}
            </View>

            <View style={styles.exampleContainer}>
              <Text style={styles.exampleTitle}>Examples:</Text>
              <Text style={styles.exampleText}>• 0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4</Text>
              <Text style={styles.exampleText}>• vitalik.eth</Text>
              <Text style={styles.exampleText}>• alice.eth</Text>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addButton} 
                onPress={handleAddUser}
              >
                <Text style={styles.addButtonText}>Add User</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  validContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  validText: {
    fontSize: 14,
    color: '#00C851',
    marginLeft: 4,
  },
  exampleContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  exampleTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  exampleText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  addButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
