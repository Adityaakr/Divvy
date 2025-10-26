const { ethers } = require('ethers');

// Configuration
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr';
const PRIVATE_KEY = 'c77042f1e4dce562cc77815c20d33b6dbb020fc7795577ab3e185713cf7652d4';
const PYUSD_CONTRACT_ADDRESS = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
const SMART_WALLET_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454';
const EOA_ADDRESS = '0x5A26514ce0AF943540407170B09ceA03cBFf5570';

// ERC-20 ABI
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
];

async function transferPyusdToEoa() {
  try {
    console.log('💸 Transferring PYUSD from Smart Wallet to EOA...');
    console.log('==================================================');
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`From Smart Wallet: ${SMART_WALLET_ADDRESS}`);
    console.log(`To EOA: ${EOA_ADDRESS}`);
    console.log(`Owner Wallet: ${wallet.address}`);
    
    // Create PYUSD contract instance
    const pyusdContract = new ethers.Contract(PYUSD_CONTRACT_ADDRESS, ERC20_ABI, provider);
    
    // Check current balances
    const [smartWalletBalance, eoaBalance, decimals] = await Promise.all([
      pyusdContract.balanceOf(SMART_WALLET_ADDRESS),
      pyusdContract.balanceOf(EOA_ADDRESS),
      pyusdContract.decimals()
    ]);
    
    console.log(`Smart Wallet PYUSD: ${ethers.formatUnits(smartWalletBalance, decimals)} PYUSD`);
    console.log(`EOA PYUSD: ${ethers.formatUnits(eoaBalance, decimals)} PYUSD`);
    
    if (smartWalletBalance === 0n) {
      console.log('❌ Smart wallet has no PYUSD to transfer');
      return;
    }
    
    // For this demo, we'll transfer from the owner wallet (which should have PYUSD)
    // In reality, the smart wallet would need proper AA infrastructure
    console.log('');
    console.log('⚠️  NOTE: This is a simplified approach');
    console.log('In a full AA implementation, we would:');
    console.log('1. Create a UserOperation for the smart wallet');
    console.log('2. Sign it with the owner key');
    console.log('3. Submit to a bundler');
    console.log('');
    console.log('For now, we\'ll check if the owner wallet has PYUSD to work with...');
    
    // Check owner wallet PYUSD balance
    const ownerBalance = await pyusdContract.balanceOf(wallet.address);
    console.log(`Owner Wallet PYUSD: ${ethers.formatUnits(ownerBalance, decimals)} PYUSD`);
    
    if (ownerBalance > 0n) {
      console.log('✅ Owner wallet has PYUSD - can be used for payments directly');
      return {
        canPayDirectly: true,
        paymentWallet: wallet.address,
        balance: ethers.formatUnits(ownerBalance, decimals)
      };
    } else {
      console.log('❌ Owner wallet has no PYUSD');
      console.log('');
      console.log('💡 SOLUTION: Use the smart wallet address in the app');
      console.log('The app should show the smart wallet balance (100 PYUSD)');
      console.log('And handle payments through proper AA infrastructure');
      
      return {
        canPayDirectly: false,
        smartWalletBalance: ethers.formatUnits(smartWalletBalance, decimals),
        needsAAImplementation: true
      };
    }
    
  } catch (error) {
    console.error('❌ Transfer failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  transferPyusdToEoa()
    .then(result => {
      console.log('');
      console.log('📊 Result:', result);
    })
    .catch(error => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { transferPyusdToEoa };
