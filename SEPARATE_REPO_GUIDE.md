# Create Separate Signaling Server Repository

## Step 1: Create New GitHub Repository

1. **Go to GitHub** and create a new repository called `gmchat-signaling-server`
2. **Make it public** (so Railway can access it)
3. **Don't initialize** with README, .gitignore, or license

## Step 2: Create Local Directory

```bash
mkdir gmchat-signaling-server
cd gmchat-signaling-server
```

## Step 3: Copy These Files

Copy these files from your main project to the new directory:

### `package.json`
```json
{
  "name": "gmchat-signaling-server",
  "version": "1.0.0",
  "description": "WebRTC Signaling Server for GMChat",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "ws": "^8.14.2"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

### `index.js`
```javascript
const WebSocket = require('ws');

class SignalingServer {
  constructor(port) {
    this.wss = new WebSocket.Server({ port });
    this.rooms = new Map(); // roomId -> Map<peerId, { ws: WebSocket, peerInfo: PeerInfo }>
    this.peers = new Map(); // peerId -> PeerInfo (stores more detailed info)

    this.wss.on('connection', this.handleConnection.bind(this));
    console.log(`🚀 Signaling server running on port ${port}`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${port}/ws`);
    console.log(`🔗 Connect with: ws://localhost:${port}/ws?room=gmchat&peer=YOUR_PEER_ID`);
  }

  handleConnection(ws, req) {
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const roomId = urlParams.get('room');
    const peerId = urlParams.get('peer');

    if (!roomId || !peerId) {
      console.log('❌ Signaling: Connection rejected: Missing room ID or peer ID');
      ws.close(1008, 'Missing room ID or peer ID');
      return;
    }

    console.log(`🔗 New peer connected: ${peerId} to room: ${roomId}`);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
    }

    const peerInfo = {
      peerId,
      walletAddress: '', // Will be updated by 'announce' message
      multiaddrs: [],    // Will be updated by 'announce' message
      connectedAt: Date.now(),
      ws // Store the WebSocket connection
    };
    this.rooms.get(roomId).set(peerId, peerInfo);
    this.peers.set(peerId, peerInfo); // Also store in global peers map

    // Notify existing peers in the room about the new peer
    this.rooms.get(roomId).forEach((pInfo, pId) => {
      if (pId !== peerId && pInfo.ws.readyState === WebSocket.OPEN) {
        pInfo.ws.send(JSON.stringify({
          type: 'peer-discovered',
          peer: {
            peerId: peerInfo.peerId,
            walletAddress: peerInfo.walletAddress,
            multiaddrs: peerInfo.multiaddrs
          }
        }));
      }
    });

    // Send current list of peers to the newly connected peer
    const roomPeers = Array.from(this.rooms.get(roomId).values())
      .filter(p => p.peerId !== peerId) // Exclude self
      .map(peer => ({
        peerId: peer.peerId,
        walletAddress: peer.walletAddress,
        multiaddrs: peer.multiaddrs,
        lastSeen: peer.connectedAt
      }));

    ws.send(JSON.stringify({
      type: 'peers-updated',
      peers: roomPeers
    }));

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleMessage(peerId, roomId, message);
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      console.log(`🔌 Peer disconnected: ${peerId}`);
      this.handleDisconnect(peerId, roomId);
    });

    ws.on('error', (error) => {
      console.error(`❌ WebSocket error for ${peerId}:`, error);
      this.handleDisconnect(peerId, roomId);
    });
  }

  handleMessage(senderPeerId, roomId, message) {
    if (message.type === 'announce') {
      // Update peer info with multiaddrs and walletAddress
      const peer = this.peers.get(senderPeerId);
      if (peer) {
        peer.walletAddress = message.walletAddress;
        peer.multiaddrs = message.multiaddrs;
        peer.lastSeen = Date.now();
        console.log(`📢 Peer announced: ${senderPeerId} (${peer.walletAddress})`);

        // Broadcast updated peer list to all clients in the room
        const updatedPeers = Array.from(this.rooms.get(roomId).values())
          .filter(p => p.peerId !== senderPeerId) // Exclude self
          .map(p => ({
            peerId: p.peerId,
            walletAddress: p.walletAddress,
            multiaddrs: p.multiaddrs,
            lastSeen: p.lastSeen
          }));

        this.rooms.get(roomId).forEach((pInfo) => {
          if (pInfo.ws.readyState === WebSocket.OPEN) {
            pInfo.ws.send(JSON.stringify({ type: 'peers-updated', peers: updatedPeers }));
          }
        });
      }
    } else {
      // Forward other messages (e.g., WebRTC offers, answers, ICE candidates)
      this.rooms.get(roomId).forEach((peerInfo, currentPeerId) => {
        if (currentPeerId !== senderPeerId && peerInfo.ws.readyState === WebSocket.OPEN) {
          peerInfo.ws.send(JSON.stringify({ ...message, senderPeerId }));
        }
      });
    }
  }

  handleDisconnect(peerId, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(peerId);
      this.peers.delete(peerId); // Remove from global map too

      // Notify remaining peers that this peer left
      this.rooms.get(roomId).forEach((peerInfo) => {
        if (peerInfo.ws.readyState === WebSocket.OPEN) {
          peerInfo.ws.send(JSON.stringify({ type: 'peer-left', peerId }));
        }
      });

      if (this.rooms.get(roomId).size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }
}

// Use PORT from environment variables or default to 9002
const PORT = process.env.PORT || 9002;
new SignalingServer(PORT);
```

### `README.md`
```markdown
# GMChat Signaling Server

WebRTC signaling server for GMChat P2P messaging.

## Deploy to Railway

1. Connect this repository to Railway
2. Railway will automatically detect it's a Node.js app
3. Deploy!

## Environment Variables

Railway automatically sets:
- `PORT` - The port the server runs on

## Testing

Test the WebSocket connection:
```bash
wscat -c wss://your-railway-url.com/ws?room=test&peer=test-peer
```
```

## Step 4: Initialize Git and Push

```bash
git init
git add .
git commit -m "Initial commit: GMChat signaling server"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gmchat-signaling-server.git
git push -u origin main
```

## Step 5: Deploy to Railway

1. **Go to Railway.app**
2. **Create new project**
3. **Deploy from GitHub repo**
4. **Select `gmchat-signaling-server`**
5. **Deploy!**

## Step 6: Update Frontend

Once you have the Railway URL, update `src/services/p2pIntegrationService.ts`:

```typescript
signalingServerUrl: process.env.NODE_ENV === 'production' 
  ? 'wss://your-railway-url.com' // Your actual Railway URL
  : 'ws://localhost:9002'
```

## Step 7: Redeploy Frontend

Redeploy your main app to Vercel with the updated signaling server URL.
