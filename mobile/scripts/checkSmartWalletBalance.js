const { ethers } = require('ethers');

// Configuration
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr';
const PYUSD_CONTRACT_ADDRESS = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';
const SMART_WALLET_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454';
const EOA_ADDRESS = '0x5A26514ce0AF943540407170B09ceA03cBFf5570';

// ERC-20 ABI for balance checking
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

async function checkBalances() {
  try {
    console.log('🔍 Checking Smart Wallet Balances...');
    console.log('=====================================');
    
    // Create provider
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    
    // Create PYUSD contract instance
    const pyusdContract = new ethers.Contract(PYUSD_CONTRACT_ADDRESS, ERC20_ABI, provider);
    
    // Get token info
    const [name, symbol, decimals] = await Promise.all([
      pyusdContract.name(),
      pyusdContract.symbol(),
      pyusdContract.decimals()
    ]);
    
    console.log(`📋 Token Info: ${name} (${symbol})`);
    console.log(`📋 Decimals: ${decimals}`);
    console.log('');
    
    // Check ETH balances
    console.log('💰 ETH Balances:');
    console.log('================');
    
    const [smartWalletEthBalance, eoaEthBalance] = await Promise.all([
      provider.getBalance(SMART_WALLET_ADDRESS),
      provider.getBalance(EOA_ADDRESS)
    ]);
    
    console.log(`Smart Wallet ETH: ${ethers.formatEther(smartWalletEthBalance)} ETH`);
    console.log(`EOA ETH: ${ethers.formatEther(eoaEthBalance)} ETH`);
    console.log('');
    
    // Check PYUSD balances
    console.log('🪙 PYUSD Balances:');
    console.log('==================');
    
    const [smartWalletPyusdBalance, eoaPyusdBalance] = await Promise.all([
      pyusdContract.balanceOf(SMART_WALLET_ADDRESS),
      pyusdContract.balanceOf(EOA_ADDRESS)
    ]);
    
    const smartWalletPyusdFormatted = ethers.formatUnits(smartWalletPyusdBalance, decimals);
    const eoaPyusdFormatted = ethers.formatUnits(eoaPyusdBalance, decimals);
    
    console.log(`Smart Wallet PYUSD: ${smartWalletPyusdFormatted} ${symbol}`);
    console.log(`EOA PYUSD: ${eoaPyusdFormatted} ${symbol}`);
    console.log('');
    
    // Summary
    console.log('📊 Summary:');
    console.log('===========');
    console.log(`Smart Wallet Address: ${SMART_WALLET_ADDRESS}`);
    console.log(`EOA Address: ${EOA_ADDRESS}`);
    console.log('');
    
    // Check if smart wallet needs funding
    if (parseFloat(smartWalletPyusdFormatted) === 0) {
      console.log('⚠️  SMART WALLET NEEDS PYUSD FUNDING');
      console.log('=====================================');
      console.log('Your smart wallet has 0 PYUSD. To make payments:');
      console.log(`1. Transfer PYUSD from EOA (${eoaPyusdFormatted} ${symbol} available)`);
      console.log(`2. To smart wallet: ${SMART_WALLET_ADDRESS}`);
      console.log('3. Suggested amount: 50 PYUSD for testing');
    } else {
      console.log('✅ SMART WALLET IS FUNDED');
      console.log('=========================');
      console.log(`Ready for payments with ${smartWalletPyusdFormatted} ${symbol}!`);
    }
    
    // Check if smart wallet has enough ETH for gas
    if (parseFloat(ethers.formatEther(smartWalletEthBalance)) < 0.001) {
      console.log('');
      console.log('⚠️  LOW ETH FOR GAS');
      console.log('===================');
      console.log('Smart wallet may need more ETH for gas fees.');
      console.log('Current ETH balance may be sufficient for a few transactions.');
    }
    
    return {
      smartWallet: {
        address: SMART_WALLET_ADDRESS,
        ethBalance: ethers.formatEther(smartWalletEthBalance),
        pyusdBalance: smartWalletPyusdFormatted
      },
      eoa: {
        address: EOA_ADDRESS,
        ethBalance: ethers.formatEther(eoaEthBalance),
        pyusdBalance: eoaPyusdFormatted
      }
    };
    
  } catch (error) {
    console.error('❌ Error checking balances:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  checkBalances()
    .then(() => {
      console.log('');
      console.log('🔗 Useful Links:');
      console.log(`Smart Wallet: https://sepolia.etherscan.io/address/${SMART_WALLET_ADDRESS}`);
      console.log(`EOA: https://sepolia.etherscan.io/address/${EOA_ADDRESS}`);
      console.log(`PYUSD Token: https://sepolia.etherscan.io/address/${PYUSD_CONTRACT_ADDRESS}`);
    })
    .catch(error => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { checkBalances };
