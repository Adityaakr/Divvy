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
import { formatCurrency, formatAddress } from '../lib/calc';

export default function ReceiptsScreen() {
  const { expenses, groups, connectedAddress } = useStore();

  // Get all expenses where the connected user is involved
  const userExpenses = expenses.filter(expense => 
    expense.payer === connectedAddress || 
    expense.splits.some(split => split.member === connectedAddress)
  );

  const getGroupName = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    return group?.name || 'Unknown Group';
  };

  const renderExpenseItem = (expense: any) => {
    const isPayer = expense.payer === connectedAddress;
    const userSplit = expense.splits.find(split => split.member === connectedAddress);
    const userAmount = userSplit?.amount || 0;

    return (
      <View key={expense.id} style={styles.expenseItem}>
        <View style={styles.expenseHeader}>
          <View style={styles.expenseInfo}>
            <Text style={styles.expenseTitle}>{expense.title}</Text>
            <Text style={styles.groupName}>{getGroupName(expense.groupId)}</Text>
          </View>
          <View style={styles.amountContainer}>
            <Text style={styles.totalAmount}>
              {formatCurrency(expense.total)}
            </Text>
            {isPayer ? (
              <View style={styles.paidBadge}>
                <Text style={styles.paidText}>You paid</Text>
              </View>
            ) : (
              <Text style={styles.yourShare}>
                Your share: {formatCurrency(userAmount)}
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.expenseDetails}>
          <Text style={styles.payerText}>
            Paid by {formatAddress(expense.payer)}
            {expense.payer === connectedAddress && ' (You)'}
          </Text>
          <Text style={styles.dateText}>
            {new Date(expense.timestamp).toLocaleDateString()}
          </Text>
        </View>

        {/* Split breakdown */}
        <View style={styles.splitBreakdown}>
          <Text style={styles.splitTitle}>Split between:</Text>
          {expense.splits.map((split: any, index: number) => (
            <View key={index} style={styles.splitItem}>
              <Text style={styles.splitMember}>
                {formatAddress(split.member)}
                {split.member === connectedAddress && ' (You)'}
              </Text>
              <Text style={styles.splitAmount}>
                {formatCurrency(split.amount)}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Receipts</Text>
        <Text style={styles.subtitle}>
          Your expense history and receipts
        </Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {userExpenses.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={64} color="#6B7280" />
            </View>
            <Text style={styles.emptyTitle}>No receipts yet</Text>
            <Text style={styles.emptySubtitle}>
              Your expense receipts will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.expensesList}>
            {userExpenses
              .sort((a, b) => b.timestamp - a.timestamp)
              .map(renderExpenseItem)}
          </View>
        )}
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
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    backgroundColor: '#F3F4F6',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  expensesList: {
    padding: 20,
    gap: 16,
  },
  expenseItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 4,
  },
  paidBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  paidText: {
    fontSize: 12,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  yourShare: {
    fontSize: 14,
    color: '#6B7280',
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  payerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dateText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  splitBreakdown: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  splitTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  splitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  splitMember: {
    fontSize: 14,
    color: '#6B7280',
  },
  splitAmount: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
});
