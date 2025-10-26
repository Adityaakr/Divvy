import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../lib/store';
import { generateId, formatAddress } from '../lib/calc';

export default function AddExpenseScreen({ route, navigation }: any) {
  const { groupId } = route.params || {};
  const { groups, addExpense, connectedAddress } = useStore();
  
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || '');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [payer, setPayer] = useState(connectedAddress || '');

  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const handleAddExpense = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Expense title is required');
      return;
    }

    if (!amount.trim() || isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Valid amount is required');
      return;
    }

    if (!selectedGroupId) {
      Alert.alert('Error', 'Please select a group');
      return;
    }

    if (!payer.trim()) {
      Alert.alert('Error', 'Payer is required');
      return;
    }

    const group = groups.find(g => g.id === selectedGroupId);
    if (!group) {
      Alert.alert('Error', 'Selected group not found');
      return;
    }

    const totalAmount = parseFloat(amount);
    const splitAmount = totalAmount / group.members.length;

    const newExpense = {
      id: generateId(),
      groupId: selectedGroupId,
      title: title.trim(),
      payer: payer.trim(),
      total: totalAmount,
      splits: group.members.map(member => ({
        member,
        amount: splitAmount,
      })),
      timestamp: Date.now(),
    };

    addExpense(newExpense);
    Alert.alert('Success', 'Expense added successfully!', [
      {
        text: 'OK',
        onPress: () => {
          if (groupId) {
            navigation.goBack();
          } else {
            setTitle('');
            setAmount('');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <Text style={styles.title}>Add New Expense</Text>

          {/* Group Selection */}
          {!groupId && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Group</Text>
              <View style={styles.groupSelector}>
                {groups.map((group) => (
                  <TouchableOpacity
                    key={group.id}
                    style={[
                      styles.groupOption,
                      selectedGroupId === group.id && styles.groupOptionSelected,
                    ]}
                    onPress={() => setSelectedGroupId(group.id)}
                  >
                    <Text style={[
                      styles.groupOptionText,
                      selectedGroupId === group.id && styles.groupOptionTextSelected,
                    ]}>
                      {group.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Expense Title */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Expense Title</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Dinner at restaurant"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Amount */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Amount ($)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Payer Selection */}
          {selectedGroup && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Who Paid?</Text>
              <View style={styles.payerSelector}>
                {selectedGroup.members.map((member) => (
                  <TouchableOpacity
                    key={member}
                    style={[
                      styles.payerOption,
                      payer === member && styles.payerOptionSelected,
                    ]}
                    onPress={() => setPayer(member)}
                  >
                    <Text style={[
                      styles.payerOptionText,
                      payer === member && styles.payerOptionTextSelected,
                    ]}>
                      {formatAddress(member)}
                      {member === connectedAddress && ' (You)'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Split Preview */}
          {selectedGroup && amount && (
            <View style={styles.splitPreview}>
              <Text style={styles.splitTitle}>Split Preview</Text>
              <Text style={styles.splitText}>
                Each person pays: ${(parseFloat(amount) / selectedGroup.members.length).toFixed(2)}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.addButton} onPress={handleAddExpense}>
            <Text style={styles.addButtonText}>Add Expense</Text>
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
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
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
  groupSelector: {
    gap: 8,
  },
  groupOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  groupOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  groupOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  groupOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  payerSelector: {
    gap: 8,
  },
  payerOption: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  payerOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  payerOptionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  payerOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  splitPreview: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  splitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  splitText: {
    fontSize: 14,
    color: '#6B7280',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
