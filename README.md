# Veleo 🔐

![Veleo Banner](https://img.shields.io/badge/Veleo-Attendance-blueviolet?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15.5-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss)
![Aleo](https://img.shields.io/badge/Aleo-Testnet%20Beta-green?style=for-the-badge)
![Firebase](https://img.shields.io/badge/Firebase-10.7-orange?style=for-the-badge&logo=firebase)

**Veleo** is a decentralized proof-of-attendance protocol built on the [Aleo](https://aleo.org) blockchain using zero-knowledge proofs. The application enables event organizers to create on-chain events and issue verifiable attendance badges, while attendees can claim badges through QR codes or claim codes and showcase them in a digital portfolio. All blockchain transactions are executed on Aleo's testnet beta network with privacy-preserving zero-knowledge technology.

## ✨ Features

### For Event Organizers
- 🎪 **Create Events On-Chain** - Deploy events directly to Aleo blockchain with `create_event` transition
- 🏷️ **Generate Claim Codes** - Create unique claim codes stored in Firebase for badge distribution
- 📊 **Dashboard Analytics** - Track events, claim codes generated, and badge claims
- ⛓️ **Blockchain Integration** - All events are recorded on Aleo testnet beta via smart contract

### For Attendees
- 📱 **QR Code Scanning** - Scan QR codes to claim badges instantly
- ⌨️ **Manual Claiming** - Enter claim codes to mint badges on-chain via `claim_badge` transition
- 🎨 **Badge Portfolio** - View all claimed badges with event details and timestamps
- ⛓️ **On-Chain Minting** - Badges are minted on Aleo blockchain when claimed (not pre-minted)
- 🔍 **Firebase + Blockchain** - Metadata stored in Firebase, ownership verified on-chain

### General Features
- 🌓 **Dark/Light Mode** - Full theme support with smooth transitions
- 💼 **Aleo Wallet Adapter** - Universal wallet support (Leo Wallet, Puzzle Wallet) via @demox-labs/aleo-wallet-adapter
- 🔐 **Firebase Authentication** - Secure user authentication and session management
- 🔄 **Hybrid Storage** - Firebase for metadata, Aleo blockchain for ownership verification
- 📱 **Responsive Design** - Optimized for desktop and mobile devices
- 🛡️ **Zero-Knowledge Proofs** - Privacy-preserving transactions on Aleo testnet beta

## 🚀 Tech Stack

### Frontend
- **Framework**: [Next.js 15.5](https://nextjs.org/) with App Router and Turbopack
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes)

### Blockchain
- **Network**: [Aleo Testnet Beta](https://aleo.org)
- **Smart Contract**: [Leo Programming Language](https://docs.leo-lang.org/)
- **Deployed Program**: `velero_attender.aleo` on testnet beta
- **Wallet Integration**: [@demox-labs/aleo-wallet-adapter](https://github.com/demox-labs/aleo-wallet-adapter)
- **Explorer**: [Provable Explorer](https://testnet.explorer.provable.com/)

### Backend & Database
- **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth)
- **Database**: [Cloud Firestore](https://firebase.google.com/docs/firestore)
- **Storage**: Firebase for metadata, Aleo blockchain for ownership records

## 📋 Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Aleo Wallet** - [Leo Wallet](https://leo.app/) or [Puzzle Wallet](https://puzzle.online/) browser extension
- **Aleo Testnet Credits** - For transaction fees (get from [Aleo Faucet](https://faucet.aleo.org/))
- **Leo CLI** (optional, for contract development) - Install via `curl -L https://raw.githubusercontent.com/ProvableHQ/leo/testnet/install.sh | sh`

## 🏁 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/veleo.git
cd veleo
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Smart Contract (Already Deployed)

The Veleo smart contract is **already deployed** to Aleo testnet beta:

- **Program ID**: `velero_attender.aleo`
- **Network**: Testnet Beta
- **Explorer**: [View on Provable Explorer](https://testnet.explorer.provable.com/program/velero_attender.aleo)

#### Contract Functions

1. **`create_event`** - Creates a new event on-chain
   - Inputs: `event_id: field`, `max_attendees: u64`
   - Returns: Event record and updates on-chain mappings

2. **`claim_badge`** - Mints a badge for an attendee
   - Inputs: `event_id: field`, `badge_id: field`, `timestamp: u64`
   - Returns: Badge record with ownership

#### Deploy Your Own (Optional)

If you want to deploy your own instance:

```bash
cd aleo-contracts/attendance_badge
leo build
leo deploy --network testnet
# Update NEXT_PUBLIC_ALEO_PROGRAM_ID in .env.local with your program ID
```

### 4. Configure Environment

Create a `.env.local` file in the root directory:

```env
# Aleo Configuration
NEXT_PUBLIC_ALEO_PROGRAM_ID=velero_attender.aleo
NEXT_PUBLIC_ALEO_NETWORK=testnet
NEXT_PUBLIC_ALEO_API_ENDPOINT=https://api.explorer.aleo.org/v1

# Firebase Configuration (required for authentication and metadata storage)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Note**: You'll need to set up a Firebase project at [console.firebase.google.com](https://console.firebase.google.com) and enable Authentication and Firestore.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Project Structure

```
veleo/
├── aleo-contracts/          # Leo smart contracts
│   └── attendance_badge/
│       ├── src/
│       │   └── main.leo    # Main contract logic
│       ├── program.json    # Program metadata
│       └── README.md       # Contract documentation
├── app/                     # Next.js App Router
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Main landing page
│   └── globals.css         # Global styles and theme
├── components/             # React components
│   ├── ui/                 # shadcn/ui components
│   ├── header.tsx          # Navigation header
│   ├── organizer-dashboard.tsx
│   ├── attendee-portal.tsx
│   ├── badge-portfolio.tsx
│   ├── event-form.tsx
│   ├── qr-code-generator.tsx
│   └── wallet-connector.tsx
├── lib/                    # Utility functions
│   ├── aleo/              # Aleo integration
│   │   ├── client.ts      # Aleo client wrapper
│   │   ├── types.ts       # Type definitions
│   │   └── index.ts       # Exports
│   ├── utils.ts           # Helper functions
│   └── wallet-context.tsx # Wallet state management
├── hooks/                  # Custom React hooks
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🎯 Usage Guide

### As an Event Organizer

1. **Connect Wallet**: Click "Connect Wallet" in the header
2. **Install Wallet**: If you don't have one, install [Leo Wallet](https://leo.app/) or [Puzzle Wallet](https://puzzle.online/)
3. **Select Role**: Choose "Event Organizer" on the landing page
4. **Create Event**: Click "+ Create Event" button
5. **Fill Details**: Enter event name, description, date, and location
6. **Generate Codes**: After creation, generate QR codes or claim codes
7. **Distribute**: Share QR codes/claim codes with attendees
8. **Monitor**: Track badge claims in real-time on your dashboard

### As an Attendee

1. **Connect Wallet**: Click "Connect Wallet" in the header
2. **Select Role**: Choose "Attendee" on the landing page
3. **Claim Badge**: 
   - Scan QR code at the event, OR
   - Enter claim code manually
4. **View Portfolio**: Check "Portfolio" tab to see all badges
5. **Verify**: All badges are verifiable on-chain with privacy preserved
6. **Share**: Export or share your badge portfolio

## 🔐 Smart Contract Architecture

The Veleo smart contract (`velero_attender.aleo`) is written in Leo and deployed on Aleo testnet beta.

### Records (Private State)

**Badge Record**
```leo
record Badge {
    owner: address,
    event_id: field,
    badge_id: field,
    issued_at: u64,
}
```

**Event Record**
```leo
record Event {
    owner: address,
    event_id: field,
    max_attendees: u64,
    is_active: bool,
}
```

### Mappings (Public State)

- **`events`**: `field => address` - Maps event IDs to organizer addresses
- **`claimed_badges`**: `field => bool` - Tracks claimed badge IDs
- **`badge_counts`**: `field => u64` - Counts badges per event

### Transitions (Smart Contract Functions)

**`create_event(event_id: field, max_attendees: u64)`**
- Creates a new event on-chain
- Returns an Event record to the organizer
- Updates the `events` and `badge_counts` mappings
- Transaction fee: ~1.0 credits

**`claim_badge(event_id: field, badge_id: field, timestamp: u64)`**
- Mints a new badge for an attendee
- Returns a Badge record to the claimer
- Updates the `claimed_badges` mapping
- Transaction fee: ~1.0 credits

### Privacy Model

- **Records are private**: Badge and Event records are encrypted and only visible to owners
- **Mappings are public**: Event counts and badge claims are publicly verifiable
- **Zero-knowledge proofs**: All transactions are verified with ZK proofs without revealing private data
- **Claim-based minting**: Badges are minted on-demand when claimed, not pre-minted (gas efficient)

### Deployed Contract

- **Program ID**: `velero_attender.aleo`
- **Network**: Aleo Testnet Beta
- **Chain ID**: `testnetbeta`
- **Explorer**: [https://testnet.explorer.provable.com/program/velero_attender.aleo](https://testnet.explorer.provable.com/program/velero_attender.aleo)

## 🎨 Theme System

Veleo supports both light and dark modes with:
- System preference detection
- Manual toggle in header
- Smooth transitions between themes
- Persistent theme selection

## 💼 Wallet Integration

Veleo uses the official **Aleo Wallet Adapter** library for universal wallet support.

### Supported Wallets
- **[Leo Wallet](https://leo.app/)** - Official Aleo wallet browser extension
- **[Puzzle Wallet](https://puzzle.online/)** - Community-built Aleo wallet
- **Future wallets** - Any wallet implementing the Aleo Wallet Adapter standard

### Integration Details

**Libraries Used:**
- `@demox-labs/aleo-wallet-adapter-base` - Core wallet adapter types
- `@demox-labs/aleo-wallet-adapter-react` - React hooks and context
- `@demox-labs/aleo-wallet-adapter-reactui` - Pre-built UI components
- `@demox-labs/aleo-wallet-adapter-leo` - Leo Wallet adapter

**Features:**
- Multi-wallet support with automatic detection
- Transaction signing for `create_event` and `claim_badge`
- Network validation (testnetbeta)
- Public key display and copy functionality
- Seamless connect/disconnect flow

**Transaction Flow:**
1. User connects wallet via WalletMultiButton
2. App requests transaction execution via `requestTransaction()`
3. Wallet prompts user to approve transaction
4. Transaction is broadcast to Aleo network
5. Transaction ID is returned and tracked

## 🏆 Badge Categories

- 🌐 **Conferences** - Multi-day events
- 🏆 **Hackathons** - Coding competitions
- 🎓 **Meetups** - Community gatherings
- 🔒 **Workshops** - Educational sessions

## 🔒 Security & Privacy

### Blockchain Security
- **Zero-knowledge proofs**: All transactions use ZK-SNARKs for privacy
- **Wallet signatures**: Required for all on-chain operations
- **Private records**: Badge and Event records are encrypted on-chain
- **Public mappings**: Only aggregate data (counts, claims) are public

### Application Security
- **Firebase Authentication**: Secure user login and session management
- **Claim code validation**: Codes are single-use and validated before minting
- **Transaction verification**: All blockchain transactions are verified on-chain
- **No private key storage**: Wallets manage keys, app never accesses them

### Data Privacy
- **Hybrid storage**: Sensitive data on blockchain, metadata in Firebase
- **User control**: Users own their badge records via wallet
- **No tracking**: No analytics or tracking of user behavior
- **GDPR compliant**: Users can delete Firebase data anytime

## 🌐 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/veleo)

1. Connect your GitHub repository
2. Add environment variables:
   - `NEXT_PUBLIC_ALEO_PROGRAM_ID`
   - `NEXT_PUBLIC_ALEO_NETWORK`
3. Deploy

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Smart Contract Development

```bash
cd aleo-contracts/attendance_badge

# Build contract
leo build

# Run tests
leo test

# Deploy to testnet
leo deploy --network testnet
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use existing UI components from shadcn/ui
- Maintain responsive design
- Test on both light and dark modes
- Write clear commit messages
- Ensure privacy-preserving features are maintained

## 📚 Resources

### Aleo Resources
- [Aleo Developer Documentation](https://developer.aleo.org/)
- [Leo Language Documentation](https://docs.leo-lang.org/)
- [Leo Playground](https://play.leo-lang.org/)
- [Aleo Testnet Explorer](https://testnet.explorer.provable.com/)
- [Aleo Faucet](https://faucet.aleo.org/)
- [Aleo Discord Community](https://discord.com/invite/aleo)

### Wallet Resources
- [Aleo Wallet Adapter GitHub](https://github.com/demox-labs/aleo-wallet-adapter)
- [Leo Wallet](https://leo.app/)
- [Puzzle Wallet](https://puzzle.online/)

### Development Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

### Deployed Contract
- **Program**: `velero_attender.aleo`
- **Explorer**: [View on Provable Explorer](https://testnet.explorer.provable.com/program/velero_attender.aleo)

## 🐛 Troubleshooting

### Wallet Connection Issues

**Problem**: Wallet not connecting
- Ensure Leo Wallet or Puzzle Wallet extension is installed and enabled
- Check that wallet is connected to **testnetbeta** network (not testnet3)
- Refresh the page and try reconnecting
- Check browser console for errors

**Problem**: Transaction failing with network mismatch
- Verify wallet is on `testnetbeta` network
- App uses `chainId: "testnetbeta"` to match wallet network
- Switch wallet network in extension settings if needed

### Transaction Errors

**Problem**: "Insufficient credits" error
- Get testnet credits from [Aleo Faucet](https://faucet.aleo.org/)
- Ensure you have at least 1.5 credits for transactions
- Check wallet balance in extension

**Problem**: "Cannot set properties of undefined (setting 'transitionId')"
- This is a known issue with Leo Wallet adapter
- Try using `requestTransaction()` instead of `requestExecution()`
- Update Leo Wallet extension to latest version
- Report issue to Aleo Wallet Adapter GitHub

### Build Errors

**Problem**: Module not found errors
- Run `npm install` to ensure all dependencies are installed
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Clear Next.js cache: `rm -rf .next && npm run dev`

**Problem**: TypeScript errors
- Check Node.js version (requires 18+)
- Ensure TypeScript 5+ is installed
- Run `npm run lint` to check for issues

### Firebase Issues

**Problem**: Authentication not working
- Verify Firebase configuration in `.env.local`
- Enable Email/Password authentication in Firebase Console
- Check Firebase project settings and API keys

**Problem**: Firestore permission denied
- Update Firestore security rules to allow authenticated users
- Check user is logged in before accessing Firestore
- Verify Firebase project ID matches configuration

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Aleo](https://aleo.org)** - For pioneering zero-knowledge blockchain technology and Leo programming language
- **[Demox Labs](https://github.com/demox-labs)** - For the Aleo Wallet Adapter library enabling universal wallet support
- **[Firebase](https://firebase.google.com)** - For authentication and database infrastructure
- **[shadcn/ui](https://ui.shadcn.com/)** - For beautiful, accessible UI components
- **[Radix UI](https://www.radix-ui.com/)** - For primitive component architecture
- **[Vercel](https://vercel.com)** - For Next.js framework and hosting platform

## 📧 Contact

Project Link: [https://github.com/yourusername/veleo](https://github.com/yourusername/veleo)

---

**Built with 🔐 on Aleo** | [Documentation](https://developer.aleo.org/) | [Community](https://discord.com/invite/aleo)
