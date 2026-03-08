# Attestra 🔐

![Attestra Banner](https://img.shields.io/badge/Attestra-Proof%20of%20Attendance-blueviolet?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-06B6D4?style=for-the-badge&logo=tailwindcss)
![Flow](https://img.shields.io/badge/Flow-Testnet-00EF8B?style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?style=for-the-badge&logo=firebase)
![Filecoin](https://img.shields.io/badge/Filecoin-Synapse_SDK-0090FF?style=for-the-badge)
![Gemini](https://img.shields.io/badge/Gemini-Flash%202.0-4285F4?style=for-the-badge&logo=google)

**Attestra** is a privacy-first, decentralized proof-of-attendance platform built on the [Flow](https://flow.com) blockchain. Event organizers create gated on-chain events, generate QR code claim codes, and run Gemini AI photo verification. Attendees claim verifiable attendance badges minted as Flow Cadence tokens, with all artifact metadata pinned permanently to Filecoin via the Synapse SDK. Gated events enforce eligibility rules — requiring attendees to hold a prerequisite badge or meet a minimum reputation level. Organizers manage Filecoin storage billing in-app via a connected MetaMask wallet.

---

## ✨ Features

### For Event Organizers
- **Create Events On-Chain** — Deploy events to Flow testnet via the `AttendanceBadge` Cadence contract (100 FLOW fee); categories: Conference, Hackathon, Meetup, Workshop
- **Gated Events** — Require attendees to hold a badge from a prior event (`prerequisiteEventId`) or reach a minimum reputation level (0 / 1 / 3 / 5 badges)
- **QR Code Generation** — Bulk-generate unique claim codes; download individual QR images or all codes as a CSV (includes `Claim Code`, `QR URL`, `Event Name`, `Status`, `Filecoin CID`, `Filecoin URL`)
- **AI Photo Verification** — Trigger Gemini Flash 2.0 vision analysis on event photos from the event dashboard; proof hash committed on-chain via oracle account
- **Organizer Dashboard** — Tabbed view: **Events** (stats, event list, create form) and **Filecoin Billing** (balance, MetaMask deposit)
- **Filecoin Billing** — Live USDFC balance display; connect MetaMask to deposit USDFC directly from the browser via `depositWithPermitAndApproveOperator` — no CLI needed post-deploy; low-balance warning at < 0.5 USDFC

### For Attendees
- **Badge Claiming** — Enter a claim code (manual) or scan a QR code to mint a badge on Flow testnet (3 FLOW fee)
- **Wallet Verification** — Wallet ownership is verified via FCL before any claim is accepted
- **Eligibility Enforcement** — Clear error messages for unmet prerequisite badge or reputation requirements
- **Badge Portfolio** — Full gallery of claimed badges with event name, category, claim date, Flow TX ID, and Filecoin CID
- **On-Chain Reputation** — Reputation level based on total badges held: Beginner (0) → Initiate (1+) → Voyager (3+) → Visionary (6+)
- **Badge History** — In-portal badge history list with status and Flow TX IDs

### Platform
- **Role-Based Auth** — Firebase email/password sign-in; role (organizer / attendee) stored in Firestore user profile
- **Dual Wallet** — Flow wallet (FCL + WalletConnect) for on-chain transactions; MetaMask (EVM) for Filecoin billing only
- **Hybrid Storage** — Firestore for mutable metadata; Flow for badge ownership; Filecoin for permanent artifact storage
- **Non-Blocking Filecoin** — Badge metadata pinned to Filecoin in the background after Flow tx; Flow tx is never delayed by Filecoin
- **Graceful Degradation** — Filecoin network errors return a `pending: true` stub; all Flow operations continue unaffected
- **Pricing Tiers** — Free (1 event, 10 codes), Pro ($29/mo, unlimited), Enterprise (custom) shown on landing page
- **Responsive UI** — Full desktop and mobile support; dark hero header, Flow price widget, use-case showcase, how-it-works section

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         Next.js 15 App (SPA)                         │
│                                                                      │
│  Landing / Role Select → Login (Firebase) → Role-based view          │
│                                                                      │
│  ┌──────────────────────┐      ┌──────────────────────────────────┐  │
│  │  Organizer Dashboard │      │  Attendee Portal + Badge Portfolio│  │
│  │  ├─ Events tab       │      │  ├─ Claim Badge (manual / QR)    │  │
│  │  │  ├─ Event Form    │      │  ├─ Badge History                │  │
│  │  │  ├─ Event List    │      │  └─ Reputation Dashboard         │  │
│  │  │  └─ QR Generator  │      └──────────────────────────────────┘  │
│  │  └─ Filecoin tab     │                                            │
│  │     └─ Billing UI    │                                            │
│  └──────────────────────┘                                            │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │                   lib/services (React hooks)                 │    │
│  │   useEventOperations · useEventInfo · useUserBadges          │    │
│  └──────────────────┬───────────────────────┬───────────────────┘    │
│                     │                       │                        │
│  ┌──────────────────▼──┐   ┌───────────────▼──────────────────────┐ │
│  │  Firebase Firestore  │   │  Next.js API Routes                  │ │
│  │  + Auth              │   │  POST /api/pin                       │ │
│  └─────────────────────┘   │  POST /api/verify                    │ │
│                             │  GET  /api/synapse/balance           │ │
│                             │  POST /api/synapse/deposit           │ │
│                             └───────┬──────────────┬──────────────┘ │
│                                     │              │                 │
│                        ┌────────────▼──┐  ┌────────▼─────────────┐  │
│                        │  Synapse SDK  │  │  Gemini Flash 2.0    │  │
│                        │  (Filecoin    │  │  AI Verification     │  │
│                        │  Calibration) │  └──────────┬───────────┘  │
│                        └───────────────┘             │              │
│                                          ┌───────────▼────────────┐ │
│                                          │  Flow Blockchain       │ │
│                                          │  AttendanceBadge.cdc   │ │
│                                          │  FCL · Oracle signer   │ │
│                                          └────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow — Event Creation
1. Organizer fills event form (name, description, dates, location, category, max attendees, gating rules)
2. Firebase doc created first → its ID becomes the canonical `eventId`
3. Event metadata pinned to Filecoin via `POST /api/pin` → CID returned
4. FCL wallet popup → organizer pays **100 FLOW** → `CreateEvent.cdc` sealed on Flow
5. Firebase doc updated with `flowTxId`; rolled back if Flow tx fails

### Data Flow — Badge Claiming
1. Attendee enters claim code → Firestore validates code exists and is unused
2. Client-side eligibility checks: prerequisite badge ownership + reputation level
3. FCL wallet popup → attendee pays **3 FLOW** → `ClaimBadge.cdc` sealed on Flow *(Filecoin pin deferred — wallet popup is instant)*
4. Firebase badge record written immediately with `category`, `eventName`, `claimCode`, `flowTxId`
5. Badge metadata pinned to Filecoin as CSV **in the background** (non-blocking); `filecoinCid` written back to Firebase via `updateDoc`

### Data Flow — AI Verification
1. Organizer clicks **AI Verify** in event list, provides photo URLs
2. `POST /api/verify` fetches images → base64 encodes → sends to `gemini-2.0-flash`
3. AI returns confidence score
4. Result hashed with SHA-256 → `proofHash`
5. Verification artifact JSON pinned to Filecoin
6. Oracle account (server-side P-256 key) signs and submits `SubmitAIVerification.cdc` on Flow

### Data Flow — Filecoin Top-Up
1. Organizer opens **Filecoin** tab in dashboard
2. Clicks **Connect MetaMask** → MetaMask prompted to switch to / add Filecoin Calibration Testnet
3. Enters USDFC amount → clicks **Deposit** → MetaMask signs `depositWithPermitAndApproveOperator`
4. Balance cards refresh automatically after confirmation

---

## 🚀 Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) — App Router, single-page |
| Language | [TypeScript 5](https://www.typescriptlang.org/) |
| Styling | [TailwindCSS 4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) |
| Blockchain | [Flow Testnet](https://flow.com) — Cadence 1.0 |
| Wallet (Flow) | [FCL](https://developers.flow.com/tools/clients/fcl-js) + WalletConnect |
| Wallet (EVM) | [viem](https://viem.sh/) `createWalletClient` + MetaMask (`window.ethereum`) |
| Smart Contract | `AttendanceBadge.cdc` — Cadence 1.0 |
| Database | [Firebase Firestore](https://firebase.google.com/docs/firestore) |
| Auth | [Firebase Authentication](https://firebase.google.com/docs/auth) — Email/Password |
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
│   │   ├── pin/route.ts              # POST — pin event/badge/QR metadata to Filecoin
│   │   ├── verify/route.ts           # POST — run Gemini AI verification pipeline
│   │   └── synapse/
│   │       ├── balance/route.ts      # GET  — USDFC deposited + wallet balance
│   │       └── deposit/route.ts      # POST — validate deposit, return chain info
│   ├── layout.tsx                    # Root layout: ThemeProvider, AuthProvider, EVMWalletProvider, AleoWalletProvider
│   └── page.tsx                      # SPA: landing → role select → organizer or attendee view
│
├── cadence/
│   ├── contracts/
│   │   └── AttendanceBadge.cdc       # Main Cadence smart contract
│   ├── scripts/
│   │   ├── GetEvent.cdc
│   │   ├── GetBadgeIDs.cdc
│   │   └── GetAIVerification.cdc
│   └── transactions/
│       ├── CreateEvent.cdc           # 100 FLOW — register event on-chain
│       ├── ClaimBadge.cdc            # 3 FLOW — mint badge on-chain
│       └── SubmitAIVerification.cdc  # Oracle submits AI proof hash
│
├── components/
│   ├── attendee-portal.tsx           # Badge claiming, history, reputation dashboard
│   ├── badge-portfolio.tsx           # Full badge gallery (category, CID, Flow TX)
│   ├── event-form.tsx                # Create event (name, dates, category, gating rules)
│   ├── event-list.tsx                # Organizer event list + QR generator + AI Verify
│   ├── filecoin-billing.tsx          # MetaMask connect, USDFC balance, deposit form
│   ├── header.tsx                    # Top navigation bar
│   ├── hamburger-menu.tsx            # Mobile navigation
│   ├── organizer-dashboard.tsx       # Dashboard shell: Events tab + Filecoin tab
│   ├── pricing.tsx                   # Free / Pro / Enterprise pricing tiers
│   ├── qr-code-generator.tsx         # Bulk QR generation + CSV export with CIDs
│   ├── wallet-button.tsx             # Flow wallet connect / disconnect button
│   ├── auth/
│   │   └── login-dialog.tsx          # Firebase email/password login modal
│   ├── badge/
│   │   └── badge-card.tsx            # Individual badge display card
│   └── onboarding/
│       ├── how-it-works.tsx          # Landing — how it works section
│       └── use-case-showcase.tsx     # Landing — use cases section
│
├── lib/
│   ├── ai/
│   │   └── verification-agent.ts     # Gemini Flash integration + oracle pipeline
│   ├── evm-wallet-context.tsx        # MetaMask context (viem walletClient + connect/disconnect)
│   ├── wallet-adapter-context.tsx    # AleoWalletProvider wrapping Flow wallet context
│   ├── firebase/
│   │   ├── config.ts
│   │   └── auth-context.tsx          # AuthProvider + useAuth hook
│   ├── flow/
│   │   ├── client.ts                 # FlowClient + FCL config + oracle signer (P-256)
│   │   ├── hooks.ts                  # useFlowWallet hook (address, verified)
│   │   └── types.ts
│   ├── ipfs/
│   │   └── client.ts                 # Synapse SDK helpers: uploadJSON, uploadCSV, uploadBytes
│   ├── services/
│   │   ├── event-hooks.ts            # useEventOperations (createEvent, claimBadge), useEventInfo
│   │   ├── badge-hooks.ts            # useUserBadges
│   │   ├── types.ts                  # EventData, BadgeData, EventCategory
│   │   └── index.ts
│   ├── qr-utils.ts                   # generateClaimCode, encodeQRData, decodeQRData
│   └── config.ts                     # getApplicationId, env helpers
│
└── scripts/
    ├── generate-claim-codes.js       # CLI: bulk-generate claim codes into Firestore
    ├── synapse-setup.mjs             # CLI: one-time USDFC deposit + approveService
    └── synapse-verify.mjs            # CLI: test upload or verify a PieceCID
```

---

## 📋 Prerequisites

- **Node.js** 18+
- **Flow Wallet** — [Flow Wallet](https://wallet.flow.com/), [Blocto](https://blocto.io/), or any FCL-compatible wallet
- **Flow Testnet FLOW tokens** — [Testnet Faucet](https://testnet-faucet.onflow.org)
  - Organizers: **100 FLOW** to create an event
  - Attendees: **3 FLOW** to claim a badge
- **Firebase Project** — Free Spark plan; enable Email/Password Auth and Firestore
- **Filecoin Synapse wallet** — EVM private key (`SYNAPSE_PRIVATE_KEY`) funded with USDFC on Filecoin Calibration testnet; see [docs.filecoin.cloud](https://docs.filecoin.cloud/getting-started/)
- **MetaMask** *(organizers only)* — for topping up USDFC from the Filecoin Billing tab
- **Gemini API key** — Free at [aistudio.google.com](https://aistudio.google.com)
- **Flow CLI** — For contract deployment: [install docs](https://developers.flow.com/tools/flow-cli)

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
flow accounts create --network testnet   # skip if you have one
flow project deploy --network testnet
```

Copy the deployed address into `NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS` in `.env.local`.

### 4. Run the Synapse One-Time Setup

```bash
node scripts/synapse-setup.mjs
```

Deposits USDFC and approves the warm storage operator. Only needed once per wallet. Alternatively, use the **Filecoin** tab in the organizer dashboard after launch.

### 5. Start the Dev Server

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

### Flow Blockchain

```env
NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS=0xYourDeployedContractAddress
NEXT_PUBLIC_FLOW_NETWORK=testnet
NEXT_PUBLIC_FLOW_ACCESS_NODE=https://rest-testnet.onflow.org
NEXT_PUBLIC_FLOW_WALLET_DISCOVERY=https://fcl-discovery.onflow.org/testnet/authn
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=    # https://cloud.walletconnect.com

FLOW_TESTNET_ADDRESS=0xYourTestnetAddress
FLOW_TESTNET_PRIVATE_KEY=your_hex_private_key

# Oracle — server-side, signs AI verification transactions
FLOW_ORACLE_ADDRESS=0xYourOracleAddress
FLOW_ORACLE_PRIVATE_KEY=your_oracle_hex_key
```

Generate key pairs with `flow keys generate`. Fund both accounts from the [testnet faucet](https://testnet-faucet.onflow.org).

### Filecoin — Synapse SDK

```env
SYNAPSE_PRIVATE_KEY=0x...   # Server-side EVM key — NEVER prefix with NEXT_PUBLIC_
# SYNAPSE_RPC_URL=           # Optional: override Filecoin Calibration RPC
```

See [docs.filecoin.cloud/getting-started](https://docs.filecoin.cloud/getting-started/) to acquire USDFC.

### AI Verification — Gemini

```env
GEMINI_API_KEY=
NEXT_PUBLIC_AI_VERIFICATION_ENDPOINT=/api/verify
```

Free quota: **15 req/min, 1M tokens/day** on `gemini-2.0-flash`.

---

## ⛓️ Smart Contract

### `AttendanceBadge.cdc`

Located at `cadence/contracts/AttendanceBadge.cdc`. Deployed on Flow Testnet.

#### On-Chain State

| Key | Type | Description |
|---|---|---|
| `events` | `{String: EventRecord}` | All events keyed by `eventId` |
| `verifications` | `{String: VerificationRecord}` | AI proofs keyed by `eventId` |
| `totalBadges` | `UInt64` | Global badge counter |
| `totalEvents` | `UInt64` | Global event counter |

#### Transactions

| Transaction | Fee | Description |
|---|---|---|
| `CreateEvent.cdc` | 100 FLOW | Register event on-chain |
| `ClaimBadge.cdc` | 3 FLOW | Mint badge for claimer |
| `SubmitAIVerification.cdc` | gas only | Record AI proof hash + Filecoin CID (oracle-signed) |

#### Scripts

| Script | Returns |
|---|---|
| `GetEvent.cdc` | `EventRecord` for a given `eventId` |
| `GetBadgeIDs.cdc` | Badge IDs for a given `Address` |
| `GetAIVerification.cdc` | `VerificationRecord` for a given `eventId` |

#### Emitted Events

```cadence
event EventCreated(eventId: String, organizer: Address, filecoinCid: String)
event BadgeMinted(eventId: String, recipient: Address, badgeId: UInt64, filecoinCid: String)
event BadgeClaimed(eventId: String, claimer: Address, claimCode: String, filecoinCid: String)
event AIVerificationSubmitted(eventId: String, oracle: Address, proofHash: String, filecoinCid: String)
```

---

## 🗂️ API Routes

### `POST /api/pin`

Pins metadata to Filecoin. Server-side only — `SYNAPSE_PRIVATE_KEY` never reaches the client.

```jsonc
// Event metadata
{ "type": "event", "data": { "eventId": "...", "name": "...", "category": "..." } }

// Badge metadata
{ "type": "badge", "data": { "eventId": "...", "claimCode": "...", "category": "..." } }

// QR code batch manifest
{ "type": "qr-manifest", "data": { "rows": [...], "eventId": "...", "eventName": "..." } }
```

**Success:** `{ "cid": "bafkzcib...", "url": "filecoin://synapse/...", "size": 512, "name": "attestra/..." }`

**Degraded (non-fatal):** `{ "cid": null, "url": null, "size": 0, "name": "", "pending": true }`

**Filecoin paths:**
```
attestra/{eventId}/event-metadata--{slug}.json
attestra/{eventId}/badges/{claimCode}.csv
attestra/{eventId}/qr-codes/batch-{timestamp}--{slug}.csv
attestra/{eventId}/ai-verification.json
```

---

### `GET /api/synapse/balance`

Returns server wallet USDFC balance info for the Filecoin Billing tab.

```jsonc
{
  "serverWalletAddress": "0x...",
  "walletBalanceFormatted": "2.5",
  "depositedBalanceFormatted": "1.8",
  "serviceApproved": true,
  "lowBalance": false   // true when deposited < 0.5 USDFC
}
```

---

### `POST /api/synapse/deposit`

Validates deposit amount and returns chain info. The actual transaction is signed **client-side** by MetaMask via `depositWithPermitAndApproveOperator` — the server key is not used.

```jsonc
// Request
{ "amount": "2.5" }

// Response
{ "ok": true, "parsedAmount": "2500000000000000000", "serverWalletAddress": "0x...", "chainId": 314159 }
```

---

### `POST /api/verify`

AI verification pipeline.

```json
{
  "eventId": "...",
  "imageUrls": ["https://..."],
  "attendeeAddress": "0xOptional"
}
```

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

## 🔒 Gated Events

Set eligibility rules on event creation — enforced at claim time.

### Prerequisite Badge
Attendee must hold a badge from a specific prior event.

### Minimum Reputation Level

| Badges held | Level | Label |
|---|---|---|
| 0 | 0 | Beginner |
| 1+ | 1 | Initiate |
| 3+ | 2 | Voyager |
| 6+ | 3 | Visionary |

---

## 💳 Pricing

| Tier | Price | Events | Badge Codes |
|---|---|---|---|
| **Free** | $0/forever | 1 | 10 per event |
| **Pro** | $29/month | Unlimited | 1,000/month |
| **Enterprise** | Custom | Unlimited | Unlimited |

All tiers include QR code generation, Firebase badge storage, and Flow testnet transactions. Pro adds gated events, reputation scoring, and bulk export.

---

## 📦 Filecoin Storage

All artifacts stored on Filecoin via `@filoz/synapse-sdk`. PieceCIDs verified via PDP (Proof of Data Possession).

| Artifact | Format | Payer |
|---|---|---|
| Event metadata | JSON | Organizer (server wallet) |
| Badge metadata | CSV | Organizer (server wallet, background) |
| QR code batch manifest | CSV | Organizer (server wallet) |
| AI verification artifact | JSON | Organizer (server wallet) |

Retrieve by CID:
```ts
const bytes = await synapse.storage.download({ pieceCid: '<PieceCID>' });
```

Organizers top up USDFC from the **Filecoin** tab in the dashboard. Low-balance alert at < 0.5 USDFC.

---

## 🚢 Deploying to Vercel

```bash
git add . && git commit -m "deploy" && git push origin main
```

Import at [vercel.com/new](https://vercel.com/new) and add all env vars from `.env.example` in **Settings → Environment Variables**.

> **Required:** `@onflow/fcl` and `@filoz/synapse-sdk` are in `serverExternalPackages` in `next.config.mjs` — this is required for Vercel serverless functions.

---

## 🛠️ Local Development

```bash
# Dev server
npm run dev

# Generate claim codes (CLI)
npm run generate:codes

# One-time Synapse setup
node scripts/synapse-setup.mjs

# Verify Filecoin storage
node scripts/synapse-verify.mjs
node scripts/synapse-verify.mjs <PieceCID>

# Deploy Firestore rules
firebase deploy --only firestore:rules

# Flow emulator
flow emulator start && flow project deploy --network emulator
```

---

## 🤖 AI Verification

`lib/ai/verification-agent.ts` runs Gemini Flash 2.0 on event photos, scores attendance confidence, hashes the result, pins the artifact to Filecoin, then submits the proof hash on-chain via the oracle account.

The oracle uses a server-side P-256 key (`FLOW_ORACLE_PRIVATE_KEY`) via `elliptic` + `sha3`. It never touches user wallets.

---

## 📜 License

MIT

---

## 🙏 Acknowledgements

- [Flow Blockchain](https://flow.com) — Cadence smart contracts and FCL
- [Filecoin Synapse SDK](https://docs.filecoin.cloud) — Decentralized storage
- [Google Gemini](https://ai.google.dev/) — AI vision verification
- [Firebase](https://firebase.google.com) — Auth and Firestore
- [shadcn/ui](https://ui.shadcn.com/) — UI components
- [viem](https://viem.sh/) — EVM wallet client
- [Vercel](https://vercel.com) — Deployment
