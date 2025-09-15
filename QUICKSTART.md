# Quick Start Guide - Solana NFT Messaging App

Get up and running with the Solana NFT Messaging Web App in under 5 minutes!

## 🚀 Quick Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy the environment template
cp env.example .env.local

# Edit .env.local with your settings (optional for basic testing)
# At minimum, you can leave the defaults for devnet testing
```

### 3. Start Development Server
```bash
# Windows
scripts\start-dev.bat

# Linux/Mac
./scripts/start-dev.sh

# Or manually
npm start
```

### 4. Open Your Browser
Navigate to `http://localhost:3000`

## 🎯 First Steps

### Connect Your Wallet
1. Click "Connect Wallet" in the header
2. Select your preferred wallet (Phantom, Solflare, etc.)
3. Approve the connection

### Send Your First Message
1. Enter a recipient's Solana wallet address
2. Type your message (up to 500 characters)
3. Click "Send"
4. Approve the transaction in your wallet

### View Messages
- **Inbox**: Messages sent to your wallet
- **Outbox**: Messages you've sent
- Click any message to view details

## 🔧 Configuration (Optional)

### For Production Use

1. **Get a reCAPTCHA key** (recommended for spam protection):
   - Go to [Google reCAPTCHA](https://www.google.com/recaptcha/)
   - Create a new site
   - Copy the site key to `REACT_APP_RECAPTCHA_SITE_KEY` in `.env.local`

2. **Switch to Mainnet** (for real SOL):
   ```env
   REACT_APP_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
   REACT_APP_SOLANA_NETWORK=mainnet-beta
   ```

3. **Deploy your own Solana program**:
   ```bash
   # Install Solana CLI
   sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
   
   # Install Anchor CLI
   npm install -g @coral-xyz/anchor-cli
   
   # Deploy program
   anchor build
   anchor deploy
   ```

## 🧪 Testing

### Test with Devnet
- Devnet SOL is free (use `solana airdrop 2` to get test SOL)
- All transactions are test transactions
- Perfect for development and testing

### Test with Mainnet
- Uses real SOL (be careful!)
- Real transactions on Solana blockchain
- For production use only

## 📱 Features Overview

### Core Features
- ✅ Wallet connection (Phantom, Solflare, Backpack)
- ✅ Send messages as NFTs
- ✅ View inbox/outbox
- ✅ Message details modal
- ✅ Responsive design
- ✅ Error handling

### Advanced Features
- ✅ CAPTCHA protection
- ✅ Message validation
- ✅ Transaction history
- ✅ Explorer links
- ✅ Copy to clipboard

## 🛠️ Development

### Project Structure
```
src/
├── components/     # React components
├── contexts/       # React contexts
├── services/       # Business logic
├── types/          # TypeScript types
├── utils/          # Utility functions
└── hooks/          # Custom React hooks
```

### Key Files
- `src/App.tsx` - Main application component
- `src/services/solana.ts` - Solana blockchain interactions
- `src/components/MessageComposer.tsx` - Message sending form
- `programs/solana-messaging/` - Solana program (Rust)

### Available Scripts
```bash
npm start          # Start development server
npm run build      # Build for production
npm test           # Run tests
npm run anchor:build   # Build Solana program
npm run anchor:deploy  # Deploy Solana program
```

## 🚨 Troubleshooting

### Common Issues

**"Cannot find module" errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Wallet won't connect:**
- Make sure you have a Solana wallet installed
- Check that you're on the correct network
- Try refreshing the page

**Transaction fails:**
- Ensure you have enough SOL for gas fees
- Check that the recipient address is valid
- Verify your wallet is connected

**Build fails:**
- Check Node.js version (requires 16+)
- Clear npm cache: `npm cache clean --force`

## 📚 Learn More

- [Full Documentation](README.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Solana Documentation](https://docs.solana.com/)
- [Anchor Framework](https://www.anchor-lang.com/)

## 🆘 Need Help?

1. Check the troubleshooting section above
2. Review the full README.md
3. Create an issue in the repository
4. Join the Solana Discord community

---

**Ready to start messaging on-chain?** 🎉

Just run `npm install && npm start` and you're good to go!
