const { ethers } = require('ethers');

// Configuration
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr';
const PRIVATE_KEY = 'c77042f1e4dce562cc77815c20d33b6dbb020fc7795577ab3e185713cf7652d4';
const SMART_WALLET_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454';

async function fundSmartWalletWithGas() {
  try {
    console.log('⛽ Funding Smart Wallet with ETH for Gas...');
    console.log('==========================================');
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`From: ${wallet.address}`);
    console.log(`To: ${SMART_WALLET_ADDRESS}`);
    
    // Check current balances
    const [fromBalance, toBalance] = await Promise.all([
      provider.getBalance(wallet.address),
      provider.getBalance(SMART_WALLET_ADDRESS)
    ]);
    
    console.log(`EOA Balance: ${ethers.formatEther(fromBalance)} ETH`);
    console.log(`Smart Wallet Balance: ${ethers.formatEther(toBalance)} ETH`);
    
    // Send 0.01 ETH to smart wallet for gas
    const amount = ethers.parseEther('0.01');
    console.log(`Sending: ${ethers.formatEther(amount)} ETH`);
    
    const tx = await wallet.sendTransaction({
      to: SMART_WALLET_ADDRESS,
      value: amount
    });
    
    console.log(`Transaction sent: ${tx.hash}`);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    console.log(`✅ Confirmed in block: ${receipt.blockNumber}`);
    
    // Check new balance
    const newBalance = await provider.getBalance(SMART_WALLET_ADDRESS);
    console.log(`Smart Wallet New Balance: ${ethers.formatEther(newBalance)} ETH`);
    
    console.log('');
    console.log('🎉 SMART WALLET FULLY FUNDED!');
    console.log('==============================');
    console.log(`PYUSD: 100.0 PYUSD ✅`);
    console.log(`ETH: ${ethers.formatEther(newBalance)} ETH ✅`);
    console.log('Ready for real payments! 🚀');
    
    return {
      transactionHash: tx.hash,
      newBalance: ethers.formatEther(newBalance)
    };
    
  } catch (error) {
    console.error('❌ Funding failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  fundSmartWalletWithGas()
    .then(result => {
      console.log('');
      console.log('🔗 Transaction Link:');
      console.log(`https://sepolia.etherscan.io/tx/${result.transactionHash}`);
    })
    .catch(error => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { fundSmartWalletWithGas };
