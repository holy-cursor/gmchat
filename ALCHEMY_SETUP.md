# Alchemy Setup Instructions

## Step 1: Get Your Alchemy API Key

1. Go to [alchemy.com](https://www.alchemy.com/)
2. Sign up for a free account
3. Click "Create App"
4. Select "Ethereum" and "Sepolia" testnet
5. Copy your API key (looks like: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`)

## Step 2: Update the Code

Replace `YOUR_API_KEY_HERE` in these files with your actual API key:

### File: `src/types/evm.ts` (Line 173)
```typescript
rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/YOUR_ACTUAL_API_KEY',
```

### File: `src/services/evmService.ts` (Line 42)
```typescript
const alchemyUrl = 'https://eth-sepolia.g.alchemy.com/v2/YOUR_ACTUAL_API_KEY';
```

## Step 3: Test

After updating both files with your API key, the EVM messaging should work reliably with Alchemy's infrastructure!

## Benefits

- ✅ No more RPC errors
- ✅ 99.9%+ uptime
- ✅ Fast and reliable
- ✅ Free tier available
