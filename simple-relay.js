#!/usr/bin/env node

const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Store connected peers
const peers = new Map();

wss.on('connection', (ws, req) => {
  const peerId = req.url.split('?peerId=')[1] || `peer_${Date.now()}`;
  
  console.log(`🔗 New peer connected: ${peerId}`);
  
  // Store peer connection
  peers.set(peerId, {
    ws,
    connectedAt: Date.now(),
    lastSeen: Date.now()
  });

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'welcome',
    peerId: peerId,
    message: 'Connected to Parc3l Relay Server',
    timestamp: Date.now()
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 Message from ${peerId}:`, message.type);
      
      // Broadcast to all other peers
      peers.forEach((peer, id) => {
        if (id !== peerId && peer.ws.readyState === WebSocket.OPEN) {
          peer.ws.send(JSON.stringify({
            ...message,
            fromPeer: peerId,
            timestamp: Date.now()
          }));
        }
      });
    } catch (error) {
      console.error(`❌ Error processing message from ${peerId}:`, error);
    }
  });

  // Handle peer disconnect
  ws.on('close', () => {
    console.log(`🔌 Peer disconnected: ${peerId}`);
    peers.delete(peerId);
  });

  // Handle errors
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${peerId}:`, error);
    peers.delete(peerId);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    peers: peers.size,
    uptime: process.uptime()
  });
});

// Start server
const PORT = process.env.PORT || 9001;
server.listen(PORT, () => {
  console.log('🚀 Parc3l Simple Relay Server started!');
  console.log(`📡 WebSocket server running on ws://localhost:${PORT}/ws`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`👥 Connected peers: ${peers.size}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down relay server...');
  server.close(() => {
    console.log('✅ Relay server stopped');
    process.exit(0);
  });
});
