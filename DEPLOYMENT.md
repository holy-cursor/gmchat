# Deployment Guide - Solana NFT Messaging App

This guide covers deploying the Solana NFT Messaging Web App to various platforms.

## Prerequisites

- Node.js 16+ installed
- npm or yarn package manager
- Git repository access
- Solana wallet with some SOL for gas fees
- Google reCAPTCHA site key (optional but recommended)

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the environment template and configure:

```bash
cp env.example .env.local
```

Edit `.env.local` with your settings:

```env
# Solana Configuration
REACT_APP_SOLANA_RPC_URL=https://api.devnet.solana.com
REACT_APP_SOLANA_NETWORK=devnet

# CAPTCHA Configuration (Get from https://www.google.com/recaptcha/)
REACT_APP_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here

# IPFS/Bundlr Configuration
REACT_APP_BUNDLR_ADDRESS=https://devnet.bundlr.network
REACT_APP_BUNDLR_PROVIDER_URL=https://api.devnet.solana.com
```

### 3. Start Development Server

**Windows:**
```bash
scripts\start-dev.bat
```

**Linux/Mac:**
```bash
./scripts/start-dev.sh
```

**Manual:**
```bash
npm start
```

The app will be available at `http://localhost:3000`

## Production Deployment

### Vercel Deployment

1. **Connect Repository**
   - Go to [Vercel](https://vercel.com)
   - Import your Git repository
   - Vercel will auto-detect React settings

2. **Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from your `.env.local`:
     - `REACT_APP_SOLANA_RPC_URL`
     - `REACT_APP_SOLANA_NETWORK`
     - `REACT_APP_RECAPTCHA_SITE_KEY`
     - `REACT_APP_BUNDLR_ADDRESS`
     - `REACT_APP_BUNDLR_PROVIDER_URL`

3. **Deploy**
   - Click "Deploy" - Vercel handles the rest
   - Your app will be live at `https://your-app.vercel.app`

### Netlify Deployment

1. **Connect Repository**
   - Go to [Netlify](https://netlify.com)
   - Import your Git repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `build`

3. **Environment Variables**
   - Go to Site settings → Environment variables
   - Add all variables from your `.env.local`

4. **Deploy**
   - Netlify will auto-deploy on git push
   - Your app will be live at `https://your-app.netlify.app`

### Manual Deployment

1. **Build the App**
   ```bash
   npm run build
   ```

2. **Deploy Build Folder**
   - Upload the `build` folder to your hosting provider
   - Configure your server to serve `index.html` for all routes

## Solana Program Deployment

### Prerequisites

- Solana CLI installed
- Anchor CLI installed
- Some SOL in your wallet

### Deploy Program

1. **Install Solana CLI**
   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
   ```

2. **Install Anchor CLI**
   ```bash
   npm install -g @coral-xyz/anchor-cli
   ```

3. **Configure Solana**
   ```bash
   solana config set --url devnet
   solana-keygen new --outfile ~/.config/solana/id.json
   ```

4. **Get SOL for Deployment**
   ```bash
   solana airdrop 2
   ```

5. **Build and Deploy**
   ```bash
   anchor build
   anchor deploy
   ```

6. **Update Program ID**
   - Copy the program ID from deployment output
   - Update `programs/solana-messaging/src/lib.rs` with your program ID
   - Update `Anchor.toml` with your program ID

## Configuration Options

### Network Configuration

**Devnet (Recommended for Testing):**
```env
REACT_APP_SOLANA_RPC_URL=https://api.devnet.solana.com
REACT_APP_SOLANA_NETWORK=devnet
```

**Mainnet (Production):**
```env
REACT_APP_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
REACT_APP_SOLANA_NETWORK=mainnet-beta
```

**Custom RPC:**
```env
REACT_APP_SOLANA_RPC_URL=https://your-custom-rpc.com
REACT_APP_SOLANA_NETWORK=mainnet-beta
```

### CAPTCHA Configuration

1. Go to [Google reCAPTCHA](https://www.google.com/recaptcha/)
2. Create a new site
3. Choose reCAPTCHA v2
4. Add your domain(s)
5. Copy the site key to `REACT_APP_RECAPTCHA_SITE_KEY`

### Bundlr Configuration

For metadata storage, configure Bundlr:

**Devnet:**
```env
REACT_APP_BUNDLR_ADDRESS=https://devnet.bundlr.network
```

**Mainnet:**
```env
REACT_APP_BUNDLR_ADDRESS=https://node1.bundlr.network
```

## Troubleshooting

### Common Issues

**1. "Cannot find module" errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

**2. Wallet connection issues**
- Ensure you're using a supported wallet (Phantom, Solflare, Backpack)
- Check that you're on the correct network (devnet/mainnet)
- Clear browser cache and try again

**3. Transaction failures**
- Ensure you have enough SOL for gas fees
- Check that the recipient address is valid
- Verify network connectivity

**4. Build failures**
- Check Node.js version (requires 16+)
- Clear npm cache: `npm cache clean --force`
- Delete `node_modules` and reinstall

### Performance Optimization

**1. Enable Gzip Compression**
- Most hosting providers enable this automatically
- For manual setup, configure your server

**2. Optimize Images**
- Use WebP format for better compression
- Implement lazy loading for images

**3. Bundle Analysis**
```bash
npm install --save-dev webpack-bundle-analyzer
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

## Security Considerations

### Environment Variables
- Never commit `.env.local` to version control
- Use different keys for development and production
- Rotate keys regularly

### Wallet Security
- Never share private keys or seed phrases
- Use hardware wallets for large amounts
- Verify transaction details before signing

### Network Security
- Use HTTPS in production
- Implement proper CORS policies
- Validate all user inputs

## Monitoring and Analytics

### Error Tracking
Consider integrating:
- Sentry for error tracking
- Google Analytics for usage metrics
- Custom logging for transaction monitoring

### Performance Monitoring
- Lighthouse for performance audits
- Web Vitals for Core Web Vitals
- Real User Monitoring (RUM)

## Support

For deployment issues:
1. Check the troubleshooting section
2. Review the logs in your hosting platform
3. Create an issue in the repository
4. Join the Solana Discord for community support

## Next Steps

After successful deployment:
1. Test all functionality thoroughly
2. Set up monitoring and analytics
3. Configure custom domain (optional)
4. Set up automated deployments
5. Plan for scaling and optimization

---

Happy deploying! 🚀
