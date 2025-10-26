import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../lib/store';
import { calculateBalances, formatCurrency, formatAddress } from '../lib/calc';

export default function GroupDetailScreen({ route, navigation }: any) {
  const { groupId } = route.params;
  const { getGroupById, getExpensesByGroup, connectedAddress } = useStore();
  
  const group = getGroupById(groupId);
  const expenses = getExpensesByGroup(groupId);
  const balances = group ? calculateBalances(expenses, group.members) : [];

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Group not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Group Info */}
        <View style={styles.groupInfo}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.memberCount}>{group.members.length} members</Text>
        </View>

        {/* Balances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Balances</Text>
          {balances.map((balance) => (
            <View key={balance.member} style={styles.balanceItem}>
              <Text style={styles.memberAddress}>
                {formatAddress(balance.member)}
                {balance.member === connectedAddress && ' (You)'}
              </Text>
              <Text style={[
                styles.balanceAmount,
                { color: balance.amount >= 0 ? '#10B981' : '#EF4444' }
              ]}>
                {formatCurrency(balance.amount)}
              </Text>
            </View>
          ))}
        </View>

        {/* Expenses */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Expenses</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('Add', { groupId })}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
              <Text style={styles.addButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>

          {expenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#6B7280" />
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySubtext}>Add an expense to get started</Text>
            </View>
          ) : (
            <View style={styles.expensesList}>
              {expenses.map((expense) => (
                <View key={expense.id} style={styles.expenseItem}>
                  <View style={styles.expenseHeader}>
                    <Text style={styles.expenseTitle}>{expense.title}</Text>
                    <Text style={styles.expenseAmount}>
                      {formatCurrency(expense.total)}
                    </Text>
                  </View>
                  <Text style={styles.expensePayer}>
                    Paid by {formatAddress(expense.payer)}
                    {expense.payer === connectedAddress && ' (You)'}
                  </Text>
                  <Text style={styles.expenseDate}>
                    {new Date(expense.timestamp).toLocaleDateString()}
                  </Text>
                </View>
              ))}
            </View>
          )}
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
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
  },
  groupInfo: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    margin: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
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
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  memberAddress: {
    fontSize: 16,
    color: '#1F2937',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  expensesList: {
    gap: 12,
  },
  expenseItem: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
  },
  expensePayer: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  expenseDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
