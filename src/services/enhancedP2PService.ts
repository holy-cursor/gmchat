/**
 * Enhanced P2P Messaging Service
 * Combines GossipSub PubSub, WebRTC, WebTransport, and IPFS storage
 * Based on libp2p universal-connectivity approach
 */

import { createLibp2p } from 'libp2p';
import type { Libp2p } from '@libp2p/interface';
import { webRTC } from '@libp2p/webrtc';
// import { webRTCDirect } from '@libp2p/webrtc-direct'; // Not used
import { webTransport } from '@libp2p/webtransport';
// import { webSockets } from '@libp2p/websockets'; // Removed - causes browser issues
import { mplex } from '@libp2p/mplex';
import { noise } from '@libp2p/noise';
import { identify } from '@libp2p/identify';
import { circuitRelayTransport } from '@libp2p/circuit-relay-v2';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { gossipsub } from '@libp2p/gossipsub';
// import { bootstrap } from '@libp2p/bootstrap'; // Not used - we use signaling server for discovery
// import { pipe } from 'it-pipe'; // Not used
// import map from 'it-map'; // Not used
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string';
import { toString as uint8ArrayToString } from 'uint8arrays/to-string';
import { P2PMessage } from '../types/p2pMessage';
import { Message } from '../types';
import { WebRTCSignalingService } from './webrtcSignalingService';

export interface EnhancedP2PConfig {
  nodeId: string;
  enableP2P: boolean;
  maxConnections?: number;
  enableGossipSub?: boolean;
  enableIPFS?: boolean;
  enableWebRTC?: boolean;
  enableWebTransport?: boolean;
  enableCircuitRelay?: boolean;
  signalingServerUrl?: string;
}

export class EnhancedP2PService {
  private libp2p: Libp2p | null = null;
  private config: EnhancedP2PConfig;
  private isInitialized = false;
  private isInitializing = false;
  private messageHandlers: ((message: P2PMessage) => void)[] = [];
  private connectionCount = 0;
  private maxConnections = 10;
  private gossipSub: any = null;

  // IPFS integration
  private ipfsService: any = null;

  // Signaling service for peer discovery
  private signalingService: WebRTCSignalingService | null = null;
  private discoveredPeers = new Set<string>();

  constructor(config: EnhancedP2PConfig) {
    this.config = {
      maxConnections: 10,
      enableGossipSub: true,
      enableIPFS: true,
      ...config
    };
    this.maxConnections = this.config.maxConnections || 10;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || this.isInitializing) {
      console.log('⚠️ Enhanced P2P: Already initialized or initializing');
      return;
    }

    this.isInitializing = true;
    console.log('🚀 Enhanced P2P: Initializing with GossipSub + WebRTC + WebTransport...');

