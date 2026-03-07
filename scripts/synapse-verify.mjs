/**
 * Verify a Filecoin upload via Synapse SDK.
 *
 * Usage:
 *   node scripts/synapse-verify.mjs <PieceCID>
 *
 * If no CID is given, does a test upload of a small JSON blob and verifies it.
 *
 * Examples:
 *   node scripts/synapse-verify.mjs
 *   node scripts/synapse-verify.mjs bafkzcibxyz...
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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
  console.error('❌ Could not read .env.local');
  process.exit(1);
}

const rawKey = process.env.SYNAPSE_PRIVATE_KEY;
if (!rawKey || rawKey === '0xYourSynapsePrivateKeyHex') {
  console.error('❌ SYNAPSE_PRIVATE_KEY is not set in .env.local');
  process.exit(1);
}
const privateKey = rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`;
const rpcUrl = process.env.SYNAPSE_RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1';

import { Synapse, calibration } from '@filoz/synapse-sdk';
import { http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const targetCid = process.argv[2] ?? null;

async function main() {
  const synapse = Synapse.create({
    account: privateKeyToAccount(privateKey),
    chain: calibration,
    transport: http(rpcUrl),
  });

  if (targetCid) {
    // ── Verify an existing CID ─────────────────────────────────────────────
    console.log(`🔍 Verifying CID: ${targetCid}`);
    try {
      const bytes = await synapse.storage.download({ pieceCid: targetCid });
      const text = new TextDecoder().decode(bytes);
      console.log(`✅ Retrieved ${bytes.length} bytes from Filecoin`);
      try {
        const parsed = JSON.parse(text);
        console.log('📄 Content (JSON):');
        console.log(JSON.stringify(parsed, null, 2));
      } catch {
        console.log('📄 Content (raw):');
        console.log(text.slice(0, 500) + (text.length > 500 ? '...' : ''));
      }
    } catch (err) {
      console.error('❌ Download failed:', err.message);
      process.exit(1);
    }
  } else {
    // ── Test upload + round-trip verify ───────────────────────────────────
    console.log('🧪 No CID provided — running test upload + verify round-trip\n');

    const payload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: 'Attestra Synapse connectivity test — verifying Filecoin storage is live and reachable.',
    };
    const encoded = new TextEncoder().encode(JSON.stringify(payload));
    // Synapse requires a minimum of 127 bytes per upload
    const bytes = encoded.length >= 127 ? encoded : new Uint8Array(127).fill(0x20).map((v, i) => encoded[i] ?? v);

    console.log('⬆️  Uploading test blob...');
    const { pieceCid, size, copies, failures } = await synapse.storage.upload(bytes, {
      pieceMetadata: { filename: 'attestra-test.json', contentType: 'application/json' },
    });
    const cidStr = pieceCid.toString();

    if (copies.length === 0) {
      console.error('❌ Upload failed — no copies stored');
      console.error('   Failures:', JSON.stringify(failures, null, 2));
      process.exit(1);
    }

    console.log(`✅ Upload succeeded!`);
    console.log(`   PieceCID : ${cidStr}`);
    console.log(`   Size     : ${size} bytes`);
    console.log(`   Copies   : ${copies.length}`);
    if (failures.length > 0) {
      console.warn(`   Failures : ${failures.length}`);
    }

    console.log('\n⬇️  Downloading back to verify...');
    const downloaded = await synapse.storage.download({ pieceCid: cidStr });
    const roundTrip = JSON.parse(new TextDecoder().decode(downloaded));

    if (roundTrip.message === payload.message) {
      console.log('✅ Round-trip verified — content matches!');
    } else {
      console.error('❌ Round-trip mismatch — content does not match!');
      process.exit(1);
    }

    console.log(`\n💡 To verify this CID again later:`);
    console.log(`   node scripts/synapse-verify.mjs ${cidStr}`);
  }
}

main().catch((err) => {
  console.error('\n❌ Error:', err.message ?? err);
  process.exit(1);
});
