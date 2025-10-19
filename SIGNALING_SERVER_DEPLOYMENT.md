# Signaling Server Deployment Guide

## 🚀 Quick Deploy to Railway (Recommended)

### Step 1: Create Railway Account
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Connect your GitHub account

### Step 2: Deploy Signaling Server
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your `gmchat` repository
4. Railway will auto-detect it's a Node.js project
5. Set the **Root Directory** to `.` (current directory)
6. Railway will automatically run `npm install` and `npm start`

### Step 3: Configure Environment Variables
In Railway dashboard, go to your project → Variables:
- `PORT`: `9002` (Railway will set this automatically)
- `NODE_ENV`: `production`

### Step 4: Get Your Railway URL
1. Go to your project → Settings → Domains
2. Copy the Railway URL (e.g., `gmchat-signaling-production.up.railway.app`)
3. Update the signaling server URL in your code:

```typescript
signalingServerUrl: process.env.NODE_ENV === 'production' 
  ? 'wss://gmchat-signaling-production.up.railway.app' // Your Railway URL
  : 'ws://localhost:9002' // Local development
```

## 🔧 Alternative: Deploy to Render

### Step 1: Create Render Account
1. Go to [render.com](https://render.com)
2. Sign up with GitHub

### Step 2: Deploy Signaling Server
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - **Name**: `gmchat-signaling`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run signaling`
   - **Port**: `9002`

### Step 3: Get Your Render URL
1. After deployment, copy the Render URL
2. Update your code with the Render URL

## 🧪 Testing

### Local Testing
```bash
npm run signaling
# Open two browsers to localhost:3000
# Both should connect via ws://localhost:9002
```

### Production Testing
1. Deploy signaling server to Railway/Render
2. Deploy frontend to Vercel
3. Open two browsers to Vercel URL
4. Both should connect via wss://your-signaling-server.com

## 📝 Important Notes

- **WebSocket URLs**: Use `ws://` for local, `wss://` for production
- **CORS**: Railway/Render handle CORS automatically
- **Port**: Railway/Render will set the PORT environment variable
- **HTTPS**: Production signaling servers must use WSS (secure WebSocket)

## 🔍 Troubleshooting

### Signaling Server Not Connecting
- Check Railway/Render logs for errors
- Verify the URL is correct (wss:// not ws://)
- Ensure the signaling server is running

### Peers Not Discovering Each Other
- Check browser console for WebSocket connection errors
- Verify both browsers are connecting to the same signaling server
- Check signaling server logs for peer connections

### Production vs Development
- **Development**: `ws://localhost:9002`
- **Production**: `wss://your-deployed-server.com`
