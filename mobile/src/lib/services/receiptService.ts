import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Receipt {
  id: string;
  title: string;
  amount: number;
  payer: string;
  recipient: string;
  status: 'pending' | 'claimed' | 'settled';
  timestamp: number;
  transactionHash?: string;
  groupName?: string;
  category?: string;
  description?: string;
  participants?: Array<{
    id: string;
    name: string;
    address: string;
    amount: number;
  }>;
}

const RECEIPTS_STORAGE_KEY = 'receipts';

class ReceiptService {
  private receipts: Receipt[] = [];

  async loadReceipts(): Promise<Receipt[]> {
    try {
      const stored = await AsyncStorage.getItem(RECEIPTS_STORAGE_KEY);
      if (stored) {
        this.receipts = JSON.parse(stored);
      }
      return this.receipts;
    } catch (error) {
      console.error('Error loading receipts:', error);
      return [];
    }
  }

  async saveReceipts(): Promise<void> {
    try {
      await AsyncStorage.setItem(RECEIPTS_STORAGE_KEY, JSON.stringify(this.receipts));
    } catch (error) {
      console.error('Error saving receipts:', error);
    }
  }

  async addReceipt(receipt: Omit<Receipt, 'id' | 'timestamp'>): Promise<Receipt> {
    const newReceipt: Receipt = {
      ...receipt,
      id: Date.now().toString(),
      timestamp: Date.now(),
    };

    this.receipts.push(newReceipt);
    await this.saveReceipts();
    return newReceipt;
  }

  async updateReceipt(receiptId: string, updates: Partial<Receipt>): Promise<Receipt | null> {
    const receiptIndex = this.receipts.findIndex(receipt => receipt.id === receiptId);
    if (receiptIndex === -1) {
      return null;
    }

    this.receipts[receiptIndex] = { ...this.receipts[receiptIndex], ...updates };
    await this.saveReceipts();
    return this.receipts[receiptIndex];
  }

  async removeReceipt(receiptId: string): Promise<void> {
    this.receipts = this.receipts.filter(receipt => receipt.id !== receiptId);
    await this.saveReceipts();
  }

  getReceipts(): Receipt[] {
    return this.receipts;
  }

  getReceiptById(id: string): Receipt | null {
    return this.receipts.find(receipt => receipt.id === id) || null;
  }

  getReceiptsByStatus(status: Receipt['status']): Receipt[] {
    return this.receipts.filter(receipt => receipt.status === status);
  }

  getReceiptsByPayer(payerAddress: string): Receipt[] {
    return this.receipts.filter(receipt => 
      receipt.payer.toLowerCase() === payerAddress.toLowerCase()
    );
  }

  getReceiptsByRecipient(recipientAddress: string): Receipt[] {
    return this.receipts.filter(receipt => 
      receipt.recipient.toLowerCase() === recipientAddress.toLowerCase()
    );
  }
}

export const receiptService = new ReceiptService();
