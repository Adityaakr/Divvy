import Constants from 'expo-constants';

export const BLOCKSCOUT = {
  baseUrl: Constants.expoConfig?.extra?.EXPO_PUBLIC_BLOCKSCOUT_BASE || 'https://arbitrum-sepolia.blockscout.com',
  api: Constants.expoConfig?.extra?.EXPO_PUBLIC_BLOCKSCOUT_API || 'https://arbitrum-sepolia.blockscout.com/api/v2',
  chainName: Constants.expoConfig?.extra?.EXPO_PUBLIC_BLOCKSCOUT_CHAIN_NAME || 'Arbitrum Sepolia',
  apiBase: Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE || 'http://localhost:3001',
} as const;

export const CHAIN_CONFIG = {
  'arbitrum-sepolia': {
    id: 421614,
    name: 'Arbitrum Sepolia',
    blockscout: 'https://arbitrum-sepolia.blockscout.com',
    rpc: 'https://sepolia-rollup.arbitrum.io/rpc',
  },
  'base-sepolia': {
    id: 84532,
    name: 'Base Sepolia',
    blockscout: 'https://base-sepolia.blockscout.com',
    rpc: 'https://sepolia.base.org',
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
