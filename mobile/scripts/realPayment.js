const { ethers } = require('ethers');

// Configuration - REAL PAYMENT SETUP
const SEPOLIA_RPC_URL = 'https://eth-sepolia.g.alchemy.com/v2/YPmWzYQfyK65GmGYn9yJr';
const PRIVATE_KEY = 'c77042f1e4dce562cc77815c20d33b6dbb020fc7795577ab3e185713cf7652d4';
const PYUSD_CONTRACT_ADDRESS = '0xCaC524BcA292aaade2DF8A05cC58F0a65B1B3bB9';

// Payment details
const FROM_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454'; // Your smart wallet (has 100 PYUSD)
const TO_ADDRESS = '0x5A26514ce0AF943540407170B09ceA03cBFf5570';   // Person who paid for you
const AMOUNT = '12.30'; // PYUSD amount to pay back

// ERC-20 ABI
const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
];

async function makeRealPayment() {
  try {
    console.log('🚀 MAKING 100% REAL PYUSD PAYMENT');
    console.log('==================================');
    console.log(`FROM: ${FROM_ADDRESS} (Your smart wallet)`);
    console.log(`TO: ${TO_ADDRESS} (Person who paid for you)`);
    console.log(`AMOUNT: ${AMOUNT} PYUSD`);
    console.log('');

    // Create provider and wallet
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    const ownerWallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`Owner wallet: ${ownerWallet.address}`);
    
    // Create PYUSD contract instance
    const pyusdContract = new ethers.Contract(PYUSD_CONTRACT_ADDRESS, ERC20_ABI, provider);
    const contractWithSigner = new ethers.Contract(PYUSD_CONTRACT_ADDRESS, ERC20_ABI, ownerWallet);
    
    // Get token info
    const [symbol, decimals] = await Promise.all([
      pyusdContract.symbol(),
      pyusdContract.decimals()
    ]);
    
    console.log(`Token: ${symbol}, Decimals: ${decimals}`);
    
    // Check balances before payment
    const [fromBalance, toBalance, ownerBalance] = await Promise.all([
      pyusdContract.balanceOf(FROM_ADDRESS),
      pyusdContract.balanceOf(TO_ADDRESS),
      pyusdContract.balanceOf(ownerWallet.address)
    ]);
    
    console.log('');
    console.log('📊 BALANCES BEFORE PAYMENT:');
    console.log(`Smart Wallet: ${ethers.formatUnits(fromBalance, decimals)} ${symbol}`);
    console.log(`Recipient: ${ethers.formatUnits(toBalance, decimals)} ${symbol}`);
    console.log(`Owner Wallet: ${ethers.formatUnits(ownerBalance, decimals)} ${symbol}`);
    
    // Convert amount to wei
    const amountInWei = ethers.parseUnits(AMOUNT, decimals);
    console.log(`Amount in wei: ${amountInWei.toString()}`);
    
    // Check if we have enough balance
    let paymentWallet, paymentBalance;
    
    if (fromBalance >= amountInWei) {
      console.log('');
      console.log('❌ PROBLEM: Smart wallet has PYUSD but needs AA infrastructure');
      console.log('💡 SOLUTION: Transfer from owner wallet if it has PYUSD');
      
      if (ownerBalance >= amountInWei) {
        paymentWallet = ownerWallet.address;
        paymentBalance = ownerBalance;
        console.log('✅ Using owner wallet for payment');
      } else {
        throw new Error('Neither smart wallet nor owner wallet can make the payment');
      }
    } else if (ownerBalance >= amountInWei) {
      paymentWallet = ownerWallet.address;
      paymentBalance = ownerBalance;
      console.log('✅ Using owner wallet for payment');
    } else {
      throw new Error(`Insufficient balance. Need: ${AMOUNT} ${symbol}`);
    }
    
    console.log('');
    console.log('💸 SENDING REAL PAYMENT...');
    console.log(`From: ${paymentWallet}`);
    console.log(`To: ${TO_ADDRESS}`);
    console.log(`Amount: ${AMOUNT} ${symbol}`);
    
    // Send the REAL transaction
    const tx = await contractWithSigner.transfer(TO_ADDRESS, amountInWei);
    console.log(`✅ Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    console.log('⏳ Waiting for blockchain confirmation...');
    const receipt = await tx.wait();
    
    console.log(`🎉 PAYMENT CONFIRMED!`);
    console.log(`Block: ${receipt.blockNumber}`);
    console.log(`Gas used: ${receipt.gasUsed.toString()}`);
    
    // Check balances after payment
    const [newFromBalance, newToBalance] = await Promise.all([
      pyusdContract.balanceOf(paymentWallet),
      pyusdContract.balanceOf(TO_ADDRESS)
    ]);
    
    console.log('');
    console.log('📊 BALANCES AFTER PAYMENT:');
    console.log(`Payment Wallet: ${ethers.formatUnits(newFromBalance, decimals)} ${symbol}`);
    console.log(`Recipient: ${ethers.formatUnits(newToBalance, decimals)} ${symbol}`);
    
    console.log('');
    console.log('🎉 REAL PAYMENT SUCCESSFUL!');
    console.log(`Paid ${AMOUNT} ${symbol} to ${TO_ADDRESS}`);
    
    return {
      success: true,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      fromAddress: paymentWallet,
      toAddress: TO_ADDRESS,
      amount: AMOUNT,
      symbol: symbol
    };
    
  } catch (error) {
    console.error('❌ PAYMENT FAILED:', error);
    
    if (error.message.includes('insufficient funds')) {
      console.log('');
      console.log('💡 POSSIBLE SOLUTIONS:');
      console.log('1. Transfer PYUSD from smart wallet to owner wallet');
      console.log('2. Implement full Account Abstraction infrastructure');
      console.log('3. Use a different wallet that has PYUSD');
    }
    
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  makeRealPayment()
    .then(result => {
      console.log('');
      console.log('🔗 TRANSACTION LINKS:');
      console.log(`Etherscan: https://sepolia.etherscan.io/tx/${result.transactionHash}`);
      console.log(`Blockscout: https://eth-sepolia.blockscout.com/tx/${result.transactionHash}`);
      console.log('');
      console.log('✅ REAL PAYMENT COMPLETED SUCCESSFULLY!');
    })
    .catch(error => {
      console.error('💥 Script failed:', error.message);
      process.exit(1);
    });
}

module.exports = { makeRealPayment };
