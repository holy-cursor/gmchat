#!/usr/bin/env node

const { createLibp2p } = require('libp2p');
const { webSockets } = require('@libp2p/websockets');
const { noise } = require('@libp2p/noise');
const { yamux } = require('@libp2p/yamux');
const { bootstrap } = require('@libp2p/bootstrap');
const { gossipsub } = require('@chainsafe/libp2p-gossipsub');
const { identify } = require('@libp2p/identify');
const { circuitRelayTransport } = require('@libp2p/circuit-relay-v2');
const { peerIdFromString } = require('@libp2p/peer-id');

const PUBSUB_PEER_DISCOVERY = 'parc3l-peer-discovery';

async function createRelay() {
  console.log('🚀 Starting Parc3l Relay Server...');

  // Create a stable peer ID for the relay
  const peerId = await peerIdFromString('12D3KooWQtCgYCZ7JZQoe7Ao6KP5CDMnmEiURqMoarfBgJwbnCPQ');

  const libp2p = await createLibp2p({
    peerId,
    addresses: {
      listen: [
        '/ip4/0.0.0.0/tcp/9001/ws',
        '/ip4/0.0.0.0/tcp/9002'
      ]
    },
    transports: [
      webSockets(),
      circuitRelayTransport()
    ],
    connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      identify: identify(),
      pubsub: gossipsub()
    }
  });

  // Set up event listeners
  libp2p.addEventListener('peer:connect', (evt) => {
    console.log('🔗 Peer connected:', evt.detail.toString());
  });

  libp2p.addEventListener('peer:disconnect', (evt) => {
    console.log('🔌 Peer disconnected:', evt.detail.toString());
  });

  // Start the relay
  await libp2p.start();

  console.log('✅ Relay server started successfully!');
  console.log('📋 Peer ID:', libp2p.peerId.toString());
  console.log('🌐 Multiaddrs:');
  libp2p.getMultiaddrs().forEach((addr) => {
    console.log('  ', addr.toString());
  });

  console.log('\n🔧 Relay Configuration:');
  console.log('  - WebSocket: ws://localhost:9001');
  console.log('  - TCP: tcp://localhost:9002');
  console.log('  - Circuit Relay: Enabled');
  console.log('  - GossipSub: Enabled');
  console.log('\n📱 Browser peers can connect using:');
  console.log('  /ip4/127.0.0.1/tcp/9001/ws/p2p/' + libp2p.peerId.toString());

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down relay server...');
    await libp2p.stop();
    console.log('✅ Relay server stopped');
    process.exit(0);
  });

  return libp2p;
}

// Start the relay
createRelay().catch((error) => {
  console.error('❌ Failed to start relay server:', error);
  process.exit(1);
});