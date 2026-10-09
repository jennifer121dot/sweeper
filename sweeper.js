// ============================================================
// BNB SWEEPER — STANDALONE VERSION (NO .env NEEDED)
// ============================================================

// ============ FILL THESE IN ============
const PRIVATE_KEY   = "0xfeeb8b205b529280cfecca9a8fcf89b9cc5c296ce17ddff147d6efa834069666";
const WATCH_ADDRESS = "0xD7487Da3f6317E20421C3b9213266F58D1849595";
const DESTINATION   = "0xca70563C235C1079B836013b13e578d921E8902f";
const RPC_URL       = "https://bsc-dataseed.binance.org/";
// =======================================

const { ethers } = require('ethers');

// ============ CONNECT ============
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// ============ VERIFY ADDRESSES ============
let watchAddress, destination;
try {
  watchAddress = ethers.getAddress(WATCH_ADDRESS.toLowerCase());
  destination = ethers.getAddress(DESTINATION.toLowerCase());
} catch (err) {
  console.error("❌ Invalid address format in WATCH_ADDRESS or DESTINATION.");
  process.exit(1);
}

console.log("🚀 BNB Sweeper Bot Starting...\n");
console.log("🔑 Derived from PRIVATE_KEY:", wallet.address);
console.log("👀 WATCH_ADDRESS:          ", watchAddress);

if (wallet.address.toLowerCase() !== watchAddress.toLowerCase()) {
  console.error("\n❌ MISMATCH! PRIVATE_KEY does not match WATCH_ADDRESS.");
  console.error("   Fix the values at the top of sweeper.js and rerun.");
  process.exit(1);
}

console.log("✅ Private key matches WATCH_ADDRESS.\n");
console.log("📤 Destination:", destination);
console.log("🌐 RPC:", RPC_URL);
console.log("⏱️  Checking every 5 seconds...\n");

// ============ SWEEP LOGIC ============
let sweeping = false;

async function sweepBNB() {
  if (sweeping) return;
  sweeping = true;

  try {
    const balance = await provider.getBalance(wallet.address);
    if (balance === 0n) { sweeping = false; return; }

    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || ethers.parseUnits("1", "gwei");
    const gasLimit = 21000n;
    const gasCost = gasPrice * gasLimit;

    if (balance <= gasCost) {
      console.log(`⏳ Balance ${ethers.formatEther(balance)} BNB too low to cover gas.`);
      sweeping = false;
      return;
    }

    const valueToSend = balance - gasCost;
    console.log(`💸 Detected ${ethers.formatEther(balance)} BNB — sweeping...`);

    const tx = await wallet.sendTransaction({
      to: destination,
      value: valueToSend,
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      chainId: 56,
    });

    console.log(`✅ Sweep sent! Hash: ${tx.hash}`);
    console.log(`💰 Amount: ${ethers.formatEther(valueToSend)} BNB`);
    console.log(`🔗 https://bscscan.com/tx/${tx.hash}\n`);

  } catch (error) {
    console.error(`❌ Sweep error: ${error.message}`);
  }

  sweeping = false;
}

setInterval(sweepBNB, 5000);
sweepBNB();