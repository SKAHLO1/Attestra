import { NextRequest, NextResponse } from 'next/server';
import { runVerificationPipeline } from '@/lib/ai/verification-agent';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventId, imageUrls, attendeeAddress } = body;

    if (!eventId || !imageUrls || !Array.isArray(imageUrls)) {
      return NextResponse.json(
        { error: 'eventId and imageUrls (array) are required' },
        { status: 400 }
      );
    }

    const result = await runVerificationPipeline({ eventId, imageUrls, attendeeAddress });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API /verify] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Verification failed' },
      { status: 500 }
    );
  }
}
