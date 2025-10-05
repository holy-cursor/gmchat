# WalletConnect Setup Guide

## Getting a WalletConnect Project ID

1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com/)
2. Sign up or log in to your account
3. Create a new project
4. Copy your Project ID
5. Replace `YOUR_PROJECT_ID` in `src/services/evmService.ts` with your actual Project ID

## What WalletConnect Provides

With WalletConnect, users can connect **hundreds of wallets** including:

### Mobile Wallets
- MetaMask Mobile
- Trust Wallet
- Rainbow
- Coinbase Wallet
- Argent
- Safe (Gnosis Safe)
- And many more...

### Desktop Wallets
- MetaMask Desktop
- Frame
- Rabby
- And more...

### Hardware Wallets
- Ledger Live
- Trezor Suite
- Keystone
- And more...

## How It Works

1. User clicks "WalletConnect" in the wallet selector
2. A QR code appears
3. User scans QR code with their mobile wallet
4. User approves connection in their wallet
5. Connection is established

## Benefits

- **Hundreds of wallet options** - not just 3-4
- **Mobile-first** - works great on mobile devices
- **Hardware wallet support** - connect Ledger, Trezor, etc.
- **Universal compatibility** - works with almost any EVM wallet
- **Better UX** - familiar QR code flow for users

## Current Status

The WalletConnect integration is ready, but you need to:
1. Get a Project ID from WalletConnect Cloud
2. Replace the placeholder in the code
3. Test the connection

Once set up, users will have access to hundreds of wallet options instead of just a few!
