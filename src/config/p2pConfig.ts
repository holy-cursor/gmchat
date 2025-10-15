/**
 * P2P Configuration
 * Real infrastructure endpoints for production use
 */

export const P2P_CONFIG = {
  // Real IPFS endpoints (CORS-enabled)
  IPFS: {
    gateway: 'https://gateway.pinata.cloud/ipfs/',
    apiEndpoint: 'https://api.pinata.cloud',
    pinningService: 'https://api.pinata.cloud',
    pinningToken: process.env.REACT_APP_PINATA_TOKEN || undefined,
    pinataApiKey: process.env.REACT_APP_PINATA_API_KEY || undefined,
    pinataSecretKey: process.env.REACT_APP_PINATA_SECRET_KEY || undefined
  },

  // Working WebSocket relay nodes for P2P messaging
  RELAY_NODES: [
    'wss://relay.damus.io',           // Nostr relay (supports P2P messaging)
    'wss://relay.snort.social',       // Nostr relay
    'wss://nos.lol',                  // Nostr relay
    'wss://relay.nostr.band'          // Nostr relay
  ],

  // Bootstrap nodes for discovery (libp2p bootstrap nodes)
  BOOTSTRAP_NODES: [
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5ZphtjSvhHxLjeqN2oyPqdRLxvo5sRg'
  ],

  // STUN/TURN servers for WebRTC
  ICE_SERVERS: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],

  // WebRTC configuration
  WEBRTC: {
    enableSTUN: true,
    enableTURN: false, // Would need TURN server for production
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  },

  // Network settings
  NETWORK: {
    connectionTimeout: 5000,
    pingInterval: 30000,
    maxRetries: 3,
    retryDelay: 1000
  },

  // Message settings
  MESSAGE: {
    maxSize: 1024 * 1024, // 1MB
    ttl: 30 * 24 * 60 * 60 * 1000, // 30 days
    maxQueueSize: 100
  }
};

export default P2P_CONFIG;