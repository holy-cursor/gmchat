# OnChain Messages - Solana NFT Messaging Web App

A lightweight web application that enables users to send messages as NFTs on the Solana blockchain. Each message is minted as an NFT and transferred directly to the recipient's wallet, ensuring permanence and portability.

## Features

- 🔗 **Wallet Integration**: Connect with Phantom, Solflare, Backpack, and other Solana wallets
- 💬 **NFT Messaging**: Send messages as NFTs with onchain metadata
- 📥 **Inbox/Outbox**: View received and sent messages
- 💰 **Gas-Only Model**: Only pay Solana network fees, no platform charges
- 🛡️ **CAPTCHA Protection**: Built-in spam protection
- 📱 **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Blockchain**: Solana Web3.js + Anchor Framework
- **Wallet Integration**: Solana Wallet Adapter
- **NFT Metadata**: Metaplex Token Metadata
- **Storage**: IPFS/Bundlr for metadata storage
- **Deployment**: Vercel/Netlify ready

## Prerequisites

- Node.js 16+ and npm/yarn
- Solana CLI tools
- Anchor Framework
- A Solana wallet (Phantom, Solflare, etc.)

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd solana-nft-messaging
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Get a free Shyft API key**
   - Go to [https://shyft.to](https://shyft.to)
   - Sign up for a free account
   - Get your API key from the dashboard

4. **Set up environment variables**
   ```bash
   cp env.example .env.local
   ```
   
   Edit `.env.local` with your configuration:
   ```env
   REACT_APP_SOLANA_RPC_URL=https://api.devnet.solana.com
   REACT_APP_SOLANA_NETWORK=devnet
   REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here
   ```

4. **Set up Solana program (optional for development)**
   ```bash
   # Install Anchor
   npm install -g @coral-xyz/anchor-cli
   
   # Build the program
   anchor build
   
   # Deploy to devnet
   anchor deploy
   ```

## Development

1. **Start the development server**
   ```bash
   npm start
   # or
   yarn start
   ```

2. **Open your browser**
   Navigate to `http://localhost:3000`

3. **Connect your wallet**
   - Click "Connect Wallet" in the header
   - Select your preferred wallet (Phantom, Solflare, etc.)
   - Approve the connection

## Usage

### Sending Messages

1. **Connect your wallet** using the "Connect Wallet" button
2. **Enter recipient address** in the recipient field
3. **Type your message** (up to 500 characters)
4. **Click "Send"** to mint the message as an NFT and transfer it
5. **Pay gas fees** when prompted by your wallet

### Receiving Messages

1. **Connect your wallet** to view your inbox
2. **Messages appear automatically** in the Inbox tab
3. **Click on any message** to view full details
4. **Use the Outbox tab** to see messages you've sent

## Project Structure

```
src/
├── components/          # React components
│   ├── Header.tsx      # Navigation and wallet connection
│   ├── Inbox.tsx       # Received messages view
│   ├── Outbox.tsx      # Sent messages view
│   ├── MessageCard.tsx # Individual message display
│   ├── MessageComposer.tsx # Message creation form
│   ├── MessageModal.tsx # Message detail modal
│   ├── AboutModal.tsx  # About information
│   └── Captcha.tsx     # CAPTCHA integration
├── contexts/           # React contexts
│   └── WalletContext.tsx # Wallet state management
├── services/           # Business logic
│   └── solana.ts      # Solana blockchain interactions
├── types/             # TypeScript type definitions
│   └── index.ts       # Shared types
└── App.tsx            # Main application component

programs/
└── solana-messaging/  # Anchor Solana program
    ├── src/
    │   └── lib.rs     # Program logic
    └── Cargo.toml     # Rust dependencies
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

- [ ] Message encryption support
- [ ] Group messaging capabilities
- [ ] Message search and filtering
- [ ] Custom NFT images for messages
- [ ] Message reactions and replies
- [ ] Integration with other Solana dApps

---

Built with ❤️ by David ADeyemi
