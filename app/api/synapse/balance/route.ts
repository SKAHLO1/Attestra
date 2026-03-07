import { NextResponse } from 'next/server';
import { Synapse, calibration, TOKENS, formatUnits } from '@filoz/synapse-sdk';
import { http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

export async function GET() {
  try {
    const rawKey = process.env.SYNAPSE_PRIVATE_KEY;
    if (!rawKey) {
      return NextResponse.json({ error: 'SYNAPSE_PRIVATE_KEY not configured' }, { status: 500 });
    }
    const privateKey = (rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`) as `0x${string}`;
    const rpcUrl = process.env.SYNAPSE_RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1';

    const synapse = Synapse.create({
      account: privateKeyToAccount(privateKey),
      chain: calibration,
      transport: http(rpcUrl),
    });

    const [walletBalance, depositedBalance] = await Promise.all([
      synapse.payments.walletBalance({ token: TOKENS.USDFC }),
      synapse.payments.balance({ token: TOKENS.USDFC }),
    ]);

    const serviceApproval = await synapse.payments.serviceApproval({ token: TOKENS.USDFC });

    return NextResponse.json({
      serverWalletAddress: privateKeyToAccount(privateKey).address,
      walletBalance: walletBalance.toString(),
      walletBalanceFormatted: formatUnits(walletBalance),
      depositedBalance: depositedBalance.toString(),
      depositedBalanceFormatted: formatUnits(depositedBalance),
      serviceApproved: !!(serviceApproval && BigInt(serviceApproval.rateAllowance ?? 0) > BigInt(0)),
      lowBalance: depositedBalance < BigInt('500000000000000000'), // < 0.5 USDFC
    });
  } catch (err: any) {
    console.error('[/api/synapse/balance]', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch balance' }, { status: 500 });
  }
}
