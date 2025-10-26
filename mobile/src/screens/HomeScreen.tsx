import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../lib/store';
import { calculateBalances, formatCurrency, generateId } from '../lib/calc';

export default function HomeScreen({ navigation }: any) {
  const { groups, addGroup, connectedAddress, getExpensesByGroup, getGlobalMetrics } = useStore();
  const metrics = getGlobalMetrics();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [memberAddresses, setMemberAddresses] = useState('');

  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      Alert.alert('Error', 'Group name is required');
      return;
    }
    
    const members = memberAddresses
      .split(',')
      .map(addr => addr.trim())
      .filter(Boolean);
    
    if (members.length === 0) {
      Alert.alert('Error', 'Add at least one member');
      return;
    }
    
    // Add connected address if not already included
    if (connectedAddress && !members.includes(connectedAddress)) {
      members.unshift(connectedAddress);
    }
    
    const newGroup = {
      id: generateId(),
      name: groupName,
      members,
      createdAt: Date.now(),
    };
    
    addGroup(newGroup);
    Alert.alert('Success', 'Group created successfully!');
    
    setGroupName('');
    setMemberAddresses('');
    setModalVisible(false);
  };

  const renderGroupCard = (group: any) => {
    const groupExpenses = getExpensesByGroup(group.id);
    const balances = calculateBalances(groupExpenses, group.members);
    const myBalance = connectedAddress
      ? balances.find(b => b.member === connectedAddress)?.amount || 0
      : 0;

    return (
      <TouchableOpacity
        key={group.id}
        style={styles.groupCard}
        onPress={() => navigation.navigate('GroupDetail', { groupId: group.id })}
      >
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.memberCount}>{group.members.length} members</Text>
        </View>
        <View style={styles.balanceContainer}>
          <Text style={styles.balanceLabel}>Your balance:</Text>
          <Text style={[
            styles.balanceAmount,
            { color: myBalance >= 0 ? '#10B981' : '#EF4444' }
          ]}>
            {formatCurrency(myBalance)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            Split<Text style={styles.titleAccent}>Safe</Text>
          </Text>
          <Text style={styles.subtitle}>
            Split bills. Settle with PYUSD. Claim or refund safely.
          </Text>
        </View>

        {/* Metrics */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatCurrency(metrics.escrowed)}</Text>
            <Text style={styles.metricLabel}>Escrowed</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatCurrency(metrics.claimed)}</Text>
            <Text style={styles.metricLabel}>Claimed</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{formatCurrency(metrics.refunded)}</Text>
            <Text style={styles.metricLabel}>Refunded</Text>
          </View>
        </View>

        {/* Groups Section */}
        <View style={styles.groupsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Groups</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
              <Text style={styles.addButtonText}>New Group</Text>
            </TouchableOpacity>
          </View>

          {groups.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="people-outline" size={48} color="#007AFF" />
              </View>
              <Text style={styles.emptyTitle}>No groups yet</Text>
              <Text style={styles.emptySubtitle}>
                Create your first group to start splitting expenses
              </Text>
            </View>
          ) : (
            <View style={styles.groupsList}>
              {groups.map(renderGroupCard)}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Group Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Group</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Group Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Weekend Trip"
                value={groupName}
                onChangeText={setGroupName}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Member Addresses</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0x123..., 0x456..., alice@example.com"
                value={memberAddresses}
                onChangeText={setMemberAddresses}
                multiline
              />
              <Text style={styles.inputHint}>
                Comma-separated addresses or identifiers
              </Text>
            </View>

            <TouchableOpacity style={styles.createButton} onPress={handleCreateGroup}>
              <Text style={styles.createButtonText}>Create Group</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  titleAccent: {
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  metricsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginHorizontal: 4,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  groupsSection: {
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
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
  emptyIcon: {
    backgroundColor: '#E3F2FD',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  groupsList: {
    gap: 12,
  },
  groupCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  groupHeader: {
    marginBottom: 12,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
