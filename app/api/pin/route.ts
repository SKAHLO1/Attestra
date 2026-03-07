import { NextRequest, NextResponse } from 'next/server';
import { pinEventMetadata, pinBadgeMetadata, pinQRCodeManifest, type QRCodeManifestRow } from '@/lib/ipfs/client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json({ error: 'Missing type or data' }, { status: 400 });
    }

    let result;
    if (type === 'event') {
      const { eventId: evId, ...eventMeta } = data;
      if (!evId) {
        return NextResponse.json({ error: 'event type requires eventId in data' }, { status: 400 });
      }
      result = await pinEventMetadata(eventMeta, evId);
    } else if (type === 'badge') {
      result = await pinBadgeMetadata(data);
    } else if (type === 'qr-manifest') {
      const { rows, eventId, eventName } = data as { rows: QRCodeManifestRow[]; eventId: string; eventName: string };
      if (!rows?.length || !eventId || !eventName) {
        return NextResponse.json({ error: 'qr-manifest type requires rows[], eventId, and eventName' }, { status: 400 });
      }
      result = await pinQRCodeManifest(rows, eventId, eventName);
    } else {
      return NextResponse.json({ error: 'Invalid type. Use "event", "badge", or "qr-manifest"' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    const causeCode = error?.cause?.code ?? '';
    const msg = error?.message ?? '';
    const isNetworkError =
      causeCode === 'UND_ERR_CONNECT_TIMEOUT' ||
      causeCode === 'ECONNREFUSED' ||
      causeCode === 'ENOTFOUND' ||
      msg.includes('fetch failed') ||
      msg.includes('Connect Timeout') ||
      msg.includes('network');

    if (isNetworkError) {
      console.warn('[/api/pin] Filecoin/Synapse unreachable — returning pending stub:', msg);
      return NextResponse.json({ cid: null, url: null, size: 0, name: '', pending: true });
    }

    console.error('[/api/pin] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to pin to Filecoin' }, { status: 500 });
  }
}
