import { BLOCKSCOUT } from '../chains';

const API = BLOCKSCOUT.api;
const API_BASE = BLOCKSCOUT.apiBase;

// Types for Blockscout API responses
export interface BlockscoutTransaction {
  hash: string;
  block_number: number;
  from: {
    hash: string;
    is_contract?: boolean;
    is_verified?: boolean;
  };
  to: {
    hash: string;
    is_contract?: boolean;
    is_verified?: boolean;
  } | null;
  value: string;
  gas_limit: string;
  gas_used: string;
  gas_price: string;
  status: 'ok' | 'error';
  method: string | null;
  decoded_input?: any;
  timestamp: string;
  confirmations: number;
}

export interface BlockscoutAddress {
  hash: string;
  is_contract: boolean;
  is_verified?: boolean;
  name?: string;
  ens_domain_name?: string;
  implementations?: any[];
  token?: any;
  watchlist_names?: any[];
  creation_tx_hash?: string;
  creator_address_hash?: string;
}

export interface BlockscoutBlock {
  height: number;
  timestamp: string;
  tx_count: number;
  hash: string;
  parent_hash: string;
  miner: {
    hash: string;
    name?: string;
  };
  size: number;
  gas_used: string;
  gas_limit: string;
}

export interface BlockscoutTrace {
  hash: string;
  from: string;
  to: string;
  status: 'ok' | 'error';
  decoded: Array<{
    method: string;
    to: string;
    params: Record<string, any>;
  }>;
  labels: Record<string, string>;
  ageSec: number;
  verified: boolean;
  source: 'mcp' | 'rest' | 'mock';
}

export interface BlockscoutAddressInfo {
  address: string;
  labels: string[];
  txCount: number;
  tokenTransfers: number;
  verified: boolean;
  createdAt?: string;
  source: 'mcp' | 'rest' | 'mock';
}

export interface BlockscoutContractInfo {
  address: string;
  verified: boolean;
  compiler?: string;
  creationTx?: string;
  ageSec: number;
  labels: string[];
  source: 'mcp' | 'rest' | 'mock';
}

// Direct Blockscout REST API calls (no secrets)
export async function bsTx(hash: `0x${string}`): Promise<BlockscoutTransaction | null> {
  try {
    const response = await fetch(`${API}/transactions/${hash}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Blockscout TX API error:', error);
    return null;
  }
}

export async function bsAddress(addr: `0x${string}`): Promise<BlockscoutAddress | null> {
  try {
    const response = await fetch(`${API}/addresses/${addr}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Blockscout Address API error:', error);
    return null;
  }
}

export async function bsAddressTxs(addr: `0x${string}`, page = 1): Promise<{ items: BlockscoutTransaction[]; next_page_params?: any } | null> {
  try {
    const response = await fetch(`${API}/addresses/${addr}/transactions?page=${page}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Blockscout Address TXs API error:', error);
    return null;
  }
}

export async function bsTokenTransfers(addr: `0x${string}`, page = 1): Promise<{ items: any[]; next_page_params?: any } | null> {
  try {
    const response = await fetch(`${API}/addresses/${addr}/token-transfers?page=${page}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Blockscout Token Transfers API error:', error);
    return null;
  }
}

export async function bsBlocks(page = 1): Promise<{ items: BlockscoutBlock[]; next_page_params?: any } | null> {
  try {
    const response = await fetch(`${API}/blocks?page=${page}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Blockscout Blocks API error:', error);
    return null;
  }
}

export async function bsTransactions(page = 1): Promise<{ items: BlockscoutTransaction[]; next_page_params?: any } | null> {
  try {
    const response = await fetch(`${API}/transactions?page=${page}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Blockscout Transactions API error:', error);
    return null;
  }
}

// Server-side MCP calls (through backend proxy)
export async function bsTraceServer(tx: `0x${string}`): Promise<BlockscoutTrace> {
  try {
    const response = await fetch(`${API_BASE}/api/blockscout/trace?tx=${tx}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Blockscout Trace Server error, using mock:', error);
    
    // Fallback to mock trace
    return {
      hash: tx,
      from: '0x' + '1'.repeat(40),
      to: '0x' + '2'.repeat(40),
      status: 'ok',
      decoded: [
        {
          method: 'transfer',
          to: '0x' + '2'.repeat(40),
          params: {
            recipient: '0x' + '3'.repeat(40),
            amount: '1000000', // 1 PYUSD
          },
        },
      ],
      labels: {
        [`0x${'2'.repeat(40)}`]: 'PYUSD Token',
        [`0x${'3'.repeat(40)}`]: 'SplitSafe Escrow',
      },
      ageSec: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      verified: true,
      source: 'mock',
    };
  }
}

export async function bsAddressServer(addr: `0x${string}`): Promise<BlockscoutAddressInfo> {
  try {
    const response = await fetch(`${API_BASE}/api/blockscout/address?addr=${addr}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Blockscout Address Server error, using mock:', error);
    
    // Fallback to mock address info
    return {
      address: addr,
      labels: ['Mock Contract', 'DeFi Protocol'],
      txCount: Math.floor(Math.random() * 10000) + 100,
      tokenTransfers: Math.floor(Math.random() * 5000) + 50,
      verified: Math.random() > 0.3, // 70% chance of verified
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'mock',
    };
  }
}

export async function bsContractServer(addr: `0x${string}`): Promise<BlockscoutContractInfo> {
  try {
    const response = await fetch(`${API_BASE}/api/blockscout/contract?addr=${addr}`, {
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.warn('Blockscout Contract Server error, using mock:', error);
    
    // Fallback to mock contract info
    const ageDays = Math.floor(Math.random() * 1000) + 1;
    return {
      address: addr,
      verified: Math.random() > 0.2, // 80% chance of verified
      compiler: 'solc-0.8.19',
      creationTx: '0x' + Math.random().toString(16).substr(2, 64),
      ageSec: ageDays * 24 * 60 * 60,
      labels: ['Smart Contract', 'Token', 'DeFi'],
      source: 'mock',
    };
  }
}

// Utility functions
export function formatAddress(address: string, ens?: string): string {
  if (ens) return ens;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function getBlockscoutTxUrl(txHash: string): string {
  return `${BLOCKSCOUT.baseUrl}/tx/${txHash}`;
}

export function getBlockscoutAddressUrl(address: string): string {
  return `${BLOCKSCOUT.baseUrl}/address/${address}`;
}

export function isRecentContract(ageSec: number): boolean {
  return ageSec < 7 * 24 * 60 * 60; // Less than 7 days
}

export function calculateRiskScore(contractInfo: BlockscoutContractInfo, addressInfo: BlockscoutAddressInfo): number {
  let score = 0;
  
  // +3 if unverified
  if (!contractInfo.verified) score += 3;
  
  // +2 if age < 7 days
  if (isRecentContract(contractInfo.ageSec)) score += 2;
  
  // +2 if very low transaction count (suspicious)
  if (addressInfo.txCount < 10) score += 2;
  
  // +1 for each suspicious label
  const suspiciousLabels = ['proxy', 'unverified', 'new'];
  score += addressInfo.labels.filter(label => 
    suspiciousLabels.some(sus => label.toLowerCase().includes(sus))
  ).length;
  
  return Math.min(10, score); // Cap at 10
}

export default {
  bsTx,
  bsAddress,
  bsAddressTxs,
  bsTokenTransfers,
  bsBlocks,
  bsTransactions,
  bsTraceServer,
  bsAddressServer,
  bsContractServer,
  formatAddress,
  getBlockscoutTxUrl,
  getBlockscoutAddressUrl,
  isRecentContract,
  calculateRiskScore,
};
