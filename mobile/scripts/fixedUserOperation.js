const { ethers } = require('ethers');

// FIXED: Create proper UserOperation through EntryPoint
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr';
const PYUSD_CONTRACT_ADDRESS = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
const SMART_WALLET_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454';
const RECIPIENT_ADDRESS = '0x5A26514ce0AF943540407170B09ceA03cBFf5570';
const OWNER_PRIVATE_KEY = 'c77042f1e4dce562cc77815c20d33b6dbb020fc7795577ab3e185713cf7652d4';
const ENTRYPOINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

// EntryPoint ABI
const ENTRYPOINT_ABI = [
  'function handleOps((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature)[] ops, address beneficiary) external',
  'function getUserOpHash((address sender, uint256 nonce, bytes initCode, bytes callData, uint256 callGasLimit, uint256 verificationGasLimit, uint256 preVerificationGas, uint256 maxFeePerGas, uint256 maxPriorityFeePerGas, bytes paymasterAndData, bytes signature) userOp) external view returns (bytes32)',
  'function getNonce(address sender, uint192 key) external view returns (uint256 nonce)'
];

// Smart Wallet ABI
const SMART_WALLET_ABI = [
  'function executeBatch((address dest, uint256 value, bytes data)[] calls) external'
];

// ERC-20 ABI
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)'
];

