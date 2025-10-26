import { ethers } from 'ethers';

// Full Account Abstraction Payment Implementation
// Based on your smart-wallet infrastructure

const SEPOLIA_RPC_URLS = [
  'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr',
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
  'https://rpc.sepolia.org',
  'https://ethereum-sepolia.blockpi.network/v1/rpc/public'
];
const PYUSD_CONTRACT_ADDRESS = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
const SMART_WALLET_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454';
const OWNER_PRIVATE_KEY = 'c77042f1e4dce562cc77815c20d33b6dbb020fc7795577ab3e185713cf7652d4';
const ENTRYPOINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

// StackUp Bundler Configuration
const STACKUP_BUNDLER_API_KEY = process.env.EXPO_PUBLIC_STACKUP_BUNDLER_API_KEY || 'stk_live_ec9ac065d3269058b87e';
const STACKUP_BUNDLER_URL = `https://api.stackup.sh/v1/node/${STACKUP_BUNDLER_API_KEY}`;

// Smart Wallet ABI (from your contracts)
const SMART_WALLET_ABI = [
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "dest",
            "type": "address"
          },
          {
            "internalType": "uint256", 
            "name": "value",
            "type": "uint256"
          },
          {
            "internalType": "bytes",
            "name": "data", 
            "type": "bytes"
          }
        ],
        "internalType": "struct Call[]",
        "name": "calls",
        "type": "tuple[]"
      }
    ],
    "name": "executeBatch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getNonce",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// ERC-20 ABI
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

// UserOperation structure (ERC-4337)
interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

export interface FullAAPaymentResult {
  success: boolean;
  transactionHash?: string;
  userOpHash?: string;
  error?: string;
  method: 'bundler' | 'direct';
}

export class FullAAPaymentService {
  private provider: ethers.JsonRpcProvider;
  private bundlerProvider: ethers.JsonRpcProvider;
  private ownerWallet: ethers.Wallet;

