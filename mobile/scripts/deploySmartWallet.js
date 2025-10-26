const { ethers } = require('ethers');

// Configuration
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr';
const PRIVATE_KEY = 'c77042f1e4dce562cc77815c20d33b6dbb020fc7795577ab3e185713cf7652d4';
const ENTRY_POINT_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'; // EntryPoint v0.6

// Simple Account Factory ABI (minimal for deployment)
const SIMPLE_ACCOUNT_FACTORY_ABI = [
  'function createAccount(address owner, uint256 salt) external returns (address)',
  'function getAddress(address owner, uint256 salt) external view returns (address)'
];

// Simple Account Factory address on Sepolia (official AA infrastructure)
const SIMPLE_ACCOUNT_FACTORY_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454';

async function deploySmartWallet() {
  try {
    console.log('🚀 Starting Smart Wallet Deployment on Sepolia...');
    
    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const deployer = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log('📋 Deployment Details:');
    console.log(`Deployer Address: ${deployer.address}`);
    
    // Check deployer balance
    const balance = await provider.getBalance(deployer.address);
    console.log(`Deployer ETH Balance: ${ethers.formatEther(balance)} ETH`);
    
    if (parseFloat(ethers.formatEther(balance)) < 0.001) {
      throw new Error('Insufficient ETH balance for deployment. Need at least 0.001 ETH for gas.');
    }
    
    // Create factory contract instance
    const factory = new ethers.Contract(
      SIMPLE_ACCOUNT_FACTORY_ADDRESS,
      SIMPLE_ACCOUNT_FACTORY_ABI,
      deployer
    );
    
    // Generate salt for unique wallet address
    const salt = ethers.randomBytes(32);
    const saltNumber = ethers.toBigInt(salt);
    
    console.log('🔍 Calculating smart wallet address...');
    
    // Get the predicted address before deployment
    const predictedAddress = await factory.getAddress(deployer.address, saltNumber);
    console.log(`Predicted Smart Wallet Address: ${predictedAddress}`);
    
    // Check if wallet already exists
    const code = await provider.getCode(predictedAddress);
    if (code !== '0x') {
      console.log('✅ Smart wallet already deployed at:', predictedAddress);
      return {
        smartWalletAddress: predictedAddress,
        owner: deployer.address,
        salt: saltNumber.toString(),
        alreadyDeployed: true
      };
    }
    
    console.log('📝 Deploying smart wallet...');
    
    // Deploy the smart wallet
    const tx = await factory.createAccount(deployer.address, saltNumber);
    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    console.log('⏳ Waiting for confirmation...');
    const receipt = await tx.wait();
    
    console.log('🎉 Smart Wallet Deployed Successfully!');
    console.log(`Block Number: ${receipt.blockNumber}`);
    console.log(`Gas Used: ${receipt.gasUsed.toString()}`);
    console.log(`Smart Wallet Address: ${predictedAddress}`);
    
    // Verify deployment
    const deployedCode = await provider.getCode(predictedAddress);
    if (deployedCode === '0x') {
      throw new Error('Deployment failed - no code at predicted address');
    }
    
    console.log('✅ Deployment verified - contract code exists');
    
    return {
      smartWalletAddress: predictedAddress,
      owner: deployer.address,
      salt: saltNumber.toString(),
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    };
    
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    throw error;
  }
}

async function fundSmartWallet(smartWalletAddress, amount = '0.001') {
  try {
    console.log(`💰 Funding smart wallet with ${amount} ETH...`);
    
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const deployer = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // Send ETH to smart wallet for gas
    const tx = await deployer.sendTransaction({
      to: smartWalletAddress,
      value: ethers.parseEther(amount)
    });
    
    console.log(`Funding transaction: ${tx.hash}`);
    await tx.wait();
    
    const balance = await provider.getBalance(smartWalletAddress);
    console.log(`Smart wallet ETH balance: ${ethers.formatEther(balance)} ETH`);
    
    return tx.hash;
  } catch (error) {
    console.error('❌ Funding failed:', error);
    throw error;
  }
}

// Main deployment function
async function main() {
  try {
    console.log('🔥 Smart Wallet Deployment Script');
    console.log('================================');
    
    // Deploy smart wallet
    const result = await deploySmartWallet();
    
    // Fund smart wallet with ETH for gas
    if (!result.alreadyDeployed) {
      await fundSmartWallet(result.smartWalletAddress);
    }
    
    console.log('\n🎉 DEPLOYMENT COMPLETE!');
    console.log('=======================');
    console.log(`Smart Wallet Address: ${result.smartWalletAddress}`);
    console.log(`Owner Address: ${result.owner}`);
    console.log(`Salt: ${result.salt}`);
    
    if (result.transactionHash) {
      console.log(`Transaction: https://sepolia.etherscan.io/tx/${result.transactionHash}`);
    }
    console.log(`Wallet: https://sepolia.etherscan.io/address/${result.smartWalletAddress}`);
    
    console.log('\n📋 Next Steps:');
    console.log('1. Transfer PYUSD to your smart wallet address');
    console.log('2. Update app to use this smart wallet address');
    console.log('3. Test real payments!');
    
    return result;
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { deploySmartWallet, fundSmartWallet };
