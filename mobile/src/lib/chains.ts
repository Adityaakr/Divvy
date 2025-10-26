import Constants from 'expo-constants';

export const BLOCKSCOUT = {
  baseUrl: Constants.expoConfig?.extra?.EXPO_PUBLIC_BLOCKSCOUT_BASE || 'https://eth-sepolia.blockscout.com',
  api: Constants.expoConfig?.extra?.EXPO_PUBLIC_BLOCKSCOUT_API || 'https://eth-sepolia.blockscout.com/api/v2',
  chainName: Constants.expoConfig?.extra?.EXPO_PUBLIC_BLOCKSCOUT_CHAIN_NAME || 'Ethereum Sepolia',
  apiBase: Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE || 'http://localhost:3001',
} as const;

export const CHAIN_CONFIG = {
  'ethereum-sepolia': {
    id: 11155111,
    name: 'Ethereum Sepolia',
    blockscout: 'https://eth-sepolia.blockscout.com',
    rpc: 'https://sepolia.infura.io/v3/your_infura_key_here',
  },
  'polygon': {
    id: 137,
    name: 'Polygon',
    blockscout: 'https://polygon.blockscout.com',
    rpc: 'https://polygon-rpc.com',
  },
  'mainnet': {
    id: 1,
    name: 'Ethereum',
    blockscout: 'https://eth.blockscout.com',
    rpc: 'https://eth.llamarpc.com',
  },
} as const;

export type ChainId = keyof typeof CHAIN_CONFIG;

export function getChainConfig(chainId: ChainId) {
  return CHAIN_CONFIG[chainId];
}

export default {
  BLOCKSCOUT,
  CHAIN_CONFIG,
  getChainConfig,
};
