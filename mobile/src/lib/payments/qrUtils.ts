import * as Linking from 'expo-linking';
import Constants from 'expo-constants';

// Get configuration
const config = {
  appScheme: Constants.expoConfig?.extra?.EXPO_PUBLIC_APP_SCHEME || 'splitsafe',
  deepLinkPrefix: Constants.expoConfig?.extra?.EXPO_PUBLIC_DEEP_LINK_PREFIX || 'splitsafe://',
};

export interface PaymentRequest {
  to: string;
  amount?: number;
  token?: string;
  memo?: string;
  groupId?: string;
  expenseId?: string;
}

export interface ClaimRequest {
  escrowId: string;
  amount: number;
  token?: string;
}

export interface ReceiveRequest {
  address: string;
  amount?: number;
  token?: string;
  memo?: string;
  network?: string;
}

// EIP-681 standard for Ethereum payment requests
export const generateEIP681URI = (request: PaymentRequest): string => {
  const { to, amount, token = 'PYUSD', memo } = request;
  
  let uri = `ethereum:${to}`;
  const params = new URLSearchParams();
  
  if (amount) {
    params.append('value', (amount * 1e18).toString()); // Convert to wei
  }
  
  if (token && token !== 'ETH') {
    // For ERC-20 tokens, we need the contract address
    const tokenAddresses: Record<string, string> = {
      'PYUSD': '0x6c3ea9036406852006290770BEdFcAbA0e23A0e8', // PYUSD on Ethereum
      'USDC': '0xA0b86a33E6441b8C4505b4c6c2e8c2A4C4e4e4e4', // Example USDC
    };
    
    const tokenAddress = tokenAddresses[token];
    if (tokenAddress) {
      uri = `ethereum:${tokenAddress}`;
      params.append('function', 'transfer');
      params.append('address', to);
      if (amount) {
        params.append('uint256', (amount * 1e6).toString()); // PYUSD has 6 decimals
      }
    }
  }
  
  if (memo) {
    params.append('memo', memo);
  }
  
  const queryString = params.toString();
  return queryString ? `${uri}?${queryString}` : uri;
};

// Generate SplitSafe deep link for payments
export const generatePaymentLink = (request: PaymentRequest): string => {
  const params = new URLSearchParams();
  
  params.append('to', request.to);
  if (request.amount) params.append('amount', request.amount.toString());
  if (request.token) params.append('token', request.token);
  if (request.memo) params.append('memo', request.memo);
  if (request.groupId) params.append('groupId', request.groupId);
  if (request.expenseId) params.append('expenseId', request.expenseId);
  
  return `${config.deepLinkPrefix}pay?${params.toString()}`;
};

// Generate claim link for escrows
export const generateClaimLink = (request: ClaimRequest): string => {
  const params = new URLSearchParams();
  
  params.append('id', request.escrowId);
  params.append('amount', request.amount.toString());
  if (request.token) params.append('token', request.token);
  
  return `${config.deepLinkPrefix}claim?${params.toString()}`;
};

// Generate receive QR data
export const generateReceiveQR = (request: ReceiveRequest): string => {
  // For receive, we can use either EIP-681 or our custom format
  if (request.amount && request.token) {
    // Use EIP-681 for specific payment requests
    return generateEIP681URI({
      to: request.address,
      amount: request.amount,
      token: request.token,
      memo: request.memo,
    });
  } else {
    // Use simple address for general receiving
    return request.address;
  }
};

// Parse deep link URLs
export const parseDeepLink = (url: string): { type: string; params: Record<string, string> } | null => {
  try {
    const parsed = Linking.parse(url);
    
    if (!parsed.scheme || parsed.scheme !== config.appScheme.replace('://', '')) {
      return null;
    }
    
    const type = parsed.hostname || parsed.path?.replace('/', '') || '';
    const params: Record<string, string> = {};
    
    if (parsed.queryParams) {
      Object.entries(parsed.queryParams).forEach(([key, value]) => {
        if (typeof value === 'string') {
          params[key] = value;
        } else if (Array.isArray(value) && value.length > 0) {
          params[key] = value[0];
        }
      });
    }
    
    return { type, params };
  } catch (error) {
    console.error('Error parsing deep link:', error);
    return null;
  }
};

// Share utilities
export const sharePaymentRequest = async (request: PaymentRequest): Promise<void> => {
  const link = generatePaymentLink(request);
  const message = `Pay ${request.amount ? `$${request.amount}` : 'amount'} ${request.token || 'PYUSD'} to ${request.to.slice(0, 6)}...${request.to.slice(-4)}${request.memo ? ` for ${request.memo}` : ''}\n\n${link}`;
  
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title: 'SplitSafe Payment Request',
        text: message,
        url: link,
      });
    } else {
      // Fallback to clipboard
      // Note: In React Native, you'd use @react-native-clipboard/clipboard
      console.log('Share link:', link);
    }
  } catch (error) {
    console.error('Error sharing payment request:', error);
  }
};

export const shareClaimLink = async (request: ClaimRequest): Promise<void> => {
  const link = generateClaimLink(request);
  const message = `Claim your $${request.amount} ${request.token || 'PYUSD'} escrow\n\n${link}`;
  
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share({
        title: 'SplitSafe Claim Link',
        text: message,
        url: link,
      });
    } else {
      console.log('Claim link:', link);
    }
  } catch (error) {
    console.error('Error sharing claim link:', error);
  }
};

// Gas estimation utilities
export interface GasEstimate {
  gasLimit: string;
  gasPrice: string;
  gasCost: string;
  gasCostUSD: string;
  totalCostUSD: string;
}

export const estimateGas = async (
  to: string,
  amount: number,
  token: string = 'PYUSD'
): Promise<GasEstimate> => {
  try {
    // This would typically call your RPC endpoint
    // For now, we'll return mock estimates
    const gasLimit = token === 'ETH' ? '21000' : '65000'; // Higher for ERC-20
    const gasPrice = '20000000000'; // 20 gwei
    const gasCost = (parseInt(gasLimit) * parseInt(gasPrice)).toString();
    const gasCostETH = parseInt(gasCost) / 1e18;
    
    // Mock ETH price for USD conversion
    const ethPriceUSD = 2000;
    const gasCostUSD = (gasCostETH * ethPriceUSD).toFixed(2);
    const totalCostUSD = (amount + parseFloat(gasCostUSD)).toFixed(2);
    
    return {
      gasLimit,
      gasPrice,
      gasCost,
      gasCostUSD,
      totalCostUSD,
    };
  } catch (error) {
    console.error('Error estimating gas:', error);
    // Return default estimates
    return {
      gasLimit: '65000',
      gasPrice: '20000000000',
      gasCost: '1300000000000000',
      gasCostUSD: '2.60',
      totalCostUSD: (amount + 2.60).toFixed(2),
    };
  }
};

export default {
  generateEIP681URI,
  generatePaymentLink,
  generateClaimLink,
  generateReceiveQR,
  parseDeepLink,
  sharePaymentRequest,
  shareClaimLink,
  estimateGas,
};
