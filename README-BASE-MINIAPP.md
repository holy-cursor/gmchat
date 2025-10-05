# DotMsg - Base Mini App

A decentralized messaging platform built as a Base Mini App, supporting both Base (Ethereum L2) and Solana blockchains.

## 🚀 Features

- **Base Mini App**: Runs natively within Base App and Farcaster clients
- **Multi-Chain Support**: Base (primary) and Solana messaging
- **Mobile-First Design**: Optimized for mobile Base Mini App experience
- **Encrypted Messaging**: Secure on-chain message storage
- **Social Integration**: Built for the Base ecosystem

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Blockchain**: Base (Ethereum L2), Solana
- **Wallet Integration**: OnchainKit, Wagmi, RainbowKit
- **Mini App Framework**: @coinbase/onchainkit, @farcaster/miniapp-sdk

## 📱 Base Mini App Features

### Manifest Configuration
- **File**: `public/.well-known/farcaster.json`
- **Category**: Messaging
- **Social Integration**: Optimized for sharing and discovery

### Mobile Optimization
- **Responsive Design**: Mobile-first UI components
- **Touch-Friendly**: Large buttons and touch targets
- **Fast Loading**: Optimized for instant launch

### Wallet Integration
- **Base Network**: Primary blockchain support
- **OnchainKit**: Seamless wallet connection
- **Multi-Wallet**: Support for various Base-compatible wallets

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Base-compatible wallet (Coinbase Wallet, MetaMask, etc.)

### Installation
```bash
npm install
```

### Development
```bash
npm start
```

### Build
```bash
npm run build
```

## 📦 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Deploy with the included `vercel.json` configuration
3. Update the manifest with your production URL

### Other Platforms
- Netlify
- AWS S3 + CloudFront
- Any static hosting service

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_URL=https://your-domain.com
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

### Manifest Setup
1. Update `public/.well-known/farcaster.json` with your app details
2. Set correct URLs and metadata
3. Sign the manifest with Farcaster tools

## 📱 Base Mini App Integration

### Discovery
- Share your app in Base App to get indexed
- Appears in search results after first share
- Social sharing through Farcaster

### Features
- **Instant Launch**: No downloads required
- **Social Integration**: Built-in sharing and discovery
- **Wallet Integration**: Seamless Base wallet connection
- **Mobile Optimized**: Perfect for mobile Base App experience

## 🔐 Security

- **Encrypted Messages**: All messages are encrypted before storage
- **On-Chain Storage**: Messages stored on Base/Solana blockchains
- **Wallet Authentication**: Secure wallet-based authentication

## 🌐 Supported Networks

### Base (Primary)
- **Mainnet**: Base mainnet
- **Testnet**: Base Sepolia

### Solana (Secondary)
- **Mainnet**: Solana mainnet
- **Testnet**: Solana devnet

## 📞 Support

For issues and questions:
- GitHub Issues
- Base Discord
- Farcaster Community

## 📄 License

MIT License - see LICENSE file for details

---

**Built for the Base ecosystem** 🚀
