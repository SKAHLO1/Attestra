# Attestra 🔐

![Attestra Banner](https://img.shields.io/badge/Attestra-Proof%20of%20Attendance-blueviolet?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss)
![Flow](https://img.shields.io/badge/Flow-Testnet-00EF8B?style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-10.7-orange?style=for-the-badge&logo=firebase)
![Filecoin](https://img.shields.io/badge/Filecoin-Synapse_SDK-0090FF?style=for-the-badge)
![Gemini](https://img.shields.io/badge/Gemini-Flash%202.0-4285F4?style=for-the-badge&logo=google)

**Attestra** is a decentralized proof-of-attendance protocol built on the [Flow](https://flow.com) blockchain with AI-powered attendance verification. Event organizers create on-chain events, generate QR code claim codes, and run Gemini AI verification on event photos. Attendees claim verifiable badges secured by Flow Cadence smart contracts, with metadata pinned to Filecoin via the Synapse SDK for permanent decentralized storage. Gated events enforce ZK-style eligibility rules — requiring attendees to hold a badge from a prerequisite event or meet a minimum reputation level before claiming.

---

## ✨ Features

### For Event Organizers
- **Create Events On-Chain** — Deploy events to Flow testnet via the `AttendanceBadge` Cadence contract (100 FLOW fee)
- **ZK-Gated Events** — Require attendees to hold a prerequisite badge or reach a minimum reputation level (1/3/5 badges)
- **QR Code Generation** — Bulk-generate unique claim codes and download QR code batches; a CSV manifest is pinned to Filecoin per batch
- **AI Verification** — Run Gemini Flash 2.0 vision analysis on event photos; the proof hash is signed by an oracle account and committed on-chain
- **Organizer Dashboard** — View all events, live badge counts, active/inactive status toggle, and attendee list per event; tabbed Events / Filecoin Billing view
- **Filecoin Metadata** — Event metadata pinned to Filecoin via Synapse SDK using path-style naming: `attestra/{eventId}/event-metadata--{slug}.json`
- **Filecoin Billing** — Built-in USDFC balance monitor with MetaMask (EVM wallet) connect; organizers deposit USDFC directly from the browser via `depositWithPermitAndApproveOperator` — no CLI needed post-deploy
- **CSV Export with CIDs** — Downloading claim codes produces a CSV with `Claim Code, QR Code URL, Event Name, Status, Filecoin CID, Filecoin URL` columns

### For Attendees
- **Manual Badge Claiming** — Enter a claim code to mint a badge on Flow testnet (3 FLOW fee)
- **QR Code Scanning** — Scan QR codes at events to auto-fill the claim code
- **Eligibility Enforcement** — Clear error messages when prerequisite badge or reputation level requirements are not met
- **Badge Portfolio** — View all claimed badges with Flow TX IDs, Filecoin CIDs, and claim timestamps
- **On-Chain Reputation** — Reputation level (Beginner → Initiate → Voyager → Visionary) based on total badges held

### Platform Features
- **Firebase Authentication** — Email/password sign-in with role separation (organizer vs. attendee)
- **Hybrid Storage** — Firebase Firestore for mutable metadata, Flow blockchain for ownership, Filecoin for permanent artifact storage
- **Responsive Design** — Fully optimized for desktop and mobile
- **Graceful Degradation** — Filecoin pinning failures return a pending stub so Flow transactions always proceed

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js 15 App                           │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Organizer   │  │  Attendee    │  │  Landing / Pricing / │  │
│  │  Dashboard   │  │   Portal     │  │  Onboarding          │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘  │
│         │                 │                                      │
│  ┌──────▼─────────────────▼─────────────────────────────────┐   │
│  │           lib/services  (React hooks)                    │   │
│  │  useEventOperations · useEventInfo · useUserBadges       │   │
│  └──────┬──────────────────────┬───────────────────────────-┘   │
│         │                      │                                 │
│  ┌──────▼──────┐    ┌──────────▼────────────────────────────┐   │
│  │  Firebase   │    │           API Routes                  │   │
│  │  Firestore  │    │  POST /api/pin   POST /api/verify     │   │
│  │  Auth       │    └──────────┬──────────────┬────────────-┘   │
│  └─────────────┘               │              │                  │
│                     ┌──────────▼──┐  ┌────────▼─────────────┐   │
│                     │  Synapse SDK │  │  Gemini Flash 2.0    │   │
│                     │  (Filecoin)  │  │  AI Verification     │   │
│                     └─────────────┘  └──────────┬───────────┘   │
│                                                 │                │
│                     ┌───────────────────────────▼─────────────┐ │
│                     │    Flow Blockchain (Testnet)             │ │
│                     │    AttendanceBadge.cdc contract          │ │
│                     │    FCL wallet · Oracle signer            │ │
│                     └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow — Event Creation
1. Organizer fills the event form (name, dates, ZK-eligibility rules)
2. Firebase doc created first → its ID becomes the canonical `eventId`
3. Event metadata pinned to Filecoin → CID returned
4. FCL wallet popup → organizer pays 100 FLOW → `createEvent` transaction sealed on Flow
5. Firebase doc updated with `flowTxId`; Firebase doc rolled back if Flow tx fails

### Data Flow — Badge Claiming
1. Attendee enters claim code → Firestore validates code is unused
2. ZK eligibility checks: prerequisite badge ownership + reputation level
3. FCL wallet popup → attendee pays 3 FLOW → `claimBadge` transaction sealed on Flow *(Filecoin pin is intentionally deferred so the wallet popup is instant)*
4. Firebase badge record written (with `category` field) immediately after on-chain tx
5. Badge metadata pinned to Filecoin as CSV via Synapse SDK **in the background** (non-blocking, non-fatal); CID written back to Firebase badge doc via `updateDoc`

### Data Flow — AI Verification
1. Organizer triggers "AI Verify" from the event dashboard, provides photo URLs
2. `/api/verify` fetches each image, encodes to base64, sends to Gemini Flash 2.0
3. AI returns attendance confidence score
4. Result hashed with SHA-256 → `proofHash`
5. Verification artifact pinned to Filecoin: `attestra/{eventId}/ai-verification.json`
6. Oracle account (server-side P-256 key) signs and submits `submitAIVerification` tx on Flow

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15.5](https://nextjs.org/) — App Router |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Styling | [TailwindCSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Blockchain | [Flow Testnet](https://flow.com) — Cadence 1.0 |
| Wallet (Flow) | [Flow Client Library (FCL)](https://developers.flow.com/tools/clients/fcl-js) + WalletConnect |
| Wallet (EVM) | [viem](https://viem.sh/) `createWalletClient` + MetaMask (`window.ethereum`) |
| Smart Contract | `AttendanceBadge.cdc` — Cadence 1.0 |
| Database | [Firebase Firestore](https://firebase.google.com/docs/firestore) |
| Auth | [Firebase Authentication](https://firebase.google.com/docs/auth) |
| Decentralized Storage | [Filecoin Synapse SDK](https://docs.filecoin.cloud) (`@filoz/synapse-sdk`) |
| AI Verification | [Gemini Flash 2.0](https://ai.google.dev/) (`gemini-2.0-flash`) |
| Icons | [Lucide React](https://lucide.dev/) |
| Deployment | [Vercel](https://vercel.com) |

---

## 📁 Project Structure

```
attestra/
├── app/
│   ├── api/
│   │   ├── pin/route.ts          # POST — pin event/badge/QR metadata to Filecoin
│   │   ├── verify/route.ts       # POST — run Gemini AI verification pipeline
│   │   └── synapse/
│   │       ├── balance/route.ts  # GET  — USDFC deposited + wallet balance for server key
│   │       └── deposit/route.ts  # POST — validate deposit amount, return chain info
│   ├── layout.tsx                # Root layout with FCL, Firebase, and EVM wallet providers
│   └── page.tsx                  # Single-page app with role-based view routing
│
├── cadence/
│   ├── contracts/
│   │   └── AttendanceBadge.cdc   # Main Cadence smart contract
│   ├── scripts/
│   │   ├── GetEvent.cdc          # Query event record by ID
│   │   ├── GetBadgeIDs.cdc       # Query badge IDs for an address
│   │   └── GetAIVerification.cdc # Query AI verification record for an event
│   └── transactions/
│       ├── CreateEvent.cdc       # Organizer pays 100 FLOW, registers event on-chain
│       ├── ClaimBadge.cdc        # Attendee pays 3 FLOW, mints badge on-chain
│       └── SubmitAIVerification.cdc # Oracle submits AI proof hash on-chain
│
├── components/
│   ├── attendee-portal.tsx       # Attendee badge claiming and reputation dashboard
│   ├── badge-portfolio.tsx       # Badge gallery with Filecoin/Flow details
│   ├── event-form.tsx            # Create event form with ZK-eligibility settings
│   ├── event-list.tsx            # Organizer event list with AI Verify dialog
│   ├── filecoin-billing.tsx      # EVM wallet connect + USDFC balance + deposit UI
│   ├── organizer-dashboard.tsx   # Top-level organizer view (Events + Filecoin tabs)
│   ├── qr-code-generator.tsx     # Bulk QR code generation + Filecoin CSV manifest
│   ├── pricing.tsx               # Pricing tiers
│   └── onboarding/               # Landing page sections (how it works, use cases)
│
├── lib/
│   ├── ai/
│   │   └── verification-agent.ts # Gemini Flash integration + oracle pipeline
│   ├── evm-wallet-context.tsx    # EVM wallet context (MetaMask / window.ethereum + viem)
│   ├── firebase/
│   │   ├── config.ts             # Firebase app initialization
│   │   └── auth-context.tsx      # Auth provider and useAuth hook
│   ├── flow/
│   │   ├── client.ts             # FlowClient class + FCL config + oracle signer
│   │   ├── hooks.ts              # useFlowWallet hook
│   │   └── types.ts              # Flow type definitions
│   ├── ipfs/
│   │   └── client.ts             # Synapse SDK upload helpers (JSON, CSV, buffer)
│   ├── services/
│   │   ├── event-hooks.ts        # useEventOperations, useEventInfo hooks
│   │   ├── badge-hooks.ts        # useUserBadges hook
│   │   ├── types.ts              # Shared TypeScript interfaces
│   │   └── index.ts              # Re-exports
│   └── config.ts                 # App-level config helpers
│
└── scripts/
    ├── generate-claim-codes.js   # CLI script to bulk-generate claim codes
    ├── synapse-setup.mjs         # One-time Synapse payment approval (USDFC deposit + approveService)
    └── synapse-verify.mjs        # Verify a Filecoin upload by CID, or run a test round-trip
```

---

## 📋 Prerequisites

- **Node.js** 18+
- **Flow Wallet** — [Flow Wallet](https://wallet.flow.com/), [Blocto](https://blocto.io/), or any FCL-compatible wallet
- **Flow Testnet FLOW tokens** — Get from the [Flow Testnet Faucet](https://testnet-faucet.onflow.org)
  - Organizers need **100 FLOW** to create an event
  - Attendees need **3 FLOW** to claim a badge
- **Firebase Project** — Free Spark plan is sufficient
- **Filecoin Synapse wallet** — EVM-compatible private key (`SYNAPSE_PRIVATE_KEY`) with USDFC tokens for server-side upload fees; see [docs.filecoin.cloud](https://docs.filecoin.cloud/getting-started/)
- **MetaMask** (optional, for organizers) — EVM wallet for topping up USDFC balance directly from the Filecoin Billing tab in the organizer dashboard
- **Gemini API key** — Free at [Google AI Studio](https://aistudio.google.com) (no credit card required)
- **Flow CLI** — Required for contract deployment: see [docs](https://developers.flow.com/tools/flow-cli)

---

## 🏁 Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/attestra.git
cd attestra
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values — see [Environment Variables](#-environment-variables) below.

### 3. Deploy the Cadence Contract

```bash
# Create a testnet account (skip if you already have one)
flow accounts create --network testnet

# Deploy AttendanceBadge.cdc to testnet
flow project deploy --network testnet
```

Copy the deployed contract address into `NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS` in `.env.local`.

### 4. Run the Synapse One-Time Setup

Deposit USDFC into the Synapse payment contract and approve the warm storage operator. Only needs to be done once per wallet:

```bash
node scripts/synapse-setup.mjs
```

Alternatively, organizers can top up USDFC at any time from the **Filecoin Billing** tab in the organizer dashboard by connecting MetaMask.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🔑 Environment Variables

Copy `.env.example` to `.env.local` and fill in all values.

### Firebase

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com), enable **Authentication** (Email/Password) and **Firestore Database**.

### Flow Blockchain

```env
NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS=0xYourDeployedContractAddress
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
NEXT_PUBLIC_FLOW_WALLET_DISCOVERY=https://fcl-discovery.onflow.org/testnet/authn
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=        # https://cloud.walletconnect.com

FLOW_TESTNET_ADDRESS=0xYourTestnetAccountAddress
FLOW_TESTNET_PRIVATE_KEY=your_testnet_private_key_hex

# Oracle account — used by /api/verify to sign AI verification transactions server-side
FLOW_ORACLE_ADDRESS=0xYourOracleAccountAddress
FLOW_ORACLE_PRIVATE_KEY=your_oracle_private_key_hex
```

Generate a key pair with `flow keys generate` and fund both accounts from the [testnet faucet](https://testnet-faucet.onflow.org).

### Filecoin — Synapse SDK

```env
SYNAPSE_PRIVATE_KEY=0x...  # EVM wallet private key (hex) with USDFC tokens
# SYNAPSE_RPC_URL=          # Optional: override default Filecoin RPC endpoint
```

> **Note:** Do NOT prefix with `NEXT_PUBLIC_`. This key is server-side only. See [docs.filecoin.cloud/getting-started](https://docs.filecoin.cloud/getting-started/) to fund your wallet with USDFC.

### AI Verification — Gemini

```env
GEMINI_API_KEY=           # https://aistudio.google.com — free, no credit card
NEXT_PUBLIC_AI_VERIFICATION_ENDPOINT=/api/verify
```

Free quota: **15 requests/min, 1M tokens/day** on `gemini-2.0-flash`.

---

## ⛓️ Smart Contract

### `AttendanceBadge.cdc`

Located at `cadence/contracts/AttendanceBadge.cdc`. Deployed on Flow Testnet.

#### On-Chain State

| Storage | Type | Description |
|---|---|---|
| `events` | `{String: EventRecord}` | Registry of all events keyed by `eventId` |
| `verifications` | `{String: VerificationRecord}` | AI verification proofs keyed by `eventId` |
| `totalBadges` | `UInt64` | Global badge counter |
| `totalEvents` | `UInt64` | Global event counter |

#### Transactions

| Transaction | Fee | Description |
|---|---|---|
| `CreateEvent.cdc` | 100 FLOW | Registers an event on-chain; transfers fee to contract owner |
| `ClaimBadge.cdc` | 3 FLOW | Mints a badge for the claimer; transfers fee to contract owner |
| `SubmitAIVerification.cdc` | gas only | Records AI proof hash and Filecoin CID on-chain (oracle-signed) |

#### Scripts (read-only)

| Script | Description |
|---|---|
| `GetEvent.cdc` | Returns `EventRecord` for a given `eventId` |
| `GetBadgeIDs.cdc` | Returns badge IDs owned by a given `Address` |
| `GetAIVerification.cdc` | Returns `VerificationRecord` for a given `eventId` |

#### Events Emitted

```cadence
event EventCreated(eventId: String, organizer: Address, filecoinCid: String)
event BadgeMinted(eventId: String, recipient: Address, badgeId: UInt64, filecoinCid: String)
event BadgeClaimed(eventId: String, claimer: Address, claimCode: String, filecoinCid: String)
event AIVerificationSubmitted(eventId: String, oracle: Address, proofHash: String, filecoinCid: String)
```

---

## 🗂️ API Routes

### `POST /api/pin`

Pins metadata to Filecoin via Synapse SDK. Server-side only — keeps `SYNAPSE_PRIVATE_KEY` off the client. Upload fees are paid from the server wallet's deposited USDFC balance.

**Request body:**

```jsonc
// Pin event metadata
{ "type": "event", "data": { "eventId": "...", "name": "...", ...EventMetadata } }

// Pin badge metadata (saved as CSV)
{ "type": "badge", "data": { "eventId": "...", "claimCode": "...", ...BadgeMetadata } }

// Pin QR code batch manifest (CSV)
{ "type": "qr-manifest", "data": { "rows": [...], "eventId": "...", "eventName": "..." } }
```

**Response:**

```jsonc
{ "cid": "bafkzcib...", "url": "filecoin://synapse/bafkzcib...", "size": 512, "name": "attestra/..." }

// On Synapse network error (non-fatal — Flow tx still proceeds):
{ "cid": null, "url": null, "size": 0, "name": "", "pending": true }
```

**Filecoin path naming:**

```
attestra/{eventId}/event-metadata--{slug}.json
attestra/{eventId}/badges/{claimCode}.csv
attestra/{eventId}/qr-codes/batch-{timestamp}--{slug}.csv
attestra/{eventId}/ai-verification.json
```

---

### `GET /api/synapse/balance`

Returns the USDFC balance state for the server wallet. Used by the Filecoin Billing tab.

**Response:**

```jsonc
{
  "serverWalletAddress": "0x...",
  "walletBalance": "2500000000000000000",       // raw bigint string
  "walletBalanceFormatted": "2.5",              // USDFC decimal
  "depositedBalance": "1800000000000000000",
  "depositedBalanceFormatted": "1.8",
  "serviceApproved": true,
  "lowBalance": false                           // true when deposited < 0.5 USDFC
}
```

---

### `POST /api/synapse/deposit`

Validates a deposit amount and returns chain metadata. The actual `depositWithPermitAndApproveOperator` transaction is signed and submitted **client-side** via the organizer's MetaMask wallet — the server key is not used for deposits.

**Request body:** `{ "amount": "2.5" }`

**Response:** `{ "ok": true, "parsedAmount": "...", "serverWalletAddress": "0x...", "chainId": 314159, ... }`

---

### `POST /api/verify`

Runs the full AI verification pipeline for an event.

**Request body:**

```json
{
  "eventId": "firestore-event-id",
  "imageUrls": ["https://...", "https://..."],
  "attendeeAddress": "0xOptionalFlowAddress"
}
```

**Pipeline:**
1. Fetches each image URL and encodes to base64
2. Sends to `gemini-2.0-flash` with an attendance verification prompt
3. Parses confidence score from AI response
4. Hashes result with SHA-256 → `proofHash`
5. Pins verification artifact as JSON to Filecoin
6. Oracle account signs + submits `SubmitAIVerification` transaction on Flow

**Response:**

```json
{
  "eventId": "...",
  "verified": true,
  "confidence": 0.92,
  "proofHash": "sha256:...",
  "ipfsCid": "bafyrei...",
  "flowTxId": "a1b2c3...",
  "timestamp": 1741234567890
}
```

---

## 🔒 ZK-Gated Events

Organizers can set eligibility rules enforced at claim time:

### Prerequisite Badge

Attendees must hold a badge from a specified previous event.

```
Eligibility Required: You must hold a badge from "Flow Hackathon 2025" to claim this badge.
```

### Minimum Reputation Level

Based on total badges held across all events:

| Badges | Level | Label |
|---|---|---|
| 0 | 0 | Beginner |
| 1+ | 1 | Initiate |
| 3+ | 2 | Voyager |
| 6+ | 3 | Visionary |

```
Reputation Too Low: This event requires Voyager status (3+ badges). You have 1.
```

---

## 🚢 Deploying to Vercel

### 1. Push to GitHub

```bash
git add .
git commit -m "deploy attestra"
git push origin main
```

### 2. Import on Vercel

Go to [vercel.com/new](https://vercel.com/new) and import your repository.

### 3. Set Environment Variables

In your Vercel project **Settings → Environment Variables**, add every variable from `.env.example`:

```
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID
NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS
NEXT_PUBLIC_FLOW_NETWORK
NEXT_PUBLIC_FLOW_ACCESS_NODE
NEXT_PUBLIC_FLOW_WALLET_DISCOVERY
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID
FLOW_TESTNET_ADDRESS
FLOW_TESTNET_PRIVATE_KEY
FLOW_ORACLE_ADDRESS
FLOW_ORACLE_PRIVATE_KEY
SYNAPSE_PRIVATE_KEY
GEMINI_API_KEY
NEXT_PUBLIC_AI_VERIFICATION_ENDPOINT
```

### 4. Deploy

Vercel auto-deploys on every push to `main`.

> **Important:** `@onflow/fcl` and `@filoz/synapse-sdk` are listed in `serverExternalPackages` in `next.config.mjs` — required for Vercel serverless functions to load them at runtime instead of bundling them.

---

## 🛠️ Local Development

### Generate Claim Codes (CLI)

```bash
npm run generate:codes
```

### Verify Filecoin Storage (CLI)

```bash
# Run a test upload + round-trip
node scripts/synapse-verify.mjs

# Verify a specific CID
node scripts/synapse-verify.mjs <PieceCID>
```

### Synapse Initial Setup (CLI)

Run once after configuring `SYNAPSE_PRIVATE_KEY` to deposit USDFC and approve the warm storage operator:

```bash
node scripts/synapse-setup.mjs
```

### Firestore Security Rules

Production-ready rules are in `firestore.rules`. Deploy with:

```bash
firebase deploy --only firestore:rules
```

### Flow Emulator (contract development)

```bash
flow emulator start
flow project deploy --network emulator
```

---

## 🤖 AI Verification Agent

The verification pipeline in `lib/ai/verification-agent.ts` uses **Gemini Flash 2.0** via `@google/generative-ai`.

### Oracle Pattern

The oracle account is a dedicated Flow testnet account whose private key is stored server-side in `FLOW_ORACLE_PRIVATE_KEY`. It never interacts with user wallets. `getOracleAuthorizer()` in `lib/flow/client.ts` builds the FCL authorizer using P-256 signing with `elliptic` + `sha3`.

---

## 📦 Filecoin Storage

All persistent artifacts are stored on Filecoin via the [Synapse SDK](https://docs.filecoin.cloud) (`@filoz/synapse-sdk`). Each upload returns a PieceCID verified on-chain via PDP (Proof of Data Possession) proofs.

| Artifact | Format | Path |
|---|---|---|
| Event metadata | JSON | `attestra/{eventId}/event-metadata--{slug}.json` |
| Badge metadata | CSV | `attestra/{eventId}/badges/{claimCode}.csv` |
| QR code batch manifest | CSV | `attestra/{eventId}/qr-codes/batch-{timestamp}--{slug}.csv` |
| AI verification artifact | JSON | `attestra/{eventId}/ai-verification.json` |

Retrieve any piece using the Synapse SDK:

```ts
const bytes = await synapse.storage.download({ pieceCid: '<PieceCID>' });
```

### Verifying uploads

```bash
# Test upload + round-trip verification (no args)
node scripts/synapse-verify.mjs

# Verify a specific PieceCID
node scripts/synapse-verify.mjs bafkzcib...
```

### Who pays for Filecoin storage

| Action | Payer | Method |
|---|---|---|
| Event metadata pin | **Organizer** (server wallet) | `SYNAPSE_PRIVATE_KEY` auto-signs server-side |
| QR code batch manifest | **Organizer** (server wallet) | Same |
| Badge metadata pin | **Organizer** (server wallet) | Background, non-blocking |
| AI verification artifact | **Organizer** (server wallet) | Same |
| Badge claim on Flow | **Attendee** | 3 FLOW via FCL wallet popup |

Organizers top up the server wallet's deposited USDFC balance from the **Filecoin Billing** tab in the organizer dashboard — connects MetaMask, shows live balance, and deposits via `depositWithPermitAndApproveOperator` in one MetaMask transaction. Low balance warning triggers at < 0.5 USDFC.

---

## 📜 License

MIT

---

## 🙏 Acknowledgements

- [Flow Blockchain](https://flow.com) — Cadence smart contracts and FCL
- [Filecoin Synapse SDK](https://docs.filecoin.cloud) — Decentralized storage
- [Google Gemini](https://ai.google.dev/) — AI vision verification
- [Firebase](https://firebase.google.com) — Authentication and Firestore
- [shadcn/ui](https://ui.shadcn.com/) — UI component library
- [Vercel](https://vercel.com) — Deployment platform
