/**
 * One-time Synapse payment setup script.
 *
 * Run once before first upload:
 *   node scripts/synapse-setup.mjs
 *
 * What it does:
 *   1. Checks your USDFC wallet balance
 *   2. Checks whether the storage service is already approved
 *   3. If not approved, deposits 2.5 USDFC and approves the Warm Storage service in one tx
 *      (2.5 USDFC covers ~1 TiB storage for 30 days on Filecoin Calibration)
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ── Load .env.local ────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
try {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch {
  console.error('❌ Could not read .env.local — make sure it exists in the project root.');
  process.exit(1);
}

// ── Validate env ───────────────────────────────────────────────────────────────
const rawKey = process.env.SYNAPSE_PRIVATE_KEY;
if (!rawKey || rawKey === '0xYourSynapsePrivateKeyHex') {
  console.error('❌ SYNAPSE_PRIVATE_KEY is not set in .env.local');
  process.exit(1);
}
const privateKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;
const rpcUrl = process.env.SYNAPSE_RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1';

// ── SDK imports ────────────────────────────────────────────────────────────────
import { Synapse, TOKENS, formatUnits, parseUnits, calibration } from '@filoz/synapse-sdk';
import { http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

async function main() {
  console.log('🔧 Synapse one-time setup');
  console.log(`   RPC: ${rpcUrl}\n`);

  const account = privateKeyToAccount(privateKey);
  console.log(`   Wallet: ${account.address}`);

  const calibrationChain = calibration;
  const synapse = Synapse.create({
    account,
    chain: calibrationChain,
    transport: http(rpcUrl),
  });

  // ── 1. Check balances ──────────────────────────────────────────────────────
  const walletBalance = await synapse.payments.walletBalance({ token: TOKENS.USDFC });
  const depositedBalance = await synapse.payments.balance({ token: TOKENS.USDFC });
  console.log(`\n💰 Wallet USDFC balance:    ${formatUnits(walletBalance)} USDFC`);
  console.log(`💰 Deposited USDFC balance: ${formatUnits(depositedBalance)} USDFC`);

  // ── 2. Check existing service approval ────────────────────────────────────
  const approval = await synapse.payments.serviceApproval({ token: TOKENS.USDFC });
  const alreadyApproved =
    approval &&
    BigInt(approval.rateAllowance ?? 0n) > 0n;

  if (alreadyApproved) {
    console.log('\n✅ Service already approved — no setup needed.');
    console.log(`   Rate allowance:   ${formatUnits(BigInt(approval.rateAllowance))} USDFC/epoch`);
    console.log(`   Lockup allowance: ${formatUnits(BigInt(approval.lockupAllowance))} USDFC`);
    return;
  }

  // ── 3. Check wallet has enough USDFC ──────────────────────────────────────
  const depositAmount = parseUnits('2.5'); // 2.5 USDFC — ~1 TiB for 30 days
  if (walletBalance < depositAmount) {
    console.error(`\n❌ Insufficient USDFC in wallet.`);
    console.error(`   Need:  2.5 USDFC`);
    console.error(`   Have:  ${formatUnits(walletBalance)} USDFC`);
    console.error(`\n   Get testnet USDFC from: https://docs.filecoin.cloud/getting-started/`);
    process.exit(1);
  }

  // ── 4. Deposit + approve in one transaction ────────────────────────────────
  console.log(`\n🚀 Depositing 2.5 USDFC and approving Warm Storage service...`);
  const hash = await synapse.payments.depositWithPermitAndApproveOperator({
    amount: depositAmount,
  });
  console.log(`   Tx submitted: ${hash}`);
  console.log('   Waiting for confirmation...');

  await synapse.client.waitForTransactionReceipt({ hash });
  console.log('\n✅ Setup complete! Your wallet is ready for Synapse uploads.');
}

main().catch((err) => {
  console.error('\n❌ Setup failed:', err.message ?? err);
  process.exit(1);
});
