import { ethers } from 'ethers';

// Real Account Abstraction Payment Implementation
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr';
const PYUSD_CONTRACT_ADDRESS = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
const SMART_WALLET_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454';
const OWNER_PRIVATE_KEY = 'c77042f1e4dce562cc77815c20d33b6dbb020fc7795577ab3e185713cf7652d4';
const ENTRYPOINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

// Smart Wallet ABI - executeBatch function
const SMART_WALLET_ABI = [
  'function executeBatch((address dest, uint256 value, bytes data)[] calls) external',
  'function getNonce() external view returns (uint256)'
];

// ERC-20 ABI
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// EntryPoint ABI
const ENTRYPOINT_ABI = [
  'function handleOps((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[] ops, address beneficiary) external',
  'function getUserOpHash((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp) external view returns (bytes32)'
];

export interface RealPaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  method: 'direct' | 'userOperation';
}

export class RealAAPaymentService {
  private provider: ethers.JsonRpcProvider;
  private ownerWallet: ethers.Wallet;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    this.ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, this.provider);
  }

  async makeRealPayment(toAddress: string, amount: string): Promise<RealPaymentResult> {
    try {
      console.log('🚀 MAKING 100% REAL PYUSD PAYMENT');
      console.log('==================================');
      console.log(`FROM: ${SMART_WALLET_ADDRESS} (Smart Wallet with 100 PYUSD)`);
      console.log(`TO: ${toAddress}`);
      console.log(`AMOUNT: ${amount} PYUSD`);
      console.log(`OWNER: ${this.ownerWallet.address}`);

      // Check smart wallet PYUSD balance
      const pyusdContract = new ethers.Contract(PYUSD_CONTRACT_ADDRESS, ERC20_ABI, this.provider);
      const [balance, decimals] = await Promise.all([
        pyusdContract.balanceOf(SMART_WALLET_ADDRESS),
        pyusdContract.decimals()
      ]);

      const balanceFormatted = ethers.formatUnits(balance, decimals);
      console.log(`Smart Wallet Balance: ${balanceFormatted} PYUSD`);

      const amountInWei = ethers.parseUnits(amount, decimals);
      if (balance < amountInWei) {
        throw new Error(`Insufficient balance. Have: ${balanceFormatted} PYUSD, Need: ${amount} PYUSD`);
      }

      // Method 1: Try direct execution through owner wallet
      console.log('');
      console.log('🔄 ATTEMPTING METHOD 1: Direct Smart Wallet Execution');
      
      try {
        const result = await this.executeDirectTransfer(toAddress, amountInWei);
        if (result.success) {
          return result;
        }
      } catch (error) {
        console.log('❌ Direct execution failed:', error);
      }

      // Method 2: Create UserOperation for Account Abstraction
      console.log('');
      console.log('🔄 ATTEMPTING METHOD 2: UserOperation via EntryPoint');
      
      return await this.executeUserOperation(toAddress, amountInWei);

    } catch (error) {
      console.error('❌ REAL PAYMENT FAILED:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'direct'
      };
    }
  }

  private async executeDirectTransfer(toAddress: string, amountInWei: bigint): Promise<RealPaymentResult> {
    try {
      // Create PYUSD transfer data
      const pyusdInterface = new ethers.Interface(ERC20_ABI);
      const transferData = pyusdInterface.encodeFunctionData('transfer', [toAddress, amountInWei]);

      // Create Call struct for executeBatch
      const call = {
        dest: PYUSD_CONTRACT_ADDRESS,
        value: 0,
        data: transferData
      };

      console.log('📝 Creating executeBatch call...');
      
      // Create smart wallet contract instance
      const smartWalletContract = new ethers.Contract(
        SMART_WALLET_ADDRESS,
        SMART_WALLET_ABI,
        this.ownerWallet
      );

      // Execute the batch call
      console.log('📡 Sending executeBatch transaction...');
      const tx = await smartWalletContract.executeBatch([call]);
      
      console.log(`✅ Transaction sent: ${tx.hash}`);
      
      // Wait for confirmation
      console.log('⏳ Waiting for confirmation...');
      const receipt = await tx.wait();
      
      console.log(`🎉 REAL PAYMENT CONFIRMED! Block: ${receipt.blockNumber}`);

      return {
        success: true,
        transactionHash: tx.hash,
        method: 'direct'
      };

    } catch (error) {
      console.log('❌ Direct execution failed:', error);
      throw error;
    }
  }

  private async executeUserOperation(toAddress: string, amountInWei: bigint): Promise<RealPaymentResult> {
    try {
      console.log('🔧 Creating UserOperation...');
      
      // This would require full AA infrastructure including:
      // 1. Bundler service
      // 2. Paymaster (optional)
      // 3. Proper signature creation
      // 4. Gas estimation
      
      // For now, return that this method needs full implementation
      console.log('⚠️  UserOperation method requires full AA bundler infrastructure');
      console.log('This would need:');
      console.log('- Bundler service endpoint');
      console.log('- Proper UserOperation construction');
      console.log('- WebAuthn signature creation');
      console.log('- Gas estimation and paymaster');

      return {
        success: false,
        error: 'UserOperation method requires full AA bundler infrastructure',
        method: 'userOperation'
      };

    } catch (error) {
      console.log('❌ UserOperation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'UserOperation failed',
        method: 'userOperation'
      };
    }
  }
}

// Export singleton instance
export const realAAPaymentService = new RealAAPaymentService();
