# IPFS Setup Guide

This guide will help you set up real IPFS storage for your P2P messaging app using Pinata.

## 🚀 Quick Setup

### 1. Get Pinata API Keys

1. Go to [Pinata Cloud](https://app.pinata.cloud/)
2. Sign up for a free account
3. Navigate to "API Keys" in your dashboard
4. Create a new API key with the following permissions:
   - `pinFileToIPFS` - Upload files to IPFS
   - `pinJSONToIPFS` - Upload JSON data to IPFS
   - `unpin` - Remove pins from IPFS
   - `getPinList` - List your pins

### 2. Configure Environment Variables

1. Copy `env.example` to `.env`:
   ```bash
   cp env.example .env
   ```

2. Edit `.env` and add your Pinata credentials:
   ```env
   REACT_APP_PINATA_API_KEY=your_actual_api_key_here
   REACT_APP_PINATA_SECRET_KEY=your_actual_secret_key_here
   ```

### 3. Restart the Application

```bash
npm start
```

## ✅ Verification

Once configured, you should see these logs in the console:

```
✅ IPFS: Pinata client initialized successfully
✅ IPFS: Authentication test passed: { authenticated: true }
```

## 🔧 How It Works

### Message Storage Flow:
1. **P2P Message Created** → Encrypted with AES-256
2. **Upload to Pinata** → Stored on IPFS with metadata
3. **Pinata Gateway** → Content accessible via `https://gateway.pinata.cloud/ipfs/{cid}`
4. **Local Cache** → Fast retrieval for recent messages

### Benefits:
- **Decentralized Storage**: Messages stored on IPFS network
- **Permanent**: Content persists even if your app goes down
- **Censorship Resistant**: No single point of failure
- **Fast Retrieval**: Pinata's global CDN for quick access

## 🆓 Free Tier Limits

Pinata's free tier includes:
- **1GB storage**
- **10,000 API calls/month**
- **Unlimited bandwidth**

This is perfect for development and small-scale messaging apps.

## 🔒 Security Features

- **End-to-End Encryption**: All messages encrypted before IPFS storage
- **Metadata Protection**: Sensitive data not stored in IPFS metadata
- **Access Control**: Only your app can decrypt the content
- **No Data Leakage**: IPFS only stores encrypted content

## 🚨 Troubleshooting

### "No Pinata credentials found"
- Check your `.env` file has the correct variable names
- Ensure no extra spaces or quotes around the values
- Restart the development server after changes

### "Authentication test failed"
- Verify your API keys are correct
- Check that your Pinata account is active
- Ensure the API key has the required permissions

### "Failed to store message in IPFS"
- Check your internet connection
- Verify Pinata service status
- Check your API usage limits

## 📚 Additional Resources

- [Pinata Documentation](https://docs.pinata.cloud/)
- [IPFS Documentation](https://docs.ipfs.io/)
- [Pinata API Reference](https://docs.pinata.cloud/api-reference)

## 🔄 Fallback Mode

If IPFS is not configured or fails, the app automatically falls back to:
- **Mock IPFS**: Simulated storage for development
- **Local Cache**: Messages stored in browser memory
- **P2P Relay**: Messages still work via WebSocket relay

This ensures your app always works, even without IPFS configuration!
