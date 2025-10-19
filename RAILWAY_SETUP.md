# Railway Configuration for Signaling Server Only

## Option 1: Use Railway's Nixpacks (Recommended)

Create a `railway.json` file in your project root:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm run signaling",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Option 2: Use Dockerfile

If Nixpacks doesn't work, use the Dockerfile approach:

1. Create `Dockerfile.signaling` (already created)
2. In Railway dashboard, set the Dockerfile path to `Dockerfile.signaling`

## Option 3: Separate Repository (Cleanest)

Create a separate repository just for the signaling server:

1. Create new GitHub repository: `gmchat-signaling-server`
2. Copy only these files:
   - `signaling-server.js`
   - `package.signaling.json` (rename to `package.json`)
   - `railway.json`
3. Deploy this repository to Railway

## Environment Variables

In Railway dashboard, set:
- `PORT`: `9002` (Railway will set this automatically)
- `NODE_ENV`: `production`

## Testing

After deployment, test the signaling server:
```bash
# Test WebSocket connection
wscat -c wss://your-railway-url.com/ws?room=test&peer=test-peer
```

## Update Frontend

Once you have the Railway URL, update `p2pIntegrationService.ts`:

```typescript
signalingServerUrl: process.env.NODE_ENV === 'production' 
  ? 'wss://your-railway-url.com' // Your actual Railway URL
  : 'ws://localhost:9002'
```
