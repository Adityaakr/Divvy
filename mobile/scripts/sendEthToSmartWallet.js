const { ethers } = require('ethers');

// Configuration
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr';
const PRIVATE_KEY = 'c77042f1e4dce562cc77815c20d33b6dbb020fc7795577ab3e185713cf7652d4';
const SMART_WALLET_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454';

async function sendEthToSmartWallet() {
  try {
    console.log('💸 Sending ETH to Smart Wallet...');
    console.log('==================================');
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`From: ${wallet.address}`);
    console.log(`To: ${SMART_WALLET_ADDRESS}`);
    
    // Check current balances
    const fromBalance = await provider.getBalance(wallet.address);
    const toBalance = await provider.getBalance(SMART_WALLET_ADDRESS);
    
    console.log(`From Balance: ${ethers.formatEther(fromBalance)} ETH`);
    console.log(`To Balance: ${ethers.formatEther(toBalance)} ETH`);
    
    // Amount to send
    const amount = ethers.parseEther('0.01');
    console.log(`Amount: ${ethers.formatEther(amount)} ETH`);
    
    // Check if we have enough balance
    if (fromBalance < amount) {
      throw new Error(`Insufficient balance. Have: ${ethers.formatEther(fromBalance)} ETH, Need: ${ethers.formatEther(amount)} ETH`);
    }
    
    console.log('');
    console.log('📝 Creating transaction...');
    
    // Create transaction with lower gas limit for simple transfer
    const tx = await wallet.sendTransaction({
      to: SMART_WALLET_ADDRESS,
      value: amount,
      gasLimit: 21000, // Standard ETH transfer gas limit
    });
    
    console.log(`✅ Transaction sent: ${tx.hash}`);
    console.log('⏳ Waiting for confirmation...');
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    console.log(`🎉 Transaction confirmed!`);
    console.log(`Block: ${receipt.blockNumber}`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    
    // Check new balances
    const newFromBalance = await provider.getBalance(wallet.address);
    const newToBalance = await provider.getBalance(SMART_WALLET_ADDRESS);
    
    console.log('');
    console.log('📊 Updated Balances:');
    console.log(`From: ${ethers.formatEther(newFromBalance)} ETH`);
    console.log(`To: ${ethers.formatEther(newToBalance)} ETH`);
    
    console.log('');
    console.log('🎉 SUCCESS!');
    console.log(`Sent ${ethers.formatEther(amount)} ETH to smart wallet`);
    
    return {
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      newSmartWalletBalance: ethers.formatEther(newToBalance)
    };
    
  } catch (error) {
    console.error('❌ Transfer failed:', error);
    
    // Provide helpful error messages
    if (error.message.includes('insufficient funds')) {
      console.log('💡 Tip: Make sure you have enough ETH for the transfer + gas fees');
    } else if (error.message.includes('execution reverted')) {
      console.log('💡 Tip: The smart wallet might not accept direct ETH transfers');
      console.log('This is normal for some smart wallet implementations');
    }
    
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  sendEthToSmartWallet()
    .then(result => {
      console.log('');
      console.log('🔗 Transaction Link:');
      console.log(`https://sepolia.etherscan.io/tx/${result.transactionHash}`);
      console.log('');
      console.log('🔗 Smart Wallet:');
      console.log(`https://sepolia.etherscan.io/address/${SMART_WALLET_ADDRESS}`);
    })
    .catch(error => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { sendEthToSmartWallet };
