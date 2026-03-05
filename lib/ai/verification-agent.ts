/**
 * Attestra AI Verification Agent
 * Off-chain Node.js service that analyzes event photos and verifies attendance
 * Results are hashed and submitted to the Flow smart contract via the oracle pattern
 */

import { createHash } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { pinAIVerificationArtifact } from '@/lib/ipfs/client';
import { getFlowClient } from '@/lib/flow/client';

export interface VerificationInput {
  eventId: string;
  imageUrls: string[];
  attendeeAddress?: string;
}

export interface VerificationOutput {
  eventId: string;
  verified: boolean;
  confidence: number;
  proofHash: string;
  ipfsCid: string;
  flowTxId?: string;
  timestamp: number;
}

export interface FaceDetectionResult {
  detected: boolean;
  confidence: number;
  crowdSize?: number;
}

/**
 * Fetches an image URL and returns it as a base64-encoded string with MIME type.
 * Works with any public image URL (Filecoin gateway, qrserver, etc.).
 */
async function fetchImageAsBase64(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[AIAgent] Failed to fetch image: ${url} — ${response.statusText}`);
  }
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const mimeType = contentType.split(';')[0].trim();
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return { base64, mimeType };
}

/**
 * Analyzes event images for crowd presence and attendance verification using
 * Gemini Flash 2.0 vision model. Falls back to mock if GEMINI_API_KEY is not set.
 */
export async function analyzeEventImages(imageUrls: string[]): Promise<FaceDetectionResult> {
  if (!imageUrls || imageUrls.length === 0) {
    return { detected: false, confidence: 0 };
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.warn('[AIAgent] GEMINI_API_KEY not set — using mock verification. Add it to .env.local to enable real AI.');
    const mockConfidence = 0.75 + Math.random() * 0.2;
    const mockCrowdSize = Math.floor(10 + Math.random() * 90);
    return { detected: true, confidence: mockConfidence, crowdSize: mockCrowdSize };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    // Fetch all images in parallel and convert to inline base64 parts
    const imageParts = await Promise.all(
      imageUrls.map(async (url) => {
        const { base64, mimeType } = await fetchImageAsBase64(url);
        return { inlineData: { data: base64, mimeType } };
      })
    );

    const prompt = `You are an event attendance verification AI agent for the Attestra blockchain platform.

Analyze the provided event photo(s) and determine:
1. Whether people are present at an event (not an empty room or outdoor space)
2. Approximately how many people are visible
3. Your confidence that this is a legitimate attended event (0.0 to 1.0)

Respond ONLY with a JSON object in this exact format, no markdown, no explanation:
{
  "detected": true or false,
  "confidence": 0.0 to 1.0,
  "crowdSize": estimated number of people visible,
  "reasoning": "one sentence explanation"
}

Rules:
- detected = true if at least 1 person is clearly visible
- confidence > 0.8 means strong evidence of event attendance
- confidence 0.5-0.8 means moderate evidence
- confidence < 0.5 means weak or no evidence
- If the image is blurry, empty, or not an event, set detected=false and confidence < 0.3`;

    const result = await model.generateContent([prompt, ...imageParts]);
    const text = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps the JSON
    const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(jsonText);

    console.log(`[AIAgent] Gemini analysis: detected=${parsed.detected}, confidence=${parsed.confidence}, crowd=${parsed.crowdSize}, reason: ${parsed.reasoning}`);

    return {
      detected: Boolean(parsed.detected),
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence))),
      crowdSize: Number(parsed.crowdSize) || 0,
    };
  } catch (error: any) {
    console.error('[AIAgent] Gemini analysis failed:', error.message);
    throw new Error(`AI image analysis failed: ${error.message}`);
  }
}

/**
 * Generates a SHA-256 proof hash from verification result data
 */
export function generateProofHash(data: {
  eventId: string;
  confidence: number;
  imageHashes: string[];
  timestamp: number;
}): string {
  const payload = JSON.stringify(data);
  return createHash('sha256').update(payload).digest('hex');
}

/**
 * Computes SHA-256 hash of an image URL (proxy for actual image content hash)
 */
export function hashImageUrl(url: string): string {
  return createHash('sha256').update(url).digest('hex');
}

/**
 * Main verification pipeline:
 * 1. Analyze images with AI
 * 2. Hash the result
 * 3. Pin artifact to IPFS/Filecoin
 * 4. Submit proof hash to Flow smart contract
 */
export async function runVerificationPipeline(input: VerificationInput): Promise<VerificationOutput> {
  const timestamp = Date.now();
  console.log(`[AIAgent] Starting verification for event: ${input.eventId}`);

  // Step 1: AI image analysis
  const detection = await analyzeEventImages(input.imageUrls);
  console.log(`[AIAgent] Detection result: confidence=${detection.confidence}, detected=${detection.detected}`);

  // Step 2: Generate image hashes
  const imageHashes = input.imageUrls.map(hashImageUrl);

  // Step 3: Generate proof hash
  const proofHash = generateProofHash({
    eventId: input.eventId,
    confidence: detection.confidence,
    imageHashes,
    timestamp,
  });
  console.log(`[AIAgent] Proof hash: ${proofHash}`);

  // Step 4: Pin verification artifact to IPFS/Filecoin
  const artifact = {
    eventId: input.eventId,
    proofHash,
    confidence: detection.confidence,
    verified: detection.detected,
    timestamp: new Date(timestamp).toISOString(),
    modelVersion: '1.0.0',
    imageHashes,
  };

  const ipfsResult = await pinAIVerificationArtifact(artifact);
  console.log(`[AIAgent] Artifact pinned to IPFS, CID: ${ipfsResult.cid}`);

  // Step 5: Submit proof to Flow smart contract
  let flowTxId: string | undefined;
  try {
    const flowClient = getFlowClient();
    const tx = await flowClient.submitAIVerification(input.eventId, proofHash, ipfsResult.cid);
    flowTxId = tx.transactionId;
    console.log(`[AIAgent] Proof submitted to Flow, TX: ${flowTxId}`);
  } catch (error) {
    console.error('[AIAgent] Flow submission failed (non-fatal):', error);
  }

  return {
    eventId: input.eventId,
    verified: detection.detected,
    confidence: detection.confidence,
    proofHash,
    ipfsCid: ipfsResult.cid,
    flowTxId,
    timestamp,
  };
}