    try {
      // Create peer ID
      const peerId = await createEd25519PeerId();
      console.log('🆔 Enhanced P2P: Peer ID created:', peerId.toString());

      // Initialize IPFS service if enabled
      if (this.config.enableIPFS) {
        await this.initializeIPFS();
      }

      // Initialize signaling service for peer discovery
      if (this.config.signalingServerUrl) {
        console.log('🔗 Enhanced P2P: Signaling server URL provided, initializing...');
        await this.initializeSignaling();
      } else {
        console.log('⚠️ Enhanced P2P: No signaling server URL provided, skipping signaling');
      }

      // Create libp2p instance with enhanced configuration
      this.libp2p = await createLibp2p({
        addresses: {
          listen: [
            '/webrtc' // WebRTC for direct browser connections
          ]
        },
        transports: [
          webRTC(), // WebRTC for direct browser-to-browser connections
          webTransport(), // WebTransport for modern browsers
          circuitRelayTransport() // Circuit relay for NAT traversal
        ],
        streamMuxers: [mplex()],
        connectionEncrypters: [noise()],
        services: {
          identify: identify(),
          ...(this.config.enableGossipSub && {
            pubsub: gossipsub({
              allowPublishToZeroTopicPeers: true,
              emitSelf: false,
              messageProcessingConcurrency: 10
            })
          })
        },
        peerDiscovery: [
          // No bootstrap discovery - we use signaling server for peer discovery
        ],
        connectionManager: {
          maxConnections: this.maxConnections
        }
      });

      // Set up event handlers
      this.setupEventHandlers();

      // Start libp2p
      await this.libp2p.start();
      console.log('✅ Enhanced P2P: Started successfully');
      console.log('📡 Enhanced P2P: Listening on:', this.libp2p.getMultiaddrs().map(addr => addr.toString()));

      // Initialize GossipSub if enabled
      if (this.config.enableGossipSub) {
        await this.initializeGossipSub();
      }

      // Announce our peer to the signaling server now that libp2p is ready
      if (this.signalingService) {
        const multiaddrs = this.libp2p.getMultiaddrs().map(addr => addr.toString());
        this.signalingService.announcePeer(this.config.nodeId, multiaddrs);
        console.log('📢 Enhanced P2P: Announced peer to signaling server');
      }

      this.isInitialized = true;
      this.isInitializing = false;

    } catch (error) {
      this.isInitializing = false;
      console.error('❌ Enhanced P2P: Failed to initialize:', error);
      throw error;
    }
  }

  private async initializeIPFS(): Promise<void> {
    try {
      // Import IPFS service dynamically
      const { default: IPFSService } = await import('./ipfsStorageService');
      this.ipfsService = new IPFSService();
      console.log('✅ Enhanced P2P: IPFS service initialized');
    } catch (error) {
      console.warn('⚠️ Enhanced P2P: IPFS service not available:', error);
    }
  }

  private async initializeSignaling(): Promise<void> {
    try {
      console.log('🔗 Enhanced P2P: Initializing signaling service...');
      console.log('🔗 Enhanced P2P: Signaling URL:', this.config.signalingServerUrl);
      
      this.signalingService = new WebRTCSignalingService({
        signalingServerUrl: this.config.signalingServerUrl!,
        roomId: 'gmchat',
        peerId: this.config.nodeId
      });

      // Set up signaling message handlers
      this.signalingService.onMessage((message) => {
        this.handleSignalingMessage(message);
      });

      console.log('🔗 Enhanced P2P: Attempting to connect to signaling server...');
      await this.signalingService.connect();
      console.log('✅ Enhanced P2P: Signaling service initialized');

      // Don't announce yet - wait for libp2p to be fully initialized

    } catch (error) {
      console.warn('⚠️ Enhanced P2P: Signaling service not available:', error);
    }
  }

  private handleSignalingMessage(message: any): void {
    console.log('📨 Enhanced P2P: Received signaling message:', message.type, message);
    
    switch (message.type) {
      case 'peer-discovered':
        console.log('🔍 Enhanced P2P: Peer discovered event:', message.peer);
        // Only connect to actual browser peers, not bootstrap nodes
        if (this.isBrowserPeer(message.peer)) {
          console.log('🔍 Enhanced P2P: Browser peer discovered via signaling:', message.peer.peerId);
          this.discoveredPeers.add(message.peer.peerId);
          this.connectToDiscoveredPeer(message.peer);
        } else {
          console.log('⚠️ Enhanced P2P: Ignoring bootstrap node:', message.peer.peerId);
        }
        break;

      case 'peers-updated':
        console.log('📋 Enhanced P2P: Peers updated via signaling:', message.peers.length);
        console.log('📋 Enhanced P2P: Peers list:', message.peers);
        message.peers.forEach((peer: any) => {
          console.log('📋 Enhanced P2P: Checking peer:', peer);
          if (this.isBrowserPeer(peer)) {
            console.log('📋 Enhanced P2P: Adding browser peer:', peer.peerId);
            this.discoveredPeers.add(peer.peerId);
            this.connectToDiscoveredPeer(peer);
          } else {
            console.log('📋 Enhanced P2P: Ignoring non-browser peer:', peer.peerId);
          }
        });
        break;

      case 'peer-left':
        console.log('👋 Enhanced P2P: Peer left:', message.peerId);
        this.discoveredPeers.delete(message.peerId);
        break;

      default:
        // Forward other signaling messages (WebRTC offers, answers, ICE candidates)
        console.log('📨 Enhanced P2P: Signaling message:', message.type);
    }
  }

  private isBrowserPeer(peer: any): boolean {
    console.log('🔍 Enhanced P2P: Checking if peer is browser peer:', peer);
    
    // Check if this is a browser peer (not a bootstrap node)
    // Browser peers should have our nodeId prefix or be from signaling server
    if (!peer.peerId) {
      console.log('❌ Enhanced P2P: Peer has no peerId');
      return false;
    }
    
    // Check if it's a known bootstrap node
    const bootstrapNodes = [
      'QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
      'QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
      'QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
      'QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
    ];
    
    if (bootstrapNodes.includes(peer.peerId)) {
      console.log('❌ Enhanced P2P: Peer is bootstrap node:', peer.peerId);
      return false;
    }
    
    // Check if it has our nodeId prefix (browser peers)
    if (peer.peerId.startsWith('node_') || peer.peerId.startsWith('12D3KooW')) {
      console.log('✅ Enhanced P2P: Peer is browser peer (nodeId prefix):', peer.peerId);
      return true;
    }
    
    // If it has walletAddress, it's likely a browser peer
    if (peer.walletAddress) {
      console.log('✅ Enhanced P2P: Peer is browser peer (has walletAddress):', peer.peerId);
      return true;
    }
    
    console.log('❌ Enhanced P2P: Peer is not browser peer:', peer.peerId);
    return false;
  }

  private async connectToDiscoveredPeer(peer: any): Promise<void> {
    if (!this.libp2p) {
      return;
    }

    // For GossipSub, we don't need direct connections
    // Messages are delivered through the pubsub network
    console.log('🔗 Enhanced P2P: Peer discovered for GossipSub:', peer.peerId);
    
    // Try to connect if we have multiaddrs (optional)
    if (peer.multiaddrs && peer.multiaddrs.length > 0) {
      try {
        for (const multiaddr of peer.multiaddrs) {
          try {
            await this.libp2p.dial(multiaddr);
            console.log('✅ Enhanced P2P: Connected to discovered peer:', peer.peerId);
            break;
          } catch (error) {
            console.log('⚠️ Enhanced P2P: Failed to connect to', multiaddr, error instanceof Error ? error.message : String(error));
          }
        }
      } catch (error) {
        console.warn('⚠️ Enhanced P2P: Error connecting to discovered peer:', error);
      }
    } else {
      console.log('📡 Enhanced P2P: Using GossipSub for message delivery (no direct connection needed)');
    }
  }

  private async initializeGossipSub(): Promise<void> {
    if (!this.libp2p) return;

    try {
      this.gossipSub = this.libp2p.services.pubsub;
      
      // Subscribe to the main messaging topic
      await this.gossipSub.subscribe('gmchat-messages');
      console.log('📡 Enhanced P2P: Subscribed to gmchat-messages topic');
      
      // Wait for subscription to propagate (as recommended by libp2p community)
      console.log('⏳ Enhanced P2P: Waiting for subscription to propagate...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
      console.log('✅ Enhanced P2P: Subscription propagation delay complete');
      
      // Set up message handler using the correct GossipSub API
      console.log('🔧 Enhanced P2P: Setting up GossipSub event listeners...');
      
        // Use the working floodsub event listener approach with GossipSub
        const setupMessageListener = () => {
          console.log('🔧 Enhanced P2P: Setting up event listeners using working floodsub approach...');
          
          // Use the exact same approach as the working floodsub example
          if (this.libp2p && this.libp2p.services && this.libp2p.services.pubsub) {
            console.log('🔧 Enhanced P2P: Setting up libp2p.services.pubsub event listener (floodsub approach)...');
            const pubsub = this.libp2p.services.pubsub as any; // Cast to any to access addEventListener
            pubsub.addEventListener("message", (evt: any) => {
              console.log('📨 Enhanced P2P: Message received on topic:', evt.detail.topic);
              console.log('📨 Enhanced P2P: Raw data:', uint8ArrayToString(evt.detail.data));
              this.handleGossipSubMessage(evt);
            });
            console.log('✅ Enhanced P2P: Event listener set up successfully');
          } else {
            console.error('❌ Enhanced P2P: libp2p.services.pubsub not available');
          }
        };

        setupMessageListener();

      // Test the message handler with a dummy event (floodsub structure)
      console.log('🧪 Enhanced P2P: Testing message handler with floodsub structure...');
      const testEvent = {
        detail: {
          data: uint8ArrayFromString(JSON.stringify({
            id: 'test_msg',
            content: 'test message',
            sender: 'test_sender',
            recipient: 'test_recipient'
          })),
          topic: 'gmchat-messages'
        }
      };
      this.handleGossipSubMessage(testEvent);

      console.log('✅ Enhanced P2P: GossipSub initialized and subscribed to gmchat-messages');
    } catch (error) {
      console.error('❌ Enhanced P2P: Failed to initialize GossipSub:', error);
    }
  }

  private handleGossipSubMessage(evt: any): void {
    try {
      console.log('📨 Enhanced P2P: Processing message using floodsub approach...');
      
      // Use the exact same approach as the working floodsub example
      const messageData = evt.detail.data;
      const topic = evt.detail.topic;
      
      console.log('📨 Enhanced P2P: Topic:', topic);
      console.log('📨 Enhanced P2P: Raw data:', uint8ArrayToString(messageData));
      
      const messageString = uint8ArrayToString(messageData);
      const message = JSON.parse(messageString) as P2PMessage;
      
      console.log('📨 Enhanced P2P: Parsed message:', message.id, message.content);
      
      // Notify handlers
      console.log('📨 Enhanced P2P: Notifying', this.messageHandlers.length, 'message handlers');
      this.messageHandlers.forEach((handler, index) => {
        try {
          console.log(`📨 Enhanced P2P: Calling handler ${index + 1}/${this.messageHandlers.length}`);
          handler(message);
          console.log(`✅ Enhanced P2P: Handler ${index + 1} completed successfully`);
        } catch (error) {
          console.error(`❌ Enhanced P2P: Error in message handler ${index + 1}:`, error);
        }
      });
    } catch (error) {
      console.error('❌ Enhanced P2P: Error processing message:', error);
    }
  }

  private setupEventHandlers(): void {
    if (!this.libp2p) return;

    // Handle peer discovery
    this.libp2p.addEventListener('peer:discovery', (event) => {
      const peerId = event.detail.id;
      console.log(`🔍 Enhanced P2P: Peer discovered: ${peerId.toString()}`);
    });

    // Handle peer connections
    this.libp2p.addEventListener('peer:connect', (event) => {
      const peerId = event.detail;
      this.connectionCount++;
      console.log(`🔗 Enhanced P2P: Connected to peer ${peerId.toString()} (${this.connectionCount}/${this.maxConnections})`);
    });

    this.libp2p.addEventListener('peer:disconnect', (event) => {
      const peerId = event.detail;
      this.connectionCount = Math.max(0, this.connectionCount - 1);
      console.log(`🔌 Enhanced P2P: Disconnected from peer ${peerId.toString()} (${this.connectionCount}/${this.maxConnections})`);
    });

    // Handle incoming streams (for direct connections)
    this.libp2p.handle('/gmchat/1.0.0', async ({ stream, connection }) => {
      console.log('📨 Enhanced P2P: Received direct message stream from', connection.remotePeer.toString());

      try {
        // Read from stream directly
        const chunks: Uint8Array[] = [];
        for await (const chunk of stream.source) {
          chunks.push(chunk);
        }
        
        const messageData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          messageData.set(chunk, offset);
          offset += chunk.length;
        }
        
        const messageText = uint8ArrayToString(messageData);
        const message = JSON.parse(messageText) as P2PMessage;
        console.log('📨 Enhanced P2P: Received direct message:', message.id);

        // Notify handlers
        this.messageHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('❌ Enhanced P2P: Error in message handler:', error);
          }
        });
      } catch (error) {
        console.error('❌ Enhanced P2P: Error processing direct message stream:', error);
      }
    });
  }

  async sendMessage(recipient: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): Promise<string> {
    if (!this.libp2p || !this.isInitialized) {
      throw new Error('Enhanced P2P not initialized');
    }

    try {
      // Create message
      const message: P2PMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId: `thread_${this.libp2p.peerId.toString()}_${recipient}`,
        sequence: 1,
        sender: this.libp2p.peerId.toString(),
        recipient: recipient,
        content: content,
        contentType: messageType,
        encryptionKey: '',
        nonce: '',
        timestamp: Date.now(),
        ttl: 86400,
        deliveryStatus: 'delivered',
        acks: [],
        storageLocation: 'hot',
        signature: ''
      };

            // Try GossipSub first (decentralized messaging)
            if (this.gossipSub) {
              try {
                console.log('📤 Enhanced P2P: Publishing message to GossipSub topic: gmchat-messages');
                console.log('📤 Enhanced P2P: Message data:', JSON.stringify(message));
                
                // Add a small delay to ensure network is ready
                await new Promise(resolve => setTimeout(resolve, 100));
                
                const messageData = uint8ArrayFromString(JSON.stringify(message));
                await this.gossipSub.publish('gmchat-messages', messageData);
                console.log('✅ Enhanced P2P: Message sent via GossipSub:', message.id);
                 
                 // Store in IPFS for persistence
                 if (this.ipfsService) {
                   await this.storeMessageInIPFS(message);
                 }
                 
                 return message.id;
               } catch (gossipError) {
                 console.warn('⚠️ Enhanced P2P: GossipSub failed, trying direct connection:', gossipError);
               }
             }

      // No direct connections - just use IPFS for persistence
      console.log('📦 Enhanced P2P: Storing message in IPFS for persistence');
      
      if (this.ipfsService) {
        const messageId = await this.storeMessageInIPFS(message);
        return messageId;
      } else {
        throw new Error('IPFS service not available');
      }

    } catch (error) {
      console.error('❌ Enhanced P2P: Failed to send message:', error);
      throw error;
    }
  }

  private async storeMessageInIPFS(message: P2PMessage): Promise<string> {
    if (!this.ipfsService) {
      throw new Error('IPFS service not available');
    }

    try {
      // Convert P2P message to regular message format
      const regularMessage: Message = {
        id: message.id,
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        messageType: message.contentType as 'text' | 'image' | 'file',
        timestamp: message.timestamp,
        transactionSignature: message.signature,
        isEncrypted: true,
        encryptedContent: message.content,
        nonce: message.nonce,
        publicKey: message.encryptionKey,
        ipfsHash: message.ipfsCid
      };

      // Store in IPFS
      const ipfsHash = await this.ipfsService.storeMessage(regularMessage);
      console.log('✅ Enhanced P2P: Message stored in IPFS:', ipfsHash);
      
      return message.id;
    } catch (error) {
      console.error('❌ Enhanced P2P: Failed to store message in IPFS:', error);
      throw error;
    }
  }

  onMessage(handler: (message: P2PMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  getConnectionStatus(): { connected: boolean; peerCount: number; maxConnections: number } {
    const discoveredPeerCount = this.discoveredPeers.size;
    const libp2pPeerCount = this.libp2p ? this.libp2p.getConnections().length : 0;
    
    // For GossipSub, we count discovered peers (signaling) + libp2p connections
    const totalPeerCount = discoveredPeerCount + libp2pPeerCount;
    
    console.log('📊 Enhanced P2P: Connection status:', {
      discoveredPeers: discoveredPeerCount,
      libp2pConnections: libp2pPeerCount,
      totalPeers: totalPeerCount,
      maxConnections: this.maxConnections
    });
    
    return {
      connected: this.isInitialized && this.libp2p !== null,
      peerCount: totalPeerCount,
      maxConnections: this.maxConnections
    };
  }

  getPeerId(): string | null {
    return this.libp2p ? this.libp2p.peerId.toString() : null;
  }

  getConnectedPeers(): string[] {
    return this.libp2p ? this.libp2p.getPeers().map(peer => peer.toString()) : [];
  }

  isReady(): boolean {
    return this.isInitialized && this.libp2p !== null;
  }

  // No multiaddrs needed - just use GossipSub + IPFS

  // No direct peer connections - just use GossipSub + IPFS

  async cleanup(): Promise<void> {
    if (this.libp2p) {
      console.log('🧹 Enhanced P2P: Cleaning up...');
      await this.libp2p.stop();
      this.libp2p = null;
    }
    this.isInitialized = false;
    this.connectionCount = 0;
    this.messageHandlers = [];
    this.gossipSub = null;
  }
}

export default EnhancedP2PService;
