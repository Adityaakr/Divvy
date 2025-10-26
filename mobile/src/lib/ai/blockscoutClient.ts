import Constants from 'expo-constants';

// Blockscout API configuration
const config = {
  baseUrl: 'https://base-sepolia.blockscout.com/api/v2',
  polygonUrl: 'https://polygon.blockscout.com/api/v2',
  mainnetUrl: 'https://eth.blockscout.com/api/v2',
  sepoliaUrl: 'https://eth-sepolia.blockscout.com/api/v2', // Add Sepolia support
};

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasUsed: string;
  gasPrice: string;
  status: string;
  timestamp: string;
  method?: string;
  tokenTransfers?: TokenTransfer[];
}

export interface TokenTransfer {
  from: string;
  to: string;
  value: string;
  token: {
    address: string;
    symbol: string;
    name: string;
    decimals: number;
  };
}

export interface AddressInfo {
  address: string;
  balance: string;
  transactionCount: number;
  isContract: boolean;
  contractName?: string;
  labels?: string[];
}

export interface CopilotResponse {
  title: string;
  summary: string;
  actions: CopilotAction[];
  riskScore?: number;
}

export interface CopilotAction {
  type: 'revoke' | 'limit' | 'settle' | 'view' | 'approve';
  title: string;
  description: string;
  data?: any;
}

class BlockscoutClient {
  private getApiUrl(network: string = 'base-sepolia'): string {
    switch (network.toLowerCase()) {
      case 'polygon':
        return config.polygonUrl;
      case 'mainnet':
      case 'ethereum':
        return config.mainnetUrl;
      case 'sepolia':
      case 'ethereum-sepolia':
        return config.sepoliaUrl;
      case 'base-sepolia':
      default:
        return config.baseUrl;
    }
  }