async function createFixedUserOperation() {
  try {
    console.log('🔧 CREATING PROPER USEROPERATION');
    console.log('=================================');
    console.log('This goes through EntryPoint, not direct calls!');
    console.log('');
    console.log(`Smart Wallet: ${SMART_WALLET_ADDRESS}`);
    console.log(`Recipient: ${RECIPIENT_ADDRESS}`);
    console.log(`EntryPoint: ${ENTRYPOINT_ADDRESS}`);
    console.log('');

    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const ownerWallet = new ethers.Wallet(OWNER_PRIVATE_KEY, provider);
    
    // Check PYUSD balance
    const pyusdContract = new ethers.Contract(PYUSD_CONTRACT_ADDRESS, ERC20_ABI, provider);
    const [balance, decimals] = await Promise.all([
      pyusdContract.balanceOf(SMART_WALLET_ADDRESS),
      pyusdContract.decimals()
    ]);
    
    console.log(`Smart Wallet PYUSD: ${ethers.formatUnits(balance, decimals)} PYUSD`);
    
    const paymentAmount = ethers.parseUnits('12.30', decimals);
    if (balance < paymentAmount) {
      throw new Error('Insufficient PYUSD balance');
    }
    
    // Step 1: Create PYUSD transfer data
    const pyusdInterface = new ethers.Interface(ERC20_ABI);
    const transferData = pyusdInterface.encodeFunctionData('transfer', [RECIPIENT_ADDRESS, paymentAmount]);
    
    // Step 2: Create Call struct for executeBatch
    const call = {
      dest: PYUSD_CONTRACT_ADDRESS,
      value: 0,
      data: transferData
    };
    
    // Step 3: Encode executeBatch call data
    const smartWalletInterface = new ethers.Interface(SMART_WALLET_ABI);
    const callData = smartWalletInterface.encodeFunctionData('executeBatch', [[call]]);
    
    console.log('📝 UserOperation components:');
    console.log(`Call data length: ${callData.length}`);
    
    // Step 4: Get nonce from EntryPoint
    const entryPointContract = new ethers.Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, provider);
    const nonce = await entryPointContract.getNonce(SMART_WALLET_ADDRESS, 0);
    
    console.log(`Nonce: ${nonce.toString()}`);
    
    // Step 5: Get gas prices
    const feeData = await provider.getFeeData();
    const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits('20', 'gwei');
    const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits('2', 'gwei');
    
    // Step 6: Create UserOperation
    const userOp = {
      sender: SMART_WALLET_ADDRESS,
      nonce: nonce.toString(),
      initCode: '0x', // Wallet already deployed
      callData: callData,
      callGasLimit: '200000',
      verificationGasLimit: '500000', 
      preVerificationGas: '50000',
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
      paymasterAndData: '0x', // No paymaster
      signature: '0x' // Will be filled
    };
    
    console.log('');
    console.log('🔧 UserOperation created:');
    console.log(`Sender: ${userOp.sender}`);
    console.log(`Nonce: ${userOp.nonce}`);
    console.log(`Call Gas Limit: ${userOp.callGasLimit}`);
    
    // Step 7: Get UserOperation hash
    const userOpHash = await entryPointContract.getUserOpHash(userOp);
    console.log(`UserOp Hash: ${userOpHash}`);
    
    // Step 8: Sign the UserOperation hash
    const signature = await ownerWallet.signMessage(ethers.getBytes(userOpHash));
    userOp.signature = signature;
    
    console.log('✍️ UserOperation signed');
    
    // Step 9: Execute UserOperation through EntryPoint
    console.log('');
    console.log('📡 EXECUTING USEROPERATION VIA ENTRYPOINT...');
    console.log('This is the CORRECT way for Account Abstraction!');
    
    const entryPointWithSigner = new ethers.Contract(ENTRYPOINT_ADDRESS, ENTRYPOINT_ABI, ownerWallet);
    
    // Execute via EntryPoint.handleOps
    const tx = await entryPointWithSigner.handleOps([userOp], ownerWallet.address);
    
    console.log(`✅ UserOperation submitted: ${tx.hash}`);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('🎉 USEROPERATION SUCCESSFUL!');
      console.log(`Block: ${receipt.blockNumber}`);
      console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
      
      // Check new balances
      const [newSmartWalletBalance, newRecipientBalance] = await Promise.all([
        pyusdContract.balanceOf(SMART_WALLET_ADDRESS),
        pyusdContract.balanceOf(RECIPIENT_ADDRESS)
      ]);
      
      console.log('');
      console.log('📊 BALANCES AFTER PAYMENT:');
      console.log(`Smart Wallet: ${ethers.formatUnits(newSmartWalletBalance, decimals)} PYUSD`);
      console.log(`Recipient: ${ethers.formatUnits(newRecipientBalance, decimals)} PYUSD`);
      
      console.log('');
      console.log('🔗 TRANSACTION LINKS:');
      console.log(`Etherscan: https://sepolia.etherscan.io/tx/${tx.hash}`);
      
      return {
        success: true,
        transactionHash: tx.hash,
        userOpHash: userOpHash
      };
    } else {
      throw new Error('UserOperation failed');
    }
    
  } catch (error) {
    console.error('❌ USEROPERATION FAILED:', error);
    
    if (error.message.includes('AA23')) {
      console.log('💡 AA23 error: Paymaster validation failed or not enough deposit');
    } else if (error.message.includes('AA25')) {
      console.log('💡 AA25 error: Invalid account nonce');  
    } else if (error.message.includes('AA13')) {
      console.log('💡 AA13 error: Invalid paymaster');
    }
    
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the fixed UserOperation
createFixedUserOperation()
  .then(result => {
    if (result.success) {
      console.log('');
      console.log('🎉 SUCCESS! PROPER ACCOUNT ABSTRACTION WORKS!');
      console.log('==============================================');
      console.log(`✅ Transaction: ${result.transactionHash}`);
      console.log(`✅ UserOp Hash: ${result.userOpHash}`);
      console.log('✅ Payment went FROM smart wallet TO recipient!');
      console.log('✅ Your mobile app should work the same way!');
    } else {
      console.log('');
      console.log('❌ USEROPERATION FAILED');
      console.log('=======================');
      console.log(`Error: ${result.error}`);
      console.log('');
      console.log('💡 This might be due to:');
      console.log('- EntryPoint deposit insufficient');
      console.log('- Invalid signature format');
      console.log('- Gas estimation issues');
      console.log('- Smart wallet not properly initialized');
    }
  })
  .catch(error => {
    console.error('Script error:', error);
  });
