const { ethers } = require('ethers');

// Fund Smart Wallet via EntryPoint (Proper AA Method)
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr';
const PRIVATE_KEY = 'c77042f1e4dce562cc77815c20d33b6dbb020fc7795577ab3e185713cf7652d4';
const SMART_WALLET_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454';
const ENTRYPOINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789';

// EntryPoint ABI for deposit
const ENTRYPOINT_ABI = [
  'function depositTo(address account) external payable',
  'function balanceOf(address account) external view returns (uint256)',
  'function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external'
];

async function fundViaEntryPoint() {
  try {
    console.log('💰 FUNDING SMART WALLET VIA ENTRYPOINT');
    console.log('======================================');
    console.log('This is the PROPER way to fund AA wallets!');
    console.log('');
    
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const ownerWallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`Owner Wallet: ${ownerWallet.address}`);
    console.log(`Smart Wallet: ${SMART_WALLET_ADDRESS}`);
    console.log(`EntryPoint: ${ENTRYPOINT_ADDRESS}`);
    
    // Create EntryPoint contract instance
    const entryPointContract = new ethers.Contract(
      ENTRYPOINT_ADDRESS,
      ENTRYPOINT_ABI,
      ownerWallet
    );
    
    // Check current balances
    const [ownerBalance, smartWalletETH, entryPointBalance] = await Promise.all([
      provider.getBalance(ownerWallet.address),
      provider.getBalance(SMART_WALLET_ADDRESS),
      entryPointContract.balanceOf(SMART_WALLET_ADDRESS)
    ]);
    
    console.log('');
    console.log('📊 CURRENT BALANCES:');
    console.log(`Owner Wallet ETH: ${ethers.formatEther(ownerBalance)} ETH`);
    console.log(`Smart Wallet ETH: ${ethers.formatEther(smartWalletETH)} ETH`);
    console.log(`EntryPoint Deposit: ${ethers.formatEther(entryPointBalance)} ETH`);
    
    // Check if already has enough deposit
    const minRequiredETH = ethers.parseEther('0.005'); // 0.005 ETH minimum
    
    if (entryPointBalance >= minRequiredETH) {
      console.log('');
      console.log('✅ SMART WALLET ALREADY HAS SUFFICIENT ENTRYPOINT DEPOSIT');
      console.log('Ready for Account Abstraction transactions!');
      return true;
    }
    
    // Calculate how much to deposit
    const amountToDeposit = ethers.parseEther('0.01'); // Deposit 0.01 ETH
    
    if (ownerBalance < amountToDeposit) {
      console.log('');
      console.log('❌ INSUFFICIENT ETH IN OWNER WALLET');
      console.log(`Need: ${ethers.formatEther(amountToDeposit)} ETH`);
      console.log(`Have: ${ethers.formatEther(ownerBalance)} ETH`);
      return false;
    }
    
    console.log('');
    console.log('💸 DEPOSITING ETH TO ENTRYPOINT...');
    console.log(`Amount: ${ethers.formatEther(amountToDeposit)} ETH`);
    console.log('This creates a deposit that your smart wallet can use for gas!');
    
    // Deposit to EntryPoint for the smart wallet
    console.log('📝 Calling EntryPoint.depositTo()...');
    
    const tx = await entryPointContract.depositTo(SMART_WALLET_ADDRESS, {
      value: amountToDeposit,
      gasLimit: 100000
    });
    
    console.log(`✅ Deposit transaction sent: ${tx.hash}`);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log('🎉 ENTRYPOINT DEPOSIT SUCCESSFUL!');
      console.log(`Block: ${receipt.blockNumber}`);
      
      // Check new balances
      const newEntryPointBalance = await entryPointContract.balanceOf(SMART_WALLET_ADDRESS);
      console.log(`New EntryPoint Deposit: ${ethers.formatEther(newEntryPointBalance)} ETH`);
      
      console.log('');
      console.log('🚀 SMART WALLET IS NOW FUNDED FOR AA!');
      console.log('====================================');
      console.log('✅ EntryPoint has ETH deposit for your smart wallet');
      console.log('✅ UserOperations can now pay gas from this deposit');
      console.log('✅ Ready for real PYUSD payments!');
      
      return true;
    } else {
      throw new Error('Deposit transaction failed');
    }
    
  } catch (error) {
    console.error('💥 EntryPoint funding failed:', error);
    
    if (error.message.includes('execution reverted')) {
      console.log('');
      console.log('💡 POSSIBLE SOLUTIONS:');
      console.log('1. EntryPoint contract might not be deployed on Sepolia');
      console.log('2. Try using a different EntryPoint address');
      console.log('3. Use direct smart wallet funding instead');
      console.log('4. Check if EntryPoint supports this function');
    }
    
    return false;
  }
}

// Run the funding
fundViaEntryPoint()
  .then(success => {
    if (success) {
      console.log('');
      console.log('🎯 NEXT STEPS:');
      console.log('=============');
      console.log('1. Your smart wallet is funded via EntryPoint');
      console.log('2. Test the StackUp bundler integration');
      console.log('3. Try the real 12.30 PYUSD payment');
      console.log('4. UserOperations will use the EntryPoint deposit for gas');
    } else {
      console.log('');
      console.log('⚠️  ENTRYPOINT FUNDING FAILED');
      console.log('============================');
      console.log('Fallback: System will use direct execution method');
      console.log('Your payments will still work, just without bundler');
    }
  })
  .catch(error => {
    console.error('Script error:', error);
  });
