/**
 * libp2p Messaging Service
 * Properly configured for cross-device P2P messaging
 * Optimized to prevent performance issues
 */

import { createLibp2p } from 'libp2p';
import type { Libp2p } from '@libp2p/interface';
import { webSockets } from '@libp2p/websockets';
import { webRTC } from '@libp2p/webrtc';
import { mplex } from '@libp2p/mplex';
import { noise } from '@libp2p/noise';
import { bootstrap } from '@libp2p/bootstrap';
import { createEd25519PeerId } from '@libp2p/peer-id-factory';
import { P2PMessage } from '../types/p2pMessage';

export interface Libp2pConfig {
  nodeId: string;
  enableP2P: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
}

export class Libp2pMessagingService {
  private libp2p: Libp2p | null = null;
  private config: Libp2pConfig;
  private isInitialized = false;
  private isInitializing = false;
  private messageHandlers: ((message: P2PMessage) => void)[] = [];
  private connectionCount = 0;
  private maxConnections = 10; // Limit connections to prevent performance issues

  constructor(config: Libp2pConfig) {
    this.config = {
      maxConnections: 10,
      connectionTimeout: 10000,
      ...config
    };
    this.maxConnections = this.config.maxConnections || 10;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || this.isInitializing) {
      console.log('⚠️ libp2p: Already initialized or initializing');
      return;
    }

    this.isInitializing = true;
    console.log('🚀 libp2p: Initializing P2P service...');

    try {
      // Create peer ID
      const peerId = await createEd25519PeerId();
      console.log('🆔 libp2p: Peer ID created:', peerId.toString());

      // Create libp2p instance with optimized configuration
      this.libp2p = await createLibp2p({
        addresses: {
          listen: [
            '/ip4/0.0.0.0/tcp/0/ws',
            '/webrtc'
          ]
        },
        transports: [
          webSockets(),
          webRTC()
        ],
        streamMuxers: [mplex()],
        connectionEncrypters: [noise()],
        peerDiscovery: [
          bootstrap({
            list: [
              // Use fewer, more reliable bootstrap nodes
              '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
              '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa'
            ]
          })
        ],
        connectionManager: {
          maxConnections: this.maxConnections
        }
      });

      // Set up event handlers
      this.setupEventHandlers();

      // Start libp2p
      await this.libp2p.start();
      console.log('✅ libp2p: Started successfully');
      console.log('📡 libp2p: Listening on:', this.libp2p.getMultiaddrs().map(addr => addr.toString()));

      this.isInitialized = true;
      this.isInitializing = false;

    } catch (error) {
      this.isInitializing = false;
      console.error('❌ libp2p: Failed to initialize:', error);
      throw error;
    }
  }

  private setupEventHandlers(): void {
    if (!this.libp2p) return;

    // Handle peer connections
    this.libp2p.addEventListener('peer:connect', (event) => {
      const peerId = event.detail;
      this.connectionCount++;
      console.log(`🔗 libp2p: Connected to peer ${peerId.toString()} (${this.connectionCount}/${this.maxConnections})`);
    });

    this.libp2p.addEventListener('peer:disconnect', (event) => {
      const peerId = event.detail;
      this.connectionCount = Math.max(0, this.connectionCount - 1);
      console.log(`🔌 libp2p: Disconnected from peer ${peerId.toString()} (${this.connectionCount}/${this.maxConnections})`);
    });

    // Handle incoming streams
    this.libp2p.handle('/gmchat/1.0.0', async ({ stream, connection }) => {
      console.log('📨 libp2p: Received message stream from', connection.remotePeer.toString());
      
      try {
        const chunks: Uint8Array[] = [];
        
        // Read from the stream as an async iterable
        for await (const chunk of stream) {
          chunks.push(chunk);
        }
        
        const messageData = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          messageData.set(chunk, offset);
          offset += chunk.length;
        }
        
        const messageText = new TextDecoder().decode(messageData);
        const message = JSON.parse(messageText) as P2PMessage;
        
        console.log('📨 libp2p: Received message:', message.id);
        
        // Notify handlers
        this.messageHandlers.forEach(handler => {
          try {
            handler(message);
          } catch (error) {
            console.error('❌ libp2p: Error in message handler:', error);
          }
        });
        
      } catch (error) {
        console.error('❌ libp2p: Error processing message stream:', error);
      }
    });
  }

  async sendMessage(recipient: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): Promise<string> {
    if (!this.libp2p || !this.isInitialized) {
      throw new Error('libp2p not initialized');
    }

    try {
      // Find recipient peer
      const peers = this.libp2p.getPeers();
      const recipientPeer = peers.find(peer => peer.toString().includes(recipient.slice(2, 10)));
      
      if (!recipientPeer) {
        console.log('⚠️ libp2p: Recipient not found in connected peers, broadcasting...');
        // For now, we'll broadcast to all connected peers
        // In a real implementation, you'd need a peer discovery mechanism
        return this.broadcastMessage(recipient, content, messageType);
      }

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

      // Send message
      const stream = await this.libp2p.dialProtocol(recipientPeer, '/gmchat/1.0.0');
      const messageData = new TextEncoder().encode(JSON.stringify(message));
      
      // Use the new send method
      await stream.send(messageData);
      await stream.close();

      console.log('✅ libp2p: Message sent successfully:', message.id);
      return message.id;

    } catch (error) {
      console.error('❌ libp2p: Failed to send message:', error);
      throw error;
    }
  }

  private async broadcastMessage(recipient: string, content: string, messageType: 'text' | 'image' | 'file'): Promise<string> {
    if (!this.libp2p) throw new Error('libp2p not initialized');

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

    const peers = this.libp2p.getPeers();
    const messageData = new TextEncoder().encode(JSON.stringify(message));

    // Send to all connected peers
    for (const peer of peers) {
      try {
        const stream = await this.libp2p.dialProtocol(peer, '/gmchat/1.0.0');
        
        // Use the new send method
        await stream.send(messageData);
        await stream.close();
        
        console.log(`📤 libp2p: Broadcasted to peer ${peer.toString()}`);
      } catch (error) {
        console.warn(`⚠️ libp2p: Failed to broadcast to peer ${peer.toString()}:`, error);
      }
    }

    return message.id;
  }

  onMessage(handler: (message: P2PMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  getConnectionStatus(): { connected: boolean; peerCount: number; maxConnections: number } {
    return {
      connected: this.isInitialized && this.libp2p !== null,
      peerCount: this.connectionCount,
      maxConnections: this.maxConnections
    };
  }

  async cleanup(): Promise<void> {
    if (this.libp2p) {
      console.log('🧹 libp2p: Cleaning up...');
      await this.libp2p.stop();
      this.libp2p = null;
    }
    this.isInitialized = false;
    this.connectionCount = 0;
    this.messageHandlers = [];
  }
}

export default Libp2pMessagingService;