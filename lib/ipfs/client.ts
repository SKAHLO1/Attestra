/**
 * Filecoin Storage Client for Attestra
 *
 * Uses Filecoin Synapse SDK (@filoz/synapse-sdk) — the official Filecoin Onchain Cloud SDK.
 *
 * Synapse stores data with multi-copy durability across independent service providers.
 * Each upload returns a PieceCID (content-addressed identifier) used for retrieval.
 * Data is verified on-chain via PDP (Proof of Data Possession) proofs.
 *
 * Docs:    https://docs.filecoin.cloud
 * SDK:     https://github.com/FilOzone/synapse-sdk
 */

import { Synapse, calibration } from '@filoz/synapse-sdk';
import { http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const SYNAPSE_PRIVATE_KEY = process.env.SYNAPSE_PRIVATE_KEY as string;
const SYNAPSE_RPC_URL = process.env.SYNAPSE_RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1';

function requirePrivateKey(): void {
  if (!SYNAPSE_PRIVATE_KEY) {
    throw new Error(
      '[Filecoin] SYNAPSE_PRIVATE_KEY is not set. ' +
      'Add SYNAPSE_PRIVATE_KEY (hex, with 0x prefix) to .env.local. ' +
      'See https://docs.filecoin.cloud/getting-started/'
    );
  }
}

async function getSynapse(): Promise<Synapse> {
  requirePrivateKey();
  const privateKey = SYNAPSE_PRIVATE_KEY.startsWith('0x')
    ? SYNAPSE_PRIVATE_KEY as `0x${string}`
    : `0x${SYNAPSE_PRIVATE_KEY}` as `0x${string}`;
  return Synapse.create({
    account: privateKeyToAccount(privateKey),
    chain: calibration,
    transport: http(SYNAPSE_RPC_URL),
  });
}

// ─── Return types ─────────────────────────────────────────────────────────────

export interface FilecoinUploadResult {
  cid: string;
  url: string;
  size: number;
  name: string;
}

export interface FilecoinDealInfo {
  chainDealID: number;
  storageProvider: string;
  dealStatus: string;
  miner: string;
  startEpoch: number;
  endEpoch: number;
  pieceCID: string;
  pieceSize: number;
}

export interface FilecoinDealStatus {
  cid: string;
  deals: FilecoinDealInfo[];
}

// ─── Metadata types ───────────────────────────────────────────────────────────

export interface EventMetadata {
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  category: string;
  organizerId: string;
  maxAttendees: number;
  imageUrl?: string;
  createdAt: string;
}

export interface BadgeMetadata {
  eventId: string;
  eventName: string;
  attendeeId: string;
  claimCode: string;
  claimedAt: string;
  category: string;
  flowTxId?: string;
  aiVerified?: boolean;
  aiVerificationCid?: string;
}

export interface AIVerificationArtifact {
  eventId: string;
  proofHash: string;
  confidence: number;
  verified: boolean;
  timestamp: string;
  modelVersion: string;
  imageHashes: string[];
}

// ─── Core upload functions ─────────────────────────────────────────────────────

/**
 * Upload a JSON object to Filecoin via Synapse SDK.
 * Returns a FilecoinUploadResult with the PieceCID as the content identifier.
 */
export async function uploadJSONToFilecoin(
  data: object,
  name: string
): Promise<FilecoinUploadResult> {
  return uploadBytesToSynapse(
    new TextEncoder().encode(JSON.stringify(data)),
    name,
    'application/json'
  );
}

/**
 * Upload a browser File/Blob to Filecoin via Synapse SDK.
 */
export async function uploadFileToFilecoin(
  file: File
): Promise<FilecoinUploadResult> {
  const buffer = await file.arrayBuffer();
  return uploadBytesToSynapse(new Uint8Array(buffer), file.name, file.type);
}

// ─── Deal verification ─────────────────────────────────────────────────────────

/**
 * Returns on-chain storage info for a PieceCID via Synapse.
 * The Synapse SDK verifies storage via PDP proofs rather than deal status queries.
 * This function returns a stub compatible with the existing interface.
 */
export async function getFilecoinDealStatus(cid: string): Promise<FilecoinDealStatus> {
  return { cid, deals: [] };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Returns a reference URL for a Synapse PieceCID.
 * Synapse data is retrieved via the SDK (synapse.storage.download); this URL
 * serves as a canonical reference identifier for the stored piece.
 */
export function getFilecoinUrl(cid: string): string {
  return `filecoin://synapse/${cid}`;
}

/**
 * Fetch and deserialise JSON stored on Filecoin via Synapse SDK download.
 */
export async function fetchFromFilecoin<T = unknown>(cid: string): Promise<T> {
  const synapse = await getSynapse();
  const bytes = await synapse.storage.download({ pieceCid: cid });
  const text = new TextDecoder().decode(bytes);
  return JSON.parse(text) as T;
}

// ─── Internal: Synapse upload ─────────────────────────────────────────────────

/**
 * Uploads raw bytes to Filecoin via the Synapse SDK.
 * The SDK handles provider selection, multi-copy replication, and on-chain commit.
 * Piece metadata (filename, contentType) is attached for organisation.
 */
async function uploadBytesToSynapse(
  bytes: Uint8Array,
  name: string,
  contentType: string
): Promise<FilecoinUploadResult> {
  requirePrivateKey();

  const synapse = await getSynapse();

  const { pieceCid, size, copies, failures } = await synapse.storage.upload(bytes, {
    pieceMetadata: {
      filename: name,
      contentType,
    },
  });

  if (copies.length === 0) {
    throw new Error(`[Synapse] Upload failed — no copies stored. Failures: ${JSON.stringify(failures)}`);
  }

  if (failures.length > 0) {
    console.warn(`[Synapse] Upload partially succeeded: ${copies.length} copies stored, ${failures.length} failed`);
  }

  const cidStr = pieceCid.toString();
  console.log(`[Synapse] ✅ Stored on Filecoin — PieceCID: ${cidStr} | copies: ${copies.length} | size: ${size} bytes | name: ${name}`);
  return {
    cid: cidStr,
    url: getFilecoinUrl(cidStr),
    size,
    name,
  };
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

/**
 * Upload a CSV string to Filecoin via Synapse SDK.
 */
export async function uploadCSVToFilecoin(
  csvContent: string,
  name: string
): Promise<FilecoinUploadResult> {
  return uploadBytesToSynapse(
    new TextEncoder().encode(csvContent),
    name,
    'text/csv'
  );
}

// ─── Domain helpers ───────────────────────────────────────────────────────────

export async function pinEventMetadata(
  metadata: EventMetadata,
  eventId: string
): Promise<FilecoinUploadResult> {
  const slug = metadata.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return uploadJSONToFilecoin(metadata, `attestra/${eventId}/event-metadata--${slug}.json`);
}

export async function pinBadgeMetadata(metadata: BadgeMetadata): Promise<FilecoinUploadResult> {
  const headers = 'event_id,event_name,attendee_id,claim_code,claimed_at,category,flow_tx_id,ai_verified';
  const escape = (v: string | boolean | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const row = [
    escape(metadata.eventId),
    escape(metadata.eventName),
    escape(metadata.attendeeId),
    escape(metadata.claimCode),
    escape(metadata.claimedAt),
    escape(metadata.category),
    escape(metadata.flowTxId),
    escape(metadata.aiVerified),
  ].join(',');
  const csv = `${headers}\n${row}`;
  return uploadCSVToFilecoin(
    csv,
    `attestra/${metadata.eventId}/badges/${metadata.claimCode}.csv`
  );
}

export interface QRCodeManifestRow {
  claimCode: string;
  qrUrl: string;
  eventId: string;
  eventName: string;
  expiresAt: string;
  issuer: string;
}

export async function pinQRCodeManifest(
  rows: QRCodeManifestRow[],
  eventId: string,
  eventName: string
): Promise<FilecoinUploadResult> {
  const headers = 'claim_code,qr_url,event_id,event_name,expires_at,issuer';
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csvRows = rows.map(r =>
    [
      escape(r.claimCode),
      escape(r.qrUrl),
      escape(r.eventId),
      escape(r.eventName),
      escape(r.expiresAt),
      escape(r.issuer),
    ].join(',')
  );
  const csv = [headers, ...csvRows].join('\n');
  const slug = eventName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return uploadCSVToFilecoin(
    csv,
    `attestra/${eventId}/qr-codes/batch-${timestamp}--${slug}.csv`
  );
}

export async function pinAIVerificationArtifact(
  artifact: AIVerificationArtifact
): Promise<FilecoinUploadResult> {
  return uploadJSONToFilecoin(
    artifact,
    `attestra/${artifact.eventId}/ai-verification.json`
  );
}

export async function pinQRCode(
  qrImageUrl: string,
  claimCode: string,
  eventId: string
): Promise<FilecoinUploadResult> {
  requirePrivateKey();

  const response = await fetch(qrImageUrl);
  if (!response.ok) {
    throw new Error(`[Filecoin] Failed to fetch QR image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const filename = `attestra/${eventId}/qr-codes/${claimCode}.png`;
  return uploadBytesToSynapse(new Uint8Array(arrayBuffer), filename, 'image/png');
}
