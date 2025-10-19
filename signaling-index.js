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
