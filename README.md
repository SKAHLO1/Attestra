# Veleo 🔐

![Veleo Banner](https://img.shields.io/badge/Veleo-Attendance-blueviolet?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss)
![Aleo](https://img.shields.io/badge/Aleo-Testnet-green?style=for-the-badge)

**Veleo** is a privacy-preserving decentralized application (dApp) for issuing and claiming verifiable on-chain attendance badges, built on the [Aleo](https://aleo.org) blockchain network with zero-knowledge proofs. Event organizers can create events and distribute proof-of-attendance badges, while attendees can claim and showcase their badges in a beautiful portfolio—all while maintaining privacy.

## ✨ Features

### For Event Organizers
- 🎪 **Create Events** - Set up events with custom details and badge supply
- 🏷️ **Issue Badges** - Generate QR codes and claim codes for attendees
- 📊 **Dashboard Analytics** - Track badges minted, attendees, and event status
- 🔒 **Privacy-First** - Leverage zero-knowledge proofs for private credential issuance

### For Attendees
- 📱 **QR Code Scanning** - Quick badge claiming via QR code
- ⌨️ **Manual Claiming** - Enter claim codes directly
- 🎨 **Badge Portfolio** - Beautiful showcase of all claimed badges
- ✅ **Verification Status** - Real-time on-chain verification with privacy
- 🔍 **Search & Filter** - Organize badges by category and search

### General Features
- 🌓 **Dark/Light Mode** - Full theme support with smooth transitions
- 💼 **Wallet Integration** - Connect to Aleo wallet for blockchain interactions
- 📤 **Export Options** - Download portfolio as PDF or export data
- 🔄 **Real-time Updates** - Instant badge status and verification
- 📱 **Responsive Design** - Optimized for all devices
- 🛡️ **Zero-Knowledge Proofs** - Powered by Aleo's privacy-preserving technology

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Blockchain**: [Aleo Protocol](https://aleo.org)
- **Smart Contracts**: [Leo Programming Language](https://docs.leo-lang.org/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes)
- **Analytics**: [Vercel Analytics](https://vercel.com/analytics)

## 📋 Prerequisites

- **Node.js** 18+ and npm/yarn/pnpm
- **Aleo Wallet** (Leo Wallet or Puzzle Wallet browser extension)
- **Leo CLI** (for smart contract deployment)

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

### 3. Deploy Smart Contract

#### Using Aleo Playground (Recommended for Hackathon)

1. Visit [Leo Playground](https://play.leo-lang.org/)
2. Copy the contents of `aleo-contracts/attendance_badge/src/main.leo`
3. Click "Deploy" and follow the instructions
4. Save your program ID (e.g., `attendance_badge.aleo`)

#### Using Leo CLI

```bash
# Install Leo CLI
curl -L https://raw.githubusercontent.com/ProvableHQ/leo/testnet/install.sh | sh

# Navigate to contract directory
cd aleo-contracts/attendance_badge

# Build the program
leo build

# Deploy to Aleo testnet (requires Aleo credits)
leo deploy --network testnet

# Note your program ID from the deployment output
```

### 4. Configure Environment

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_ALEO_PROGRAM_ID=attendance_badge.aleo
NEXT_PUBLIC_ALEO_NETWORK=testnet
```

Replace `attendance_badge.aleo` with your deployed program ID.

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

## 🔐 Smart Contract Overview

The Veleo smart contract is written in Leo and deployed on Aleo testnet. Key features:

### Records
- **Badge**: Represents an attendance credential with event details
- **Event**: Represents an event created by an organizer

### Transitions
- `create_event`: Create a new event with badge supply
- `mint_badge`: Issue a badge to an attendee
- `transfer_badge`: Transfer badge ownership
- `verify_badge`: Verify badge ownership
- `close_event`: Close an event

### Privacy Features
- All badge data is stored as private records
- Zero-knowledge proofs ensure verification without revealing sensitive data
- Attendee privacy is preserved while maintaining verifiability

## 🎨 Theme System

Veleo supports both light and dark modes with:
- System preference detection
- Manual toggle in header
- Smooth transitions between themes
- Persistent theme selection

## 💼 Wallet Integration

**Veleo supports Aleo wallet connections:**

### Supported Wallets
- **Leo Wallet** - Official Aleo wallet
- **Puzzle Wallet** - Community-built Aleo wallet

### Features
- Display wallet address with copy functionality
- Sign transactions for badge claims
- Account balance display
- Easy disconnect option

## 🏆 Badge Categories

- 🌐 **Conferences** - Multi-day events
- 🏆 **Hackathons** - Coding competitions
- 🎓 **Meetups** - Community gatherings
- 🔒 **Workshops** - Educational sessions

## 🔒 Security & Privacy

- All badge claims are verified on-chain with zero-knowledge proofs
- Wallet signatures required for transactions
- Private records ensure attendee privacy
- No sensitive data stored locally
- Zero-knowledge verification preserves confidentiality

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

- [Aleo Developer Documentation](https://developer.aleo.org/)
- [Leo Language Documentation](https://docs.leo-lang.org/)
- [Leo Playground](https://play.leo-lang.org/)
- [Aleo Discord Community](https://discord.com/invite/aleo)
- [Next.js Documentation](https://nextjs.org/docs)

## 🐛 Troubleshooting

### Wallet Connection Issues
- Ensure you have Leo Wallet or Puzzle Wallet installed
- Check that the wallet extension is enabled
- Try refreshing the page

### Contract Deployment Issues
- Ensure you have sufficient Aleo credits for deployment
- Verify you're connected to the correct network (testnet)
- Check Leo CLI is properly installed

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`
- Check Node.js version (requires 18+)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Aleo](https://aleo.org) - For the revolutionary zero-knowledge blockchain technology
- [Vercel](https://vercel.com) - For hosting and analytics
- [shadcn/ui](https://ui.shadcn.com/) - For beautiful UI components
- [Radix UI](https://www.radix-ui.com/) - For accessible component primitives

## 📧 Contact

Project Link: [https://github.com/yourusername/veleo](https://github.com/yourusername/veleo)

---

**Built with 🔐 on Aleo** | [Documentation](https://developer.aleo.org/) | [Community](https://discord.com/invite/aleo)
