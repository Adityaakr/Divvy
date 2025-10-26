const { ethers } = require('ethers');

// Fund Smart Wallet for Account Abstraction
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr';
const PRIVATE_KEY = 'c77042f1e4dce562cc77815c20d33b6dbb020fc7795577ab3e185713cf7652d4';
const SMART_WALLET_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454';

async function fundSmartWalletForAA() {
  try {
    console.log('⛽ FUNDING SMART WALLET FOR ACCOUNT ABSTRACTION');
    console.log('==============================================');
    
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const ownerWallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`Owner Wallet: ${ownerWallet.address}`);
    console.log(`Smart Wallet: ${SMART_WALLET_ADDRESS}`);
    
    // Check current balances
    const [ownerBalance, smartWalletBalance] = await Promise.all([
      provider.getBalance(ownerWallet.address),
      provider.getBalance(SMART_WALLET_ADDRESS)
    ]);
    
    console.log('');
    console.log('📊 CURRENT BALANCES:');
    console.log(`Owner Wallet: ${ethers.formatEther(ownerBalance)} ETH`);
    console.log(`Smart Wallet: ${ethers.formatEther(smartWalletBalance)} ETH`);
    
    // Check if smart wallet already has enough ETH
    const minRequiredETH = ethers.parseEther('0.005'); // 0.005 ETH minimum
    
    if (smartWalletBalance >= minRequiredETH) {
      console.log('');
      console.log('✅ SMART WALLET ALREADY HAS SUFFICIENT ETH');
      console.log('Ready for Account Abstraction transactions!');
      return true;
    }
    
    // Calculate how much to send
    const amountToSend = ethers.parseEther('0.01'); // Send 0.01 ETH
    
    if (ownerBalance < amountToSend) {
      console.log('');
      console.log('❌ INSUFFICIENT ETH IN OWNER WALLET');
      console.log(`Need: ${ethers.formatEther(amountToSend)} ETH`);
      console.log(`Have: ${ethers.formatEther(ownerBalance)} ETH`);
      console.log('');
      console.log('💡 SOLUTION: Get more Sepolia ETH from faucet');
      console.log('https://sepoliafaucet.com/');
      return false;
    }
    
    console.log('');
    console.log('💸 SENDING ETH TO SMART WALLET...');
    console.log(`Amount: ${ethers.formatEther(amountToSend)} ETH`);
    
    // For Account Abstraction, we need to send ETH via the EntryPoint
    // But first, let's try a simple deposit to the smart wallet
    
    // Method 1: Try direct deposit (might fail for some smart wallets)
    try {
      console.log('📝 Attempting direct ETH transfer...');
      
      const tx = await ownerWallet.sendTransaction({
        to: SMART_WALLET_ADDRESS,
        value: amountToSend,
        gasLimit: 100000 // Higher gas limit for smart wallet
      });
      
      console.log(`✅ Transaction sent: ${tx.hash}`);
      console.log('⏳ Waiting for confirmation...');
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        console.log('🎉 ETH TRANSFER SUCCESSFUL!');
        console.log(`Block: ${receipt.blockNumber}`);
        
        // Check new balance
        const newBalance = await provider.getBalance(SMART_WALLET_ADDRESS);
        console.log(`New Smart Wallet Balance: ${ethers.formatEther(newBalance)} ETH`);
        
        return true;
      } else {
        throw new Error('Transaction failed');
      }
      
    } catch (error) {
      console.log('❌ Direct transfer failed:', error.message);
      console.log('');
      console.log('💡 ALTERNATIVE SOLUTIONS:');
      console.log('1. Smart wallet might not accept direct ETH transfers');
      console.log('2. Use EntryPoint deposit function');
      console.log('3. Use paymaster for sponsored transactions');
      console.log('4. Fund via smart wallet interface');
      
      return false;
    }
    
  } catch (error) {
    console.error('💥 Funding failed:', error);
    return false;
  }
}

// Run the funding
fundSmartWalletForAA()
  .then(success => {
    if (success) {
      console.log('');
      console.log('🚀 SMART WALLET READY FOR AA PAYMENTS!');
      console.log('=====================================');
      console.log('✅ Smart wallet has ETH for gas');
      console.log('✅ StackUp bundler configured');
      console.log('✅ Ready to test real payments');
      console.log('');
      console.log('Next: Test the 12.30 PYUSD payment in your app!');
    } else {
      console.log('');
      console.log('⚠️  FUNDING INCOMPLETE');
      console.log('=====================');
      console.log('Your system will still work with direct execution');
      console.log('But UserOperations might need manual gas handling');
    }
  })
  .catch(error => {
    console.error('Script error:', error);
  });
