# Provera 🪪

![Provera Banner](https://img.shields.io/badge/Provera-Attendance-blueviolet?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.1-06B6D4?style=for-the-badge&logo=tailwindcss)
![Linera](https://img.shields.io/badge/Linera-Official_Template-red?style=for-the-badge)

**Provera** is a decentralized application (dApp) for issuing and claiming verifiable on-chain attendance badges, built on the [Linera](https://linera.io) blockchain network. Event organizers can create events and distribute proof-of-attendance badges, while attendees can claim and showcase their badges in a beautiful portfolio.

> **📦 Official Linera Template Integration**  
> This project follows the [official Linera protocol template](https://github.com/linera-io/linera-protocol/tree/main/examples) structure and best practices. The frontend implementation is based on the non-fungible token example with modern Next.js architecture.

## ✨ Features

### For Event Organizers
- 🎪 **Create Events** - Set up events with custom details and microchain deployment
- 🏷️ **Issue Badges** - Generate QR codes and claim codes for attendees
- 📊 **Dashboard Analytics** - Track badges minted, attendees, and event status
- 🔗 **Microchain Management** - Each event gets its own Linera microchain

### For Attendees
- 📱 **QR Code Scanning** - Quick badge claiming via QR code
- ⌨️ **Manual Claiming** - Enter claim codes directly
- 🎨 **Badge Portfolio** - Beautiful showcase of all claimed badges
- ✅ **Verification Status** - Real-time on-chain verification
- 🔍 **Search & Filter** - Organize badges by category and search

### General Features
- 🌓 **Dark/Light Mode** - Full theme support with smooth transitions
- 💼 **Wallet Integration** - Connect to Linera wallet for blockchain interactions
- 📤 **Export Options** - Download portfolio as PDF or export data
- 🔄 **Real-time Updates** - Instant badge status and verification
- 📱 **Responsive Design** - Optimized for all devices
- ⚡ **Instant Finality** - Powered by Linera's microchain technology

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Styling**: [TailwindCSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Blockchain**: [Linera Protocol](https://linera.io)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes)
- **Analytics**: [Vercel Analytics](https://vercel.com/analytics)

## Quick Start - Local Development

→ See [`START_HERE.md`](./START_HERE.md) for the fastest setup!

### Windows (PowerShell):
```powershell
# 1. Install Linera CLI
cargo install linera --locked

# 2. Run setup script
.\start-local-dev.ps1

# 3. Start frontend
npm run dev
```

### Mac/Linux:
```bash
# 1. Install Linera CLI
cargo install linera --locked

# 2. Initialize wallet and deploy
linera wallet init --with-new-chain
bash scripts/deploy-contract.sh

# 3. Add Application ID to .env.local

# 4. Start frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Full Guide:** See [`LOCAL_DEVELOPMENT.md`](./LOCAL_DEVELOPMENT.md) for detailed instructions

## Project Structure

```
linera-proof/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Main landing page
│   └── globals.css          # Global styles and theme
├── components/              # React components
│   ├── ui/                  # shadcn/ui components
│   ├── header.tsx           # Navigation header
│   ├── organizer-dashboard.tsx
│   ├── attendee-portal.tsx
│   ├── badge-portfolio.tsx
│   ├── event-form.tsx
│   ├── event-list.tsx
│   ├── qr-code-generator.tsx
│   ├── qr-code-verifier.tsx
│   ├── wallet-connector.tsx
│   └── theme-provider.tsx
├── lib/                     # Utility functions
│   ├── utils.ts            # Helper functions
│   └── wallet-context.tsx  # Wallet state management
├── hooks/                   # Custom React hooks
├── public/                  # Static assets
├── styles/                  # Additional styles
└── package.json            # Dependencies and scripts
```

## 📖 Usage Guide

### As an Event Organizer

1. **Connect Wallet**: Click "Connect Wallet" in the header
2. **Select Role**: Choose "Event Organizer" on the landing page
3. **Create Event**: Click "+ Create Event" button
4. **Fill Details**: Enter event name, description, date, and location
5. **Generate Codes**: After creation, generate QR codes or claim codes
6. **Distribute**: Share QR codes/claim codes with attendees
7. **Monitor**: Track badge claims in real-time on your dashboard

### As an Attendee

1. **Connect Wallet**: Click "Connect Wallet" in the header
2. **Select Role**: Choose "Attendee" on the landing page
3. **Claim Badge**: 
   - Scan QR code at the event, OR
   - Enter claim code manually
4. **View Portfolio**: Check "Portfolio" tab to see all badges
5. **Share**: Export or share your badge portfolio

## 🎨 Features Deep Dive

### Theme System
Provera supports both light and dark modes with:
- System preference detection
- Manual toggle in header
- Smooth transitions between themes
- Persistent theme selection

### Wallet Integration
- Connect to Linera wallet
- Display wallet address
- Sign transactions for badge claims
- Disconnect functionality

### Badge Categories
- 🌐 **Conferences** - Multi-day events
- 🏆 **Hackathons** - Coding competitions
- 🎓 **Meetups** - Community gatherings
- 🔒 **Workshops** - Educational sessions

## 🔐 Security

- All badge claims are verified on-chain
- Wallet signatures required for transactions
- Each event deployed to isolated microchain
- No sensitive data stored locally

## 🌐 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Trooper4L/linera-proof)

1. Connect your GitHub repository
2. Configure environment variables (if any)
3. Deploy

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
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

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Linera Protocol](https://linera.io) - For the revolutionary microchain technology
- [Vercel](https://vercel.com) - For hosting and analytics
- [shadcn/ui](https://ui.shadcn.com/) - For beautiful UI components
- [Radix UI](https://www.radix-ui.com/) - For accessible component primitives

## 📧 Contact

Project Link: [https://github.com/Trooper4L/linera-proof](https://github.com/Trooper4L/linera-proof)

---

**Built with ❤️ on Linera** | [Documentation](https://docs.linera.io) | [Community](https://discord.gg/linera)
