/**
 * Simple WebRTC Signaling Server
 * Enables peer discovery for browser-to-browser P2P communication
 * Run with: node signaling-server.js
 */

const WebSocket = require('ws');
const http = require('http');
const url = require('url');

class SignalingServer {
  constructor(port = 9002) {
    this.port = port;
    this.rooms = new Map(); // roomId -> Set of peers
    this.peers = new Map(); // peerId -> peer info
    this.server = null;
    this.wss = null;
  }

  start() {
    // Create HTTP server
    this.server = http.createServer();
    
    // Create WebSocket server
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      const query = url.parse(req.url, true).query;
      const roomId = query.room || 'default';
      const peerId = query.peer || `peer_${Date.now()}`;

      console.log(`🔗 New peer connected: ${peerId} to room: ${roomId}`);

      // Store peer info
      const peerInfo = {
        ws,
        peerId,
        roomId,
        walletAddress: query.wallet || '',
        multiaddrs: query.multiaddrs ? JSON.parse(query.multiaddrs) : [],
        connectedAt: Date.now()
      };

      this.peers.set(peerId, peerInfo);

      // Add to room
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }
      this.rooms.get(roomId).add(peerId);

      // Send peer list to new peer
      const roomPeers = Array.from(this.rooms.get(roomId))
        .filter(p => p !== peerId)
        .map(p => {
          const peer = this.peers.get(p);
          return {
            peerId: peer.peerId,
            walletAddress: peer.walletAddress,
            multiaddrs: peer.multiaddrs,
            lastSeen: peer.connectedAt
          };
        });

      ws.send(JSON.stringify({
        type: 'peer-list',
        peers: roomPeers
      }));

      // Notify other peers in room about new peer
      this.rooms.get(roomId).forEach(p => {
        if (p !== peerId) {
          const peer = this.peers.get(p);
          if (peer && peer.ws.readyState === WebSocket.OPEN) {
            peer.ws.send(JSON.stringify({
              type: 'peer-joined',
              peerId: peerInfo.peerId,
              walletAddress: peerInfo.walletAddress,
              multiaddrs: peerInfo.multiaddrs
            }));
          }
        }
      });

      // Handle messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(peerId, roomId, message);
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        console.log(`🔌 Peer disconnected: ${peerId}`);
        this.handleDisconnect(peerId, roomId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`❌ WebSocket error for ${peerId}:`, error);
        this.handleDisconnect(peerId, roomId);
      });
    });

    // Start server
    this.server.listen(this.port, () => {
      console.log(`🚀 Signaling server running on port ${this.port}`);
      console.log(`📡 WebSocket endpoint: ws://localhost:${this.port}/ws`);
      console.log(`🔗 Connect with: ws://localhost:${this.port}/ws?room=gmchat&peer=YOUR_PEER_ID`);
    });
  }

  handleMessage(peerId, roomId, message) {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    switch (message.type) {
      case 'announce':
        // Update peer info
        peer.walletAddress = message.walletAddress || peer.walletAddress;
        peer.multiaddrs = message.multiaddrs || peer.multiaddrs;
        console.log(`📢 Peer announced: ${peerId} (${peer.walletAddress})`);
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        // Forward WebRTC signaling messages to target peer
        this.forwardToPeer(message.targetPeerId, message);
        break;

      default:
        console.log(`📨 Unknown message type: ${message.type}`);
    }
  }

  forwardToPeer(targetPeerId, message) {
    const targetPeer = this.peers.get(targetPeerId);
    if (targetPeer && targetPeer.ws.readyState === WebSocket.OPEN) {
      targetPeer.ws.send(JSON.stringify(message));
    } else {
      console.warn(`⚠️ Target peer not found or not connected: ${targetPeerId}`);
    }
  }

  handleDisconnect(peerId, roomId) {
    // Remove from room
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(peerId);
    }

    // Remove from peers
    this.peers.delete(peerId);

    // Notify other peers in room
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).forEach(p => {
        const peer = this.peers.get(p);
        if (peer && peer.ws.readyState === WebSocket.OPEN) {
          peer.ws.send(JSON.stringify({
            type: 'peer-left',
            peerId: peerId
          }));
        }
      });
    }
  }

  stop() {
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
    console.log('🛑 Signaling server stopped');
  }
}

// Start server if run directly
if (require.main === module) {
  const server = new SignalingServer(9002);
  server.start();

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down signaling server...');
    server.stop();
    process.exit(0);
  });
}

module.exports = SignalingServer;

