# GMChat Signaling Server - Clean Deployment

This is a minimal signaling server for GMChat P2P messaging. It only includes the essential dependencies needed to run the WebRTC signaling server.

## Quick Deploy to Railway

### Option 1: Deploy from this repository
1. **Create new Railway project**
2. **Connect to this repository**
3. **Railway will automatically detect it's a Node.js app**
4. **Set environment variables:**
   - `PORT`: `9002` (Railway sets this automatically)
5. **Deploy!**

### Option 2: Create separate repository (Recommended)
1. **Create new GitHub repository:** `gmchat-signaling-server`
2. **Copy these files:**
   - `signaling-server-clean.js` → `index.js`
   - `package-signaling-clean.json` → `package.json`
3. **Deploy to Railway**

## Files Included

- `signaling-server-clean.js` - Clean signaling server (no React dependencies)
- `package-signaling-clean.json` - Minimal package.json with only `ws` dependency

## Testing

After deployment, test the signaling server:
```bash
# Test WebSocket connection
wscat -c wss://your-railway-url.com/ws?room=test&peer=test-peer
```

## Update Frontend

Once you have the Railway URL, update `src/services/p2pIntegrationService.ts`:

```typescript
signalingServerUrl: process.env.NODE_ENV === 'production' 
  ? 'wss://your-railway-url.com' // Your actual Railway URL
  : 'ws://localhost:9002'
```

## Environment Variables

Railway will automatically set:
- `PORT` - The port the server runs on
- `NODE_ENV` - Set to `production`

No additional environment variables needed!