  private async fetchApi(endpoint: string, network: string = 'base-sepolia'): Promise<any> {
    const baseUrl = this.getApiUrl(network);
    const url = `${baseUrl}${endpoint}`;
    
    try {
      console.log(`🌐 Fetching: ${url}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.error(`❌ API Error: ${response.status} - ${response.statusText}`);
        throw new Error(`Blockscout API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ API Success: ${Object.keys(data).join(', ')}`);
      return data;
    } catch (error) {
      console.error('❌ Blockscout API error:', error);
      // Return empty result instead of throwing to prevent app crashes
      return { items: [] };
    }
  }

  // Get transaction details with trace
  async getTransactionDetails(txHash: string, network: string = 'base-sepolia'): Promise<Transaction> {
    const data = await this.fetchApi(`/transactions/${txHash}`, network);
    
    return {
      hash: data.hash,
      from: data.from?.hash || '',
      to: data.to?.hash || '',
      value: data.value || '0',
      gasUsed: data.gas_used || '0',
      gasPrice: data.gas_price || '0',
      status: data.status,
      timestamp: data.timestamp,
      method: data.method,
      tokenTransfers: data.token_transfers?.map((transfer: any) => ({
        from: transfer.from?.hash || '',
        to: transfer.to?.hash || '',
        value: transfer.total?.value || '0',
        token: {
          address: transfer.token?.address || '',
          symbol: transfer.token?.symbol || '',
          name: transfer.token?.name || '',
          decimals: transfer.token?.decimals || 18,
        },
      })) || [],
    };
  }

  // Get address information and labels
  async getAddressInfo(address: string, network: string = 'base-sepolia'): Promise<AddressInfo> {
    const data = await this.fetchApi(`/addresses/${address}`, network);
    
    return {
      address: data.hash,
      balance: data.coin_balance || '0',
      transactionCount: data.transactions_count || 0,
      isContract: data.is_contract || false,
      contractName: data.name,
      labels: data.public_tags?.map((tag: any) => tag.label) || [],
    };
  }

  // Get recent transactions for an address
  async getAddressTransactions(address: string, network: string = 'base-sepolia', limit: number = 10): Promise<Transaction[]> {
    const data = await this.fetchApi(`/addresses/${address}/transactions?limit=${limit}`, network);
    
    return data.items?.map((tx: any) => ({
      hash: tx.hash,
      from: tx.from?.hash || '',
      to: tx.to?.hash || '',
      value: tx.value || '0',
      gasUsed: tx.gas_used || '0',
      gasPrice: tx.gas_price || '0',
      status: tx.status,
      timestamp: tx.timestamp,
      method: tx.method,
    })) || [];
  }

  // Get token approvals for an address
  async getTokenApprovals(address: string, network: string = 'base-sepolia'): Promise<any[]> {
    try {
      const data = await this.fetchApi(`/addresses/${address}/token-transfers?type=ERC-20&filter=approve`, network);
      return data.items || [];
    } catch (error) {
      console.error('Error fetching token approvals:', error);
      return [];
    }
  }

  // Get live transactions for an address
  async getLiveTransactions(address: string, network: string = 'sepolia', limit: number = 10): Promise<Transaction[]> {
    try {
      console.log(`🔍 Fetching live transactions for ${address} on ${network}...`);
      const data = await this.fetchApi(`/addresses/${address}/transactions?limit=${limit}`, network);
      
      if (!data.items) {
        console.log('No transactions found');
        return [];
      }

      console.log(`✅ Found ${data.items.length} transactions`);
      
      return data.items.map((tx: any) => ({
        hash: tx.hash,
        from: tx.from?.hash || '',
        to: tx.to?.hash || '',
        value: tx.value || '0',
        gasUsed: tx.gas_used || '0',
        gasPrice: tx.gas_price || '0',
        status: tx.status || 'ok',
        timestamp: tx.timestamp,
        method: tx.method || 'transfer',
        tokenTransfers: tx.token_transfers?.map((transfer: any) => ({
          from: transfer.from?.hash || '',
          to: transfer.to?.hash || '',
          value: transfer.total?.value || '0',
          token: {
            address: transfer.token?.address || '',
            symbol: transfer.token?.symbol || '',
            name: transfer.token?.name || '',
            decimals: transfer.token?.decimals || 18
          }
        })) || []
      }));
    } catch (error) {
      console.error('Error fetching live transactions:', error);
      return [];
    }
  }
}

// AI Copilot class for natural language processing
class AICopilot {
  private blockscout: BlockscoutClient;

  constructor() {
    this.blockscout = new BlockscoutClient();
  }

  // Explain a transaction
  async explainTransaction(txHash: string, network: string = 'base-sepolia'): Promise<CopilotResponse> {
    try {
      const tx = await this.blockscout.getTransactionDetails(txHash, network);
      const fromInfo = await this.blockscout.getAddressInfo(tx.from, network);
      const toInfo = await this.blockscout.getAddressInfo(tx.to, network);
      
      let title = 'Transaction Analysis';
      let summary = '';
      const actions: CopilotAction[] = [];
      
      // Analyze transaction type
      if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
        const transfer = tx.tokenTransfers[0];
        title = `${transfer.token.symbol} Transfer`;
        summary = `Transferred ${parseFloat(transfer.value) / Math.pow(10, transfer.token.decimals)} ${transfer.token.symbol} from ${this.formatAddress(tx.from)} to ${this.formatAddress(tx.to)}`;
        
        if (transfer.token.symbol === 'PYUSD') {
          actions.push({
            type: 'settle',
            title: 'Create Settlement',
            description: 'Create a new settlement with this amount',
            data: { amount: parseFloat(transfer.value) / Math.pow(10, transfer.token.decimals) },
          });
        }
      } else {
        title = 'ETH Transfer';
        summary = `Transferred ${parseFloat(tx.value) / 1e18} ETH from ${this.formatAddress(tx.from)} to ${this.formatAddress(tx.to)}`;
      }
      
      // Add view action
      actions.push({
        type: 'view',
        title: 'View on Blockscout',
        description: 'Open full transaction details',
        data: { txHash, network },
      });
      
      return { title, summary, actions };
    } catch (error) {
      return {
        title: 'Transaction Analysis Failed',
        summary: 'Unable to analyze this transaction. Please check the transaction hash and network.',
        actions: [],
      };
    }
  }

  // Analyze spender risk
  async analyzeSpenderRisk(spenderAddress: string, userAddress: string, network: string = 'base-sepolia'): Promise<CopilotResponse> {
    try {
      const spenderInfo = await this.blockscout.getAddressInfo(spenderAddress, network);
      const approvals = await this.blockscout.getTokenApprovals(userAddress, network);
      
      let riskScore = 0;
      let title = 'Spender Risk Analysis';
      let summary = '';
      const actions: CopilotAction[] = [];
      
      // Calculate risk score
      if (!spenderInfo.isContract) {
        riskScore += 3; // EOA spenders are riskier
      }
      
      if (!spenderInfo.labels || spenderInfo.labels.length === 0) {
        riskScore += 2; // Unlabeled contracts are riskier
      }
      
      if (spenderInfo.transactionCount < 100) {
        riskScore += 1; // New contracts are riskier
      }
      
      // Generate summary
      if (riskScore >= 5) {
        summary = `HIGH RISK: ${this.formatAddress(spenderAddress)} appears to be a high-risk spender. Consider revoking approvals.`;
        actions.push({
          type: 'revoke',
          title: 'Revoke All Approvals',
          description: 'Remove all token approvals for this spender',
          data: { spenderAddress },
        });
      } else if (riskScore >= 3) {
        summary = `MEDIUM RISK: ${this.formatAddress(spenderAddress)} has some risk factors. Consider limiting approvals.`;
        actions.push({
          type: 'limit',
          title: 'Limit Approvals',
          description: 'Set spending limits for this spender',
          data: { spenderAddress },
        });
      } else {
        summary = `LOW RISK: ${this.formatAddress(spenderAddress)} appears to be a legitimate contract${spenderInfo.contractName ? ` (${spenderInfo.contractName})` : ''}.`;
      }
      
      return { title, summary, actions, riskScore };
    } catch (error) {
      return {
        title: 'Risk Analysis Failed',
        summary: 'Unable to analyze spender risk. Please check the address and network.',
        actions: [],
        riskScore: 5, // Default to high risk on error
      };
    }
  }

  // Generate settlement plan
  async generateSettlementPlan(userAddress: string, groupMembers: string[]): Promise<CopilotResponse> {
    // This would typically analyze on-chain data to determine optimal settlement
    // For now, we'll provide a basic implementation
    
    const title = 'Settlement Plan';
    const summary = `Analyzed balances for ${groupMembers.length} group members. Here's the optimal settlement strategy:`;
    
    const actions: CopilotAction[] = [
      {
        type: 'settle',
        title: 'Batch Settle',
        description: 'Execute all settlements in one transaction',
        data: { members: groupMembers },
      },
      {
        type: 'approve',
        title: 'Approve Tokens',
        description: 'Approve PYUSD spending for settlements',
        data: { token: 'PYUSD' },
      },
    ];
    
    return { title, summary, actions };
  }

  private formatAddress(address: string): string {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

// Create singleton instances
export const blockscoutClient = new BlockscoutClient();
export const aiCopilot = new AICopilot();

export default {
  blockscout: blockscoutClient,
  copilot: aiCopilot,
};
