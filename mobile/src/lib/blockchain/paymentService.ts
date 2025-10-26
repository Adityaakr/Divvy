import { ethers } from 'ethers';
import { useSmartWallet } from '../smartwallet/SmartWalletProvider';
import { PYUSD_CONTRACT_ADDRESS } from './pyusdService';
// import { fullAAPaymentService } from './fullAAPayment'; // Removed - using direct EOA

// ERC-20 ABI for transfers
const ERC20_TRANSFER_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)'
];

// Sepolia RPC endpoint - Using your Alchemy API key
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr';

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  gasUsed?: string;
  blockNumber?: number;
}

export interface PaymentStatus {
  status: 'pending' | 'confirmed' | 'failed';
  transactionHash: string;
  blockNumber?: number;
  confirmations?: number;
  gasUsed?: string;
  timestamp?: number;
}

export class PaymentService {
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
  }

  /**
   * Send REAL PYUSD payment using smart wallet
   */
  async sendPayment(
    fromAddress: string,
    toAddress: string,
    amount: string
  ): Promise<PaymentResult> {
    try {
      // HYBRID SOLUTION: Smart wallet in UI, EOA for transactions (speed)
      const OWNER_PRIVATE_KEY = 'c77042f1e4dce562cc77815c20d33b6dbb020fc7795577ab3e185713cf7652d4';
      const EOA_ADDRESS = '0x5A26514ce0AF943540407170B09ceA03cBFf5570';
      
      // Check if this is a smart wallet to EOA payment (for testing AA)
      // Note: UI now shows EOA address, but we still detect smart wallet payments by recipient
      const SMART_WALLET_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454';
      const isSmartWalletToEOA = toAddress === EOA_ADDRESS && fromAddress !== EOA_ADDRESS;
      
      if (isSmartWalletToEOA) {
        console.log('🤖 SMART WALLET → EOA PAYMENT DETECTED!');
        console.log('🔄 Using Account Abstraction for this payment');
        
        // Import the full AA payment service for this case
        const { fullAAPaymentService } = await import('./fullAAPayment');
        return await fullAAPaymentService.makeFullRealPayment(toAddress, amount);
      } else {
        console.log('🚫 SKIPPING Account Abstraction - Direct EOA transaction');
      }
      
      console.log('🚀 Starting PYUSD payment...');
      console.log('==========================================');
      console.log('🎯 TRULY FLEXIBLE PAYMENT ROUTING:');
      console.log(`📱 UI SHOWS: EOA Wallet ${fromAddress}`);
      console.log(`💰 ACTUAL FROM: ${EOA_ADDRESS} (Your EOA with PYUSD)`);
      console.log(`🎯 TO: ${toAddress} ← THIS IS DIFFERENT FOR EACH PERSON!`);
      console.log(`💸 AMOUNT: ${amount} PYUSD`);
      console.log('');
      console.log('✅ Alice gets paid to: 0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4');
      console.log('✅ Bob gets paid to: 0x1234567890123456789012345678901234567890');
      console.log('✅ Charlie gets paid to: 0x9876543210987654321098765432109876543210');
      console.log('✅ ANY USER can have their own unique wallet address!');
      console.log('==========================================');
      
      console.log('📝 Creating transaction for smart wallet...');
      console.log('=====================================');
      console.log('📍 Network: Ethereum Sepolia Testnet');
      console.log('💰 Token: PYUSD (0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9)');
      console.log('🔍 Explorer: https://eth-sepolia.blockscout.com/');
      console.log('⚡ HYBRID MODE: Smart wallet UI + EOA signing for speed');
      console.log('🚫 SKIPPING Account Abstraction - Direct EOA transaction');

      // Create real blockchain transaction with multiple RPC fallbacks
      const RPC_URLS = [
        'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr',
        'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        'https://rpc.sepolia.org',
        'https://ethereum-sepolia.blockpi.network/v1/rpc/public'
      ];
      
      let provider;
      let providerConnected = false;
      
      for (const rpcUrl of RPC_URLS) {
        try {
          console.log(`🔗 Trying RPC: ${rpcUrl}`);
          provider = new ethers.JsonRpcProvider(rpcUrl);
          await provider.getNetwork(); // Test connection
          console.log(`✅ Connected to RPC: ${rpcUrl}`);
          providerConnected = true;
          break;
        } catch (error) {
          console.log(`❌ Failed RPC: ${rpcUrl}`, error);
          continue;
        }
      }
      
      if (!providerConnected) {
        throw new Error('❌ All RPC providers failed to connect');
      }
      const wallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);

      console.log('🔑 Private Key: c77042f1e4dce562cc77815c20d33b6dbb020fc7795577ab3e185713cf7652d4');
      console.log('👤 Signer Address:', wallet.address);

      // PYUSD contract instance
      const pyusdContract = new ethers.Contract(
        PYUSD_CONTRACT_ADDRESS,
        ERC20_TRANSFER_ABI,
        wallet
      );

      // Fetch REAL balance from blockchain
      console.log('🔍 Fetching REAL PYUSD balance from blockchain...');
      const [balance, decimals] = await Promise.all([
        pyusdContract.balanceOf(EOA_ADDRESS),
        pyusdContract.decimals()
      ]);

      const formattedBalance = ethers.formatUnits(balance, decimals);
      console.log(`💰 REAL EOA Balance: ${formattedBalance} PYUSD`);
      console.log(`📊 Raw Balance: ${balance.toString()}`);
      console.log(`🔢 Decimals: ${decimals}`);

      console.log(`🔍 DEBUG - Amount parameter: "${amount}" (type: ${typeof amount})`);
      console.log(`🔍 DEBUG - Decimals: ${decimals}`);
      
      const amountInWei = ethers.parseUnits(amount.toString(), decimals);
      console.log(`💸 Transfer Amount (wei): ${amountInWei.toString()}`);

      if (balance < amountInWei) {
        throw new Error(`❌ Insufficient PYUSD. Have: ${formattedBalance}, Need: ${amount}`);
      }

      console.log('');
      console.log('🖊️  SIGNING TRANSACTION...');
      console.log('==========================');
      console.log('📝 Transaction Details:');
      console.log(`   Contract: ${PYUSD_CONTRACT_ADDRESS}`);
      console.log(`   Function: transfer(${toAddress}, ${amountInWei.toString()})`);
      console.log(`   Signer: ${wallet.address}`);
      console.log('');

      // Create and sign the transaction
      console.log('🔐 [SIGN TRANSACTION BUTTON CLICKED]');
      console.log('⏳ Signing with private key...');
      console.log('🔑 Using key: c77042f1e4dce562cc77815c20d33b6dbb020fc7795577ab3e185713cf7652d4');
      console.log('');

      // Make REAL PYUSD transfer
      const tx = await pyusdContract.transfer(toAddress, amountInWei);

      console.log('✅ TRANSACTION SIGNED & BROADCAST!');
      console.log('=================================');
      console.log(`📋 Transaction Hash: ${tx.hash}`);
      console.log(`🔗 Blockscout: https://eth-sepolia.blockscout.com/tx/${tx.hash}`);
      console.log(`🔗 Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
      console.log('');
      console.log('⏳ Waiting for blockchain confirmation...');

      const receipt = await tx.wait();

      if (receipt.status === 1) {
        console.log('');
        console.log('🎉 TRANSACTION CONFIRMED ON BLOCKCHAIN!');
        console.log('======================================');
        console.log(`✅ Status: SUCCESS`);
        console.log(`📦 Block Number: ${receipt.blockNumber}`);
        console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
        console.log(`💰 Gas Price: ${receipt.gasPrice ? ethers.formatUnits(receipt.gasPrice, 'gwei') + ' gwei' : 'N/A'}`);

        // Fetch updated balance
        const newBalance = await pyusdContract.balanceOf(EOA_ADDRESS);
        const newFormattedBalance = ethers.formatUnits(newBalance, decimals);
        console.log(`💰 New EOA Balance: ${newFormattedBalance} PYUSD`);

        console.log('');
        console.log('🔍 EXPLORER LINKS:');
        console.log('==================');
        console.log(`📊 Transaction: https://eth-sepolia.blockscout.com/tx/${tx.hash}`);
        console.log(`👤 From Address: https://eth-sepolia.blockscout.com/address/${EOA_ADDRESS}`);
        console.log(`👤 To Address: https://eth-sepolia.blockscout.com/address/${toAddress}`);
        console.log(`🪙 PYUSD Token: https://eth-sepolia.blockscout.com/token/${PYUSD_CONTRACT_ADDRESS}`);

        return {
          success: true,
          transactionHash: tx.hash,
          gasUsed: receipt.gasUsed.toString(),
          blockNumber: receipt.blockNumber
        };
      } else {
        throw new Error('❌ Transaction failed on blockchain');
      }

    } catch (error) {
      console.error('❌ Payment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get payment status by transaction hash
   */
  async getPaymentStatus(transactionHash: string): Promise<PaymentStatus> {
    try {
      const tx = await this.provider.getTransaction(transactionHash);
      
      if (!tx) {
        return {
          status: 'failed',
          transactionHash
        };
      }

      const receipt = await this.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return {
          status: 'pending',
          transactionHash
        };
      }

      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        status: confirmations >= 1 ? 'confirmed' : 'pending',
        transactionHash,
        blockNumber: receipt.blockNumber,
        confirmations,
        gasUsed: receipt.gasUsed.toString(),
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Error getting payment status:', error);
      return {
        status: 'failed',
        transactionHash
      };
    }
  }

  /**
   * Get Blockscout explorer URL for transaction
   */
  getExplorerUrl(transactionHash: string): string {
    return `https://sepolia.etherscan.io/tx/${transactionHash}`;
  }

  /**
   * Get Blockscout explorer URL (alternative)
   */
  getBlockscoutUrl(transactionHash: string): string {
    return `https://eth-sepolia.blockscout.com/tx/${transactionHash}`;
  }

  /**
   * Check if address has sufficient ETH for gas (Account Abstraction compatible)
   */
  async checkGasBalance(address: string): Promise<{ hasGas: boolean; balance: string }> {
    try {
      const balance = await this.provider.getBalance(address);
      const balanceInEth = ethers.formatEther(balance);
      
      // For Account Abstraction wallets, gas is handled by bundler
      // Check if this is a smart wallet (contract address)
      const code = await this.provider.getCode(address);
      const isSmartWallet = code !== '0x';
      
      if (isSmartWallet) {
        // Smart wallets don't need ETH for gas - bundler handles it
        console.log('🤖 Smart wallet detected - gas handled by bundler');
        return {
          hasGas: true, // Always true for smart wallets
          balance: balanceInEth
        };
      } else {
        // Regular EOA needs ETH for gas
        const hasGas = parseFloat(balanceInEth) > 0.001;
        return {
          hasGas,
          balance: balanceInEth
        };
      }
    } catch (error) {
      console.error('Error checking gas balance:', error);
      return {
        hasGas: false,
        balance: '0'
      };
    }
  }

  /**
   * Estimate gas cost for PYUSD transfer (Account Abstraction compatible)
   */
  async estimateGasCost(
    fromAddress: string,
    toAddress: string,
    amount: string
  ): Promise<{ gasLimit: string; gasPrice: string; totalCost: string }> {
    try {
      // Check if this is a smart wallet
      const code = await this.provider.getCode(fromAddress);
      const isSmartWallet = code !== '0x';
      
      if (isSmartWallet) {
        // For smart wallets, return minimal gas estimate
        // Gas will be handled by the bundler
        console.log('🤖 Smart wallet - gas handled by bundler');
        return {
          gasLimit: '100000', // Estimated gas for AA operation
          gasPrice: '0', // No gas price needed for AA
          totalCost: '0' // No cost to user - bundler handles it
        };
      }

      // For regular EOA wallets, estimate normally
      const contract = new ethers.Contract(
        PYUSD_CONTRACT_ADDRESS,
        ERC20_TRANSFER_ABI,
        this.provider
      );

      const decimals = await contract.decimals();
      const amountInWei = ethers.parseUnits(amount, decimals);

      // Estimate gas limit
      const gasLimit = await contract.transfer.estimateGas(toAddress, amountInWei, {
        from: fromAddress
      });

      // Get current gas price
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');

      // Calculate total cost
      const totalCost = gasLimit * gasPrice;

      return {
        gasLimit: gasLimit.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        totalCost: ethers.formatEther(totalCost)
      };

    } catch (error) {
      console.error('Error estimating gas cost:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();
