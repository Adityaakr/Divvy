import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AddUserModal } from '../components/AddUserModal';
import { userService, User } from '../lib/services/userService';

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const loadedUsers = await userService.loadUsers();
      setUsers(loadedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleAddUser = async (userData: Omit<User, 'id' | 'addedAt'>) => {
    try {
      await userService.addUser(userData);
      await loadUsers();
      Alert.alert('Success', 'User added successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add user');
    }
  };

  const handleRemoveUser = (user: User) => {
    Alert.alert(
      'Remove User',
      `Are you sure you want to remove ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await userService.removeUser(user.id);
              await loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to remove user');
            }
          }
        }
      ]
    );
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const renderUserItem = ({ item: user }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{user.name}</Text>
          {user.ensName ? (
            <View>
              <Text style={styles.ensName}>{user.ensName}</Text>
              <Text style={styles.userAddress}>{formatAddress(user.address)}</Text>
            </View>
          ) : (
            <Text style={styles.userAddress}>{formatAddress(user.address)}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveUser(user)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF3B30" />
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>No Users Added</Text>
      <Text style={styles.emptySubtitle}>
        Add users by their Ethereum address or ENS name to easily send payments
      </Text>
      <TouchableOpacity
        style={styles.addFirstUserButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.addFirstUserText}>Add Your First User</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Users</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {users.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <Text style={styles.subtitle}>
              {users.length} user{users.length !== 1 ? 's' : ''} added
            </Text>
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
              showsVerticalScrollIndicator={false}
            />
          </>
        )}
      </View>

      <AddUserModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddUser={handleAddUser}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  ensName: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  userAddress: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstUserButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  addFirstUserText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});
