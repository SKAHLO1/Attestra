import { NextRequest, NextResponse } from 'next/server';
import { Synapse, calibration, TOKENS, parseUnits } from '@filoz/synapse-sdk';
import { http, custom } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

/**
 * POST /api/synapse/deposit
 *
 * Executes a USDFC deposit + service approval on behalf of the organizer's
 * connected EVM wallet. The browser sends the amount; the actual transaction
 * is signed by the browser wallet via MetaMask (EIP-712 permit) — the server
 * key is NOT used for this operation.
 *
 * Body: { amount: string, fromAddress: string }
 *   amount      — USDFC amount as a decimal string e.g. "2.5"
 *   fromAddress — organizer's connected EVM wallet address
 *
 * The client must have already approved/signed via MetaMask before calling this.
 * This route builds the Synapse client using a custom transport that routes
 * signing back to the browser via a relay pattern.
 *
 * NOTE: Because Next.js API routes are server-side and cannot directly invoke
 * window.ethereum, the actual transaction signing happens client-side in the
 * FilecoinBilling component using the viem walletClient. This route is used
 * only for balance reads and validation. The deposit tx is submitted
 * directly from the browser via the EVM wallet context.
 */
export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json();

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const parsedAmount = parseUnits(amount);

    // Validate the server wallet is configured
    const rawKey = process.env.SYNAPSE_PRIVATE_KEY;
    if (!rawKey) {
      return NextResponse.json({ error: 'SYNAPSE_PRIVATE_KEY not configured' }, { status: 500 });
    }
    const privateKey = (rawKey.startsWith('0x') ? rawKey : `0x${rawKey}`) as `0x${string}`;
    const rpcUrl = process.env.SYNAPSE_RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1';

    // Return the parsed amount and server wallet address so the client
    // can execute the deposit from the browser wallet
    const serverAddress = privateKeyToAccount(privateKey).address;

    return NextResponse.json({
      ok: true,
      parsedAmount: parsedAmount.toString(),
      serverWalletAddress: serverAddress,
      rpcUrl,
      chainId: calibration.id,
      message: `Ready to deposit ${amount} USDFC. Sign the transaction in MetaMask.`,
    });
  } catch (err: any) {
    console.error('[/api/synapse/deposit]', err);
    return NextResponse.json({ error: err.message || 'Deposit preparation failed' }, { status: 500 });
  }
}
