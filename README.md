# Parc3l - Decentralized Messaging on Solana

A modern, secure messaging application built on Solana blockchain. Parc3l enables direct wallet-to-wallet communication with group chats, end-to-end encryption, and advanced security features.

## Features

- 🔗 **Wallet Integration**: Connect with Phantom, Solflare, Backpack, and other Solana wallets
- 💬 **Direct Messaging**: Send encrypted messages with SOL transfers for permanence
- 👥 **Group Chats**: Create and manage group conversations with multiple participants
- 🔐 **End-to-End Encryption**: AES-256 encryption for all messages
- 🛡️ **Security Features**: Rate limiting, spam prevention, CAPTCHA protection
- 🏷️ **Contact Management**: Custom tags and contact organization
- 📱 **Responsive Design**: Modern UI that works on all devices
- 🌙 **Dark Mode**: Beautiful dark and light themes

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Blockchain**: Solana Web3.js + Wallet Adapter
- **Encryption**: AES-256 with CryptoJS
- **Storage**: Local Storage (client-side)
- **Security**: Rate limiting, content validation, CAPTCHA
- **UI/UX**: Modern responsive design with dark mode
- **Deployment**: Vercel/Netlify ready

## Prerequisites

- Node.js 16+ and npm/yarn
- A Solana wallet (Phantom, Solflare, etc.)
- Devnet SOL for testing (get free SOL from [faucet.solana.com](https://faucet.solana.com))

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/parc3l.git
   cd parc3l
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## Usage

### Getting Started

1. **Connect your wallet** using the "Connect Wallet" button
2. **Get devnet SOL** from [faucet.solana.com](https://faucet.solana.com) for testing
3. **Start messaging** by selecting a contact or creating a group

### Sending Messages

1. **Select a contact** from the contact list or create a new message
2. **Type your message** (up to 500 characters)
3. **Click "Send"** to send with SOL transfer (0.001 SOL + gas fees)
4. **Complete CAPTCHA** for security verification
5. **Confirm transaction** in your wallet

### Group Chats

1. **Click the "+" button** in the groups section
2. **Add group members** by entering their wallet addresses
3. **Create the group** and start messaging
4. **Manage members** by clicking the people icon in group chats

### Security Features

- **Rate Limiting**: Prevents spam (10 messages/minute, 100/hour, 500/day)
- **Content Validation**: Blocks malicious content and excessive caps
- **CAPTCHA Protection**: Prevents automated spam
- **Address Flagging**: Report and block suspicious addresses

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Navigation and wallet connection
│   ├── ContactList.tsx # Contact and group list
│   ├── ConversationView.tsx # Message display and input
│   ├── CreateGroupModal.tsx # Group creation
│   ├── GroupMembersModal.tsx # Group member management
│   ├── ContactTagModal.tsx # Contact tagging
│   ├── CaptchaModal.tsx # Security verification
│   ├── PrivacySettings.tsx # Privacy controls
│   └── SecurityIndicator.tsx # Security status
├── contexts/           # React contexts
│   ├── WalletContext.tsx # Wallet state management
│   └── ThemeContext.tsx # Dark/light theme
├── services/           # Business logic
│   ├── messageStorage.ts # Local data storage
│   ├── encryptionService.ts # Message encryption
│   ├── securityService.ts # Rate limiting & validation
│   └── solana.ts      # Blockchain interactions
├── types/             # TypeScript type definitions
│   └── index.ts       # Shared types
└── App.tsx            # Main application component
```

## Configuration

### Solana Network

The app is configured for Solana Devnet by default. To use Mainnet:

1. Update `REACT_APP_SOLANA_RPC_URL` in your environment variables
2. Change `REACT_APP_SOLANA_NETWORK` to `mainnet-beta`
3. Update the program ID in your Solana program

### CAPTCHA Setup

1. Go to [Google reCAPTCHA](https://www.google.com/recaptcha/)
2. Create a new site with reCAPTCHA v2
3. Add your domain to the site list
4. Copy the site key to `REACT_APP_RECAPTCHA_SITE_KEY`

### IPFS/Bundlr Configuration

For metadata storage, configure Bundlr:

1. Get a Bundlr wallet with some SOL
2. Update `REACT_APP_BUNDLR_ADDRESS` if using a different network
3. The app will automatically upload metadata to IPFS via Bundlr

## Deployment

### Vercel Deployment

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

### Netlify Deployment

1. **Connect your repository** to Netlify
2. **Set build command**: `npm run build`
3. **Set publish directory**: `build`
4. **Add environment variables** in Netlify dashboard
5. **Deploy**

### Manual Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Deploy the `build` folder** to your hosting provider

## Security Considerations

- **Message Content**: Messages are stored onchain and are publicly visible
- **Wallet Security**: Never share your private keys or seed phrases
- **Network Fees**: Always verify transaction details before confirming
- **CAPTCHA**: Helps prevent spam but doesn't guarantee message quality

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:

- Create an issue in this repository
- Check the [Solana documentation](https://docs.solana.com/)
- Join the [Solana Discord](https://discord.gg/solana)

## Roadmap

- [x] Message encryption support
- [x] Group messaging capabilities
- [x] Contact management and tagging
- [x] Security features (rate limiting, CAPTCHA)
- [ ] Message search and filtering
- [ ] File sharing capabilities
- [ ] Message reactions and replies
- [ ] Push notifications
- [ ] Integration with other Solana dApps

---

Built with ❤️ by David ADeyemi
