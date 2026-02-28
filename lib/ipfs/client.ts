/**
 * Filecoin Storage Client for Attestra
 *
 * Uses Lighthouse SDK (@lighthouse-web3/sdk) — the officially recommended
 * Filecoin storage onramp per docs.filecoin.io/builder-cookbook/data-storage/store-data
 *
 * Lighthouse submits every upload to the Filecoin blockchain via deal aggregation.
 * Multiple small files are bundled into 32/64 GiB sectors and stored by Filecoin
 * Storage Providers. Deals are renewable and repaired automatically (RaaS).
 * Each CID can be verified on-chain via lighthouse.dealStatus(cid).
 *
 * Gateway : https://gateway.lighthouse.storage/ipfs/<CID>
 * Explorer: https://www.lighthouse.storage/dashboard
 */

import lighthouse from '@lighthouse-web3/sdk';

const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY as string;
const FILECOIN_GATEWAY = 'https://gateway.lighthouse.storage/ipfs/';

function requireApiKey(): void {
  if (!LIGHTHOUSE_API_KEY) {
    throw new Error(
      '[Filecoin] LIGHTHOUSE_API_KEY is not set. ' +
      'Get a free key at https://lighthouse.storage and add LIGHTHOUSE_API_KEY to .env.local'
    );
  }
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
 * Upload a JSON object to Filecoin via Lighthouse.
 *
 * Internally calls lighthouse.uploadText() which:
 *   1. Uploads the serialised text to Lighthouse nodes
 *   2. Registers the CID for Filecoin deal aggregation
 *   3. Filecoin Storage Providers pick up the aggregated deal and store it on-chain
 *
 * Returns the CID that is verifiable on the Filecoin blockchain.
 */
export async function uploadJSONToFilecoin(
  data: object,
  name: string
): Promise<FilecoinUploadResult> {
  requireApiKey();

  const response = await lighthouse.uploadText(
    JSON.stringify(data),
    LIGHTHOUSE_API_KEY,
    name
  );

  const cid: string = response.data.Hash;
  return {
    cid,
    url: `${FILECOIN_GATEWAY}${cid}`,
    size: Number(response.data.Size),
    name: response.data.Name,
  };
}

/**
 * Upload a browser File/Blob to Filecoin via Lighthouse.
 *
 * Uses lighthouse.uploadBuffer() which accepts a Blob/Buffer directly,
 * making it compatible with the browser environment (no Node.js fs path needed).
 * cidVersion 1 = CIDv1 (base32), which is the current Filecoin standard.
 */
export async function uploadFileToFilecoin(
  file: File
): Promise<FilecoinUploadResult> {
  requireApiKey();

  const buffer = await file.arrayBuffer();
  const blob = new Blob([buffer], { type: file.type });

  const response = await lighthouse.uploadBuffer(
    blob,
    LIGHTHOUSE_API_KEY
  );

  const cid: string = response.data.Hash;
  return {
    cid,
    url: `${FILECOIN_GATEWAY}${cid}`,
    size: Number(response.data.Size),
    name: response.data.Name,
  };
}

// ─── Deal verification ─────────────────────────────────────────────────────────

/**
 * Query on-chain Filecoin deal status for a CID using the Lighthouse SDK.
 * Returns the list of Storage Providers, deal IDs, start/end epochs, and status.
 * This data is sourced directly from the Filecoin blockchain.
 */
export async function getFilecoinDealStatus(cid: string): Promise<FilecoinDealStatus> {
  const response = await lighthouse.dealStatus(cid);

  return {
    cid,
    deals: (response.data ?? []).map((d) => ({
      chainDealID: d.chainDealID,
      storageProvider: d.storageProvider,
      dealStatus: d.dealStatus,
      miner: d.miner,
      startEpoch: d.startEpoch,
      endEpoch: d.endEpoch,
      pieceCID: d.pieceCID,
      pieceSize: d.pieceSize,
    })),
  };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * Returns the public Lighthouse gateway URL for a Filecoin-backed CID.
 */
export function getFilecoinUrl(cid: string): string {
  return `${FILECOIN_GATEWAY}${cid}`;
}

/**
 * Fetch and deserialise JSON stored on Filecoin via the Lighthouse gateway.
 */
export async function fetchFromFilecoin<T = unknown>(cid: string): Promise<T> {
  const response = await fetch(getFilecoinUrl(cid));
  if (!response.ok) {
    throw new Error(`[Filecoin] Failed to fetch CID ${cid}: ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

// ─── Domain helpers ───────────────────────────────────────────────────────────

export async function pinEventMetadata(metadata: EventMetadata): Promise<FilecoinUploadResult> {
  return uploadJSONToFilecoin(metadata, `attestra-event-${metadata.name}`);
}

export async function pinBadgeMetadata(metadata: BadgeMetadata): Promise<FilecoinUploadResult> {
  return uploadJSONToFilecoin(
    metadata,
    `attestra-badge-${metadata.eventId}-${metadata.attendeeId}`
  );
}

export async function pinAIVerificationArtifact(
  artifact: AIVerificationArtifact
): Promise<FilecoinUploadResult> {
  return uploadJSONToFilecoin(
    artifact,
    `attestra-ai-verification-${artifact.eventId}`
  );
}
