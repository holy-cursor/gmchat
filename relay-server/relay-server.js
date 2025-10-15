/**
 * P2P Relay Server
 * Handles WebSocket connections for decentralized messaging
 * Deployable to any cloud provider
 */

const WebSocket = require('ws');
const http = require('http');
const url = require('url');

class P2PRelayServer {
  constructor(port = 8080) {
    this.port = port;
    this.clients = new Map(); // nodeId -> WebSocket
    this.messageQueue = new Map(); // recipient -> [messages]
    this.server = null;
    this.wss = null;
  }

  start() {
    this.server = http.createServer();
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on('connection', (ws, req) => {
      const query = url.parse(req.url, true).query;
      const nodeId = query.nodeId;
      
      if (!nodeId) {
        ws.close(1000, 'Node ID required');
        return;
      }

      console.log(`✅ Node connected: ${nodeId}`);
      this.clients.set(nodeId, ws);

      // Send queued messages for this node
      this.deliverQueuedMessages(nodeId);

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(nodeId, message, ws);
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      });

      ws.on('close', () => {
        console.log(`❌ Node disconnected: ${nodeId}`);
        this.clients.delete(nodeId);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${nodeId}:`, error);
        this.clients.delete(nodeId);
      });
    });

    this.server.listen(this.port, () => {
      console.log(`🚀 P2P Relay Server running on port ${this.port}`);
      console.log(`📡 WebSocket endpoint: ws://localhost:${this.port}`);
    });
  }

  handleMessage(senderNodeId, message, senderWs) {
    switch (message.type) {
      case 'discovery':
        this.handleDiscovery(senderNodeId, message.data, senderWs);
        break;
      case 'message':
        this.handleP2PMessage(senderNodeId, message.data);
        break;
      case 'ack':
        this.handleAck(senderNodeId, message.data);
        break;
      case 'ping':
        this.handlePing(senderNodeId, message.data, senderWs);
        break;
      default:
        console.warn(`Unknown message type: ${message.type}`);
    }
  }

  handleDiscovery(senderNodeId, nodeInfo, senderWs) {
    console.log(`🔍 Discovery from ${senderNodeId}:`, nodeInfo.nodeId);
    
    // Send our relay info back
    const relayInfo = {
      type: 'discovery',
      data: {
        nodeId: 'relay-server',
        walletAddress: 'relay-server',
        publicKey: 'relay-public-key',
        lastSeen: Date.now(),
        connectionAddress: `ws://localhost:${this.port}`
      },
      timestamp: Date.now()
    };

    senderWs.send(JSON.stringify(relayInfo));
  }

  handleP2PMessage(senderNodeId, message) {
    console.log(`📨 Message from ${senderNodeId} to ${message.recipient}:`, message.id);
    
    const recipientWs = this.clients.get(message.recipient);
    if (recipientWs && recipientWs.readyState === WebSocket.OPEN) {
      // Deliver immediately
      const messagePacket = {
        type: 'message',
        data: message,
        timestamp: Date.now(),
        from: senderNodeId
      };
      recipientWs.send(JSON.stringify(messagePacket));
      console.log(`✅ Message delivered to ${message.recipient}`);
    } else {
      // Queue for later delivery
      this.queueMessage(message.recipient, message);
      console.log(`📬 Message queued for ${message.recipient}`);
    }
  }

  handleAck(senderNodeId, ack) {
    console.log(`✅ ACK from ${senderNodeId} for message ${ack.messageId}`);
    // In production, this would update message delivery status
  }

  handlePing(senderNodeId, pingData, senderWs) {
    console.log(`🏓 PING from ${senderNodeId}`);
    const pong = {
      type: 'pong',
      data: { ...pingData, timestamp: Date.now() },
      timestamp: Date.now()
    };
    senderWs.send(JSON.stringify(pong));
  }

  queueMessage(recipient, message) {
    if (!this.messageQueue.has(recipient)) {
      this.messageQueue.set(recipient, []);
    }
    this.messageQueue.get(recipient).push(message);
  }

  deliverQueuedMessages(nodeId) {
    const queuedMessages = this.messageQueue.get(nodeId);
    if (queuedMessages && queuedMessages.length > 0) {
      const ws = this.clients.get(nodeId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log(`📬 Delivering ${queuedMessages.length} queued messages to ${nodeId}`);
        queuedMessages.forEach(message => {
          const messagePacket = {
            type: 'message',
            data: message,
            timestamp: Date.now(),
            from: 'relay-server'
          };
          ws.send(JSON.stringify(messagePacket));
        });
        this.messageQueue.delete(nodeId);
      }
    }
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      queuedMessages: Array.from(this.messageQueue.values()).reduce((total, queue) => total + queue.length, 0),
      uptime: process.uptime()
    };
  }

  stop() {
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
    console.log('🛑 P2P Relay Server stopped');
  }
}

// Start the server
const relayServer = new P2PRelayServer(process.env.PORT || 8080);
relayServer.start();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  relayServer.stop();
  process.exit(0);
});

// Health check endpoint
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      stats: relayServer.getStats(),
      timestamp: Date.now()
    }));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

healthServer.listen(8081, () => {
  console.log('🏥 Health check server running on port 8081');
});

module.exports = P2PRelayServer;