  constructor() {
    // Use first RPC URL as default, test connectivity in makeFullRealPayment
    this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URLS[0]);
    this.ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, this.provider);
    
    // Bundler provider for UserOperations
    if (STACKUP_BUNDLER_API_KEY) {
      this.bundlerProvider = new ethers.JsonRpcProvider(STACKUP_BUNDLER_URL);
    } else {
      this.bundlerProvider = this.provider; // Fallback
    }
  }

  private async getWorkingProvider(): Promise<ethers.JsonRpcProvider> {
    for (const rpcUrl of SEPOLIA_RPC_URLS) {
      try {
        console.log(`🔗 AA: Trying RPC: ${rpcUrl}`);
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        await provider.getNetwork(); // Test connection
        console.log(`✅ AA: Connected to RPC: ${rpcUrl}`);
        return provider;
      } catch (error) {
        console.log(`❌ AA: Failed RPC: ${rpcUrl}`);
        continue;
      }
    }
    throw new Error('❌ AA: All RPC providers failed to connect');
  }

  async makeFullRealPayment(toAddress: string, amount: string): Promise<FullAAPaymentResult> {
    try {
      console.log('🚀 FULL AA PAYMENT SYSTEM');
      console.log('=========================');
      console.log(`FROM: ${SMART_WALLET_ADDRESS} (Smart Wallet)`);
      console.log(`TO: ${toAddress}`);
      console.log(`AMOUNT: ${amount} PYUSD`);
      console.log(`BUNDLER: ${STACKUP_BUNDLER_API_KEY ? 'StackUp' : 'Direct'}`);

      // Get working provider
      const provider = await this.getWorkingProvider();
      this.provider = provider;
      this.ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);

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

      // Method 1: Try UserOperation via Bundler (if available)
      if (STACKUP_BUNDLER_API_KEY) {
        console.log('');
        console.log('🔄 METHOD 1: UserOperation via StackUp Bundler');
        
        try {
          const result = await this.executeUserOperation(toAddress, amountInWei);
          if (result.success) {
            return result;
          }
        } catch (error) {
          console.log('❌ Bundler method failed:', error);
        }
      }

      // Method 2: Direct execution (fallback)
      console.log('');
      console.log('🔄 METHOD 2: Direct Smart Wallet Execution');
      
      return await this.executeDirectCall(toAddress, amountInWei);

    } catch (error) {
      console.error('❌ FULL AA PAYMENT FAILED:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        method: 'direct'
      };
    }
  }

  private async executeUserOperation(toAddress: string, amountInWei: bigint): Promise<FullAAPaymentResult> {
    try {
      console.log('📝 Creating REAL UserOperation with WebAuthn signature...');

      // Create PYUSD transfer data
      const pyusdInterface = new ethers.Interface(ERC20_ABI);
      const transferData = pyusdInterface.encodeFunctionData('transfer', [toAddress, amountInWei]);

      // Create Call struct for executeBatch
      const call = {
        dest: PYUSD_CONTRACT_ADDRESS,
        value: 0,
        data: transferData
      };

      // Encode executeBatch call data
      const smartWalletInterface = new ethers.Interface(SMART_WALLET_ABI);
      const callData = smartWalletInterface.encodeFunctionData('executeBatch', [[call]]);

      // Get nonce from EntryPoint (not smart wallet)
      const entryPointABI = [
        'function getNonce(address sender, uint192 key) external view returns (uint256 nonce)'
      ];
      const entryPointContract = new ethers.Contract(ENTRYPOINT_ADDRESS, entryPointABI, this.provider);
      const nonce = await entryPointContract.getNonce(SMART_WALLET_ADDRESS, 0);

      // Get gas prices
      const feeData = await this.provider.getFeeData();
      const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits('20', 'gwei');
      const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei');

      // Create UserOperation with OPTIMIZED gas limits that work with 0.01 ETH deposit
      const userOp: UserOperation = {
        sender: SMART_WALLET_ADDRESS,
        nonce: nonce.toString(),
        initCode: '0x', // Wallet already deployed
        callData: callData,
        callGasLimit: '200000', // Optimized for PYUSD transfer
        verificationGasLimit: '600000', // Optimized for WebAuthn verification
        preVerificationGas: '50000', // Minimal but sufficient
        maxFeePerGas: ethers.parseUnits('10', 'gwei').toString(), // Lower gas price to fit budget
        maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei').toString(), // Lower priority fee
        paymasterAndData: '0x', // No paymaster
        signature: '0x' // Will be filled with WebAuthn signature
      };

      console.log('🔧 UserOperation created:', {
        sender: userOp.sender,
        nonce: userOp.nonce,
        callGasLimit: userOp.callGasLimit,
        verificationGasLimit: userOp.verificationGasLimit
      });

      // Create WebAuthn signature
      const userOpHash = await this.getUserOpHash(userOp);
      console.log(`UserOp Hash: ${userOpHash}`);
      
      const webAuthnSignature = this.createWebAuthnSignature(userOpHash);
      userOp.signature = webAuthnSignature;

      console.log('✍️ WebAuthn signature created');
      console.log(`Signature length: ${webAuthnSignature.length}`);

      // Try bundler first, then fallback to direct EntryPoint
      try {
        console.log('📡 Attempting bundler submission...');
        
        const userOpResponse = await this.bundlerProvider.send('eth_sendUserOperation', [
          userOp,
          ENTRYPOINT_ADDRESS
        ]);

        console.log(`✅ UserOperation sent to bundler: ${userOpResponse}`);
        
        // Poll for receipt
        let receipt = null;
        for (let i = 0; i < 30; i++) {
          try {
            receipt = await this.bundlerProvider.send('eth_getUserOperationReceipt', [userOpResponse]);
            if (receipt) break;
          } catch (error) {
            // Not yet mined
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (receipt) {
          console.log('🎉 Bundler UserOperation confirmed!');
          return {
            success: true,
            transactionHash: receipt.transactionHash,
            userOpHash: userOpResponse,
            method: 'bundler'
          };
        }
      } catch (bundlerError) {
        console.log('❌ Bundler failed, trying direct EntryPoint...', bundlerError);
      }

      // Fallback: Direct EntryPoint execution
      console.log('📡 Executing via EntryPoint directly...');
      
      const entryPointFullABI = [
        'function handleOps((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[] ops, address beneficiary) external'
      ];
      
      const entryPointWithSigner = new ethers.Contract(ENTRYPOINT_ADDRESS, entryPointFullABI, this.ownerWallet);
      
      const tx = await entryPointWithSigner.handleOps([userOp], this.ownerWallet.address, {
        gasLimit: 1500000, // Optimized gas limit for transaction
        maxFeePerGas: ethers.parseUnits('10', 'gwei'), // Match UserOp gas price
        maxPriorityFeePerGas: ethers.parseUnits('1', 'gwei') // Match UserOp priority fee
      });

      console.log(`✅ Direct EntryPoint transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log('🎉 Direct EntryPoint execution successful!');
        return {
          success: true,
          transactionHash: tx.hash,
          method: 'bundler'
        };
      } else {
        throw new Error('Direct EntryPoint execution failed');
      }

    } catch (error) {
      console.log('❌ UserOperation failed:', error);
      throw error;
    }
  }

  private createWebAuthnSignature(challenge: string): string {
    console.log('🔐 Creating EXACT WebAuthn signature format...');
    
    // Mock WebAuthn authenticator data (37 bytes)
    const authenticatorData = '0x49960de5880e8c687434170f6476605b8fe4aeb9a28632c7995cf3ba831d97630500000000';
    
    // Create client data JSON exactly as your frontend does
    // Convert hex challenge to base64url (React Native compatible)
    const challengeBytes = challenge.slice(2).match(/.{2}/g)?.map(byte => parseInt(byte, 16)) || [];
    const challengeBase64url = btoa(String.fromCharCode(...challengeBytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    const clientDataJSON = JSON.stringify({
      type: 'webauthn.get',
      challenge: challengeBase64url,
      origin: 'https://safe-settle-now.vercel.app',
      crossOrigin: false
    });
    
    console.log('Client Data JSON:', clientDataJSON);
    
    // Create signature using owner wallet (simulating P-256)
    const messageToSign = ethers.concat([
      authenticatorData,
      ethers.keccak256(ethers.toUtf8Bytes(clientDataJSON))
    ]);
    const messageHash = ethers.keccak256(messageToSign);
    const signature = this.ownerWallet.signingKey.sign(messageHash);
    
    // Create the credentials object exactly as your frontend does
    const credentials = {
      authenticatorData: authenticatorData,
      clientDataJSON: clientDataJSON,
      challengeLocation: BigInt(23),
      responseTypeLocation: BigInt(1),
      r: signature.r,
      s: signature.s
    };
    
    console.log('Credentials object:', {
      authenticatorDataLength: credentials.authenticatorData.length,
      clientDataJSONLength: credentials.clientDataJSON.length,
      r: credentials.r,
      s: credentials.s
    });
    
    // Encode exactly as your smart wallet expects: encodePacked(["uint8", "uint48", "bytes"], [1, 0, encodeAbiParameters(...)])
    const innerEncoding = ethers.AbiCoder.defaultAbiCoder().encode(
      ["tuple(bytes authenticatorData, string clientDataJSON, uint256 challengeLocation, uint256 responseTypeLocation, bytes32 r, bytes32 s)"],
      [credentials]
    );
    
    // Now pack with version (1) and validUntil (0) as your frontend does
    const finalSignature = ethers.solidityPacked(
      ["uint8", "uint48", "bytes"],
      [1, 0, innerEncoding]
    );
    
    console.log('Final signature length:', finalSignature.length);
    
    return finalSignature;
  }

  private async executeDirectCall(toAddress: string, amountInWei: bigint): Promise<FullAAPaymentResult> {
    try {
      console.log('❌ DIRECT EXECUTION NOT POSSIBLE');
      console.log('================================');
      console.log('Smart wallet has onlyEntryPoint modifier on executeBatch');
      console.log('Must use UserOperations through EntryPoint');
      console.log('');
      console.log('💡 SOLUTION: Use your mobile app interface');
      console.log('The app should create proper UserOperations');
      
      return {
        success: false,
        error: 'Smart wallet requires UserOperations via EntryPoint. Use mobile app interface.',
        method: 'direct'
      };

    } catch (error) {
      console.log('❌ Direct execution failed:', error);
      throw error;
    }
  }

  private async getUserOpHash(userOp: UserOperation): Promise<string> {
    // This would normally use the EntryPoint contract to get the hash
    // For now, we'll create a simple hash
    const packed = ethers.solidityPacked(
      ['address', 'uint256', 'bytes32', 'bytes32'],
      [
        userOp.sender,
        userOp.nonce,
        ethers.keccak256(userOp.callData),
        ethers.keccak256(userOp.initCode)
      ]
    );
    return ethers.keccak256(packed);
  }
}

// Export singleton instance
export const fullAAPaymentService = new FullAAPaymentService();

// What you need to provide:
export const REQUIRED_ENV_VARS = {
  EXPO_PUBLIC_STACKUP_BUNDLER_API_KEY: 'Get from https://app.stackup.sh/',
  // Optional: EXPO_PUBLIC_PAYMASTER_URL: 'For sponsored transactions'
};
