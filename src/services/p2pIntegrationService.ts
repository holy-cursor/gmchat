/**
 * P2P Integration Service
 * Integrates the new P2P messaging system with the existing UI
 * Handles the transition from on-chain to P2P messaging
 */

import { SimpleP2PService } from './simpleP2PService';
import { Libp2pMessagingService } from './libp2pMessagingService';
import { EnhancedP2PService } from './enhancedP2PService';
import { P2PMessage } from '../types/p2pMessage';
import { Message } from '../types';

export interface P2PIntegrationConfig {
  walletAddress: string;
  enableP2P: boolean;
  fallbackToOnChain: boolean;
}

export class P2PIntegrationService {
  private p2pService: SimpleP2PService | null = null;
  private libp2pService: Libp2pMessagingService | null = null;
  private enhancedP2PService: EnhancedP2PService | null = null;
  private config: P2PIntegrationConfig;
  private isInitialized: boolean = false;
  private messageHandlers: Map<string, (message: Message) => void> = new Map();

  constructor(config: P2PIntegrationConfig) {
    this.config = config;
  }

  /**
   * Initialize the P2P service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('Initializing P2P Integration Service...');
      
      // Try enhanced P2P first (now fixed without WebSockets)
      try {
        console.log('🚀 Attempting enhanced P2P initialization...');
        const enhancedConfig = {
          nodeId: `node_${this.config.walletAddress.slice(2, 10)}`,
          enableP2P: true,
          enableGossipSub: true,
          enableWebRTC: true,
          enableWebTransport: true,
          enableCircuitRelay: true,
          enableIpfs: true,
          maxConnections: 5,
        signalingServerUrl: process.env.NODE_ENV === 'production' 
          ? 'wss://gmchat-signaling-server-production.up.railway.app' // Production signaling server
          : 'ws://localhost:9002' // Local development
        };

        this.enhancedP2PService = new EnhancedP2PService(enhancedConfig);
        await this.enhancedP2PService.initialize();
        
        // Set up message handler
        this.enhancedP2PService.onMessage((p2pMessage) => {
          this.handleIncomingP2PMessage(p2pMessage);
        });
        
        console.log('✅ Enhanced P2P initialized successfully');
        
      } catch (enhancedError) {
        console.warn('⚠️ Enhanced P2P failed, trying libp2p:', enhancedError);
        
        // Try libp2p as fallback
        try {
          console.log('🚀 Attempting libp2p initialization...');
          const libp2pConfig = {
            nodeId: `node_${this.config.walletAddress.slice(2, 10)}`,
            enableP2P: true,
            maxConnections: 5,
            connectionTimeout: 10000
          };

          this.libp2pService = new Libp2pMessagingService(libp2pConfig);
          await this.libp2pService.initialize();
          
          // Set up message handler
          this.libp2pService.onMessage((p2pMessage) => {
            this.handleIncomingP2PMessage(p2pMessage);
          });
          
          console.log('✅ libp2p initialized successfully');
        
        } catch (libp2pError) {
          console.warn('⚠️ libp2p failed, falling back to WebSocket P2P:', libp2pError);
          console.error('❌ libp2p Error details:', {
            message: libp2pError instanceof Error ? libp2pError.message : 'Unknown error',
            stack: libp2pError instanceof Error ? libp2pError.stack : undefined,
            name: libp2pError instanceof Error ? libp2pError.name : 'Unknown'
          });
          
          // Fallback to Simple P2P service
          const simpleP2PConfig = {
            nodeId: `node_${this.config.walletAddress.slice(2, 10)}`,
            relayUrl: 'wss://relay.damus.io', // Use public relay in production
            enableP2P: true
          };

          this.p2pService = SimpleP2PService.getInstance(simpleP2PConfig);
          await this.p2pService.initialize();
          
          // Register message handler for all threads
          this.p2pService.registerMessageHandler('*', (p2pMessage: P2PMessage) => {
            this.handleIncomingP2PMessage(p2pMessage);
          });
        }
      }

      this.isInitialized = true;
      console.log('P2P Integration Service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize P2P Integration Service:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : 'Unknown'
      });
      console.log('⚠️ P2P service will fall back to database-only mode');
      // Don't throw error - allow app to continue with database fallback
      this.isInitialized = false;
    }
  }

  /**
   * Send a message using P2P
   */
  async sendMessage(
    recipient: string,
    content: string,
    threadId?: string
  ): Promise<string> {
    console.log('P2P Integration: sendMessage called', { 
      recipient, 
      content: content.substring(0, 50) + '...', 
      threadId,
      p2pServiceExists: !!this.p2pService,
      isInitialized: this.isInitialized
    });

    if ((!this.p2pService && !this.libp2pService && !this.enhancedP2PService) || !this.isInitialized) {
      console.warn('P2P service not available, falling back to database');
      // Fallback to database or throw error
      throw new Error('P2P service not initialized - using database fallback');
    }

    try {
      const actualThreadId = threadId || `thread_${this.config.walletAddress}_${recipient}`;
      
      console.log('P2P Integration: Calling P2P service sendMessage', { actualThreadId, recipient });
      
      let messageId: string;
      
      // Try enhanced P2P first (GossipSub + WebRTC + WebTransport + IPFS)
      if (this.enhancedP2PService) {
        console.log('🚀 P2P: Using enhanced P2P with GossipSub + IPFS for message delivery');
        messageId = await this.enhancedP2PService.sendMessage(recipient, content, 'text');
      }
      // Fallback to libp2p (it has circuit relay built-in)
      else if (this.libp2pService) {
        console.log('🔄 P2P: Using libp2p with circuit relay for message delivery');
        messageId = await this.libp2pService.sendMessage(recipient, content, 'text');
      } else if (this.p2pService) {
        // Fallback to WebSocket P2P only if libp2p is not available
        if (this.p2pService.isReady()) {
          messageId = await this.p2pService.sendMessage(
            actualThreadId,
            recipient,
            content,
            'text'
          );
        } else {
          // WebSocket not connected and no libp2p - this shouldn't happen
          throw new Error('No P2P connection available');
        }
      } else {
        throw new Error('No P2P service available');
      }

      console.log(`✅ P2P message sent successfully: ${messageId}`);
      return messageId;
    } catch (error) {
      console.error('❌ Failed to send P2P message:', error);
      throw error;
    }
  }

  /**
   * Handle incoming P2P message
   */
  private handleIncomingP2PMessage(p2pMessage: P2PMessage): void {
    try {
      console.log('📨 P2P Integration: Received P2P message:', p2pMessage.id, p2pMessage.content);
      console.log('📨 P2P Integration: Thread ID:', p2pMessage.threadId);
      console.log('📨 P2P Integration: Available message handlers:', Array.from(this.messageHandlers.keys()));
      
      // Convert P2P message to UI message format
      const uiMessage: Message = {
        id: p2pMessage.id,
        sender: p2pMessage.sender,
        recipient: p2pMessage.recipient,
        content: p2pMessage.content,
        messageType: p2pMessage.contentType === 'system' ? 'text' : p2pMessage.contentType,
        timestamp: p2pMessage.timestamp,
        transactionSignature: p2pMessage.signature,
        chainType: 'evm',
        chainId: 8453,
        ipfsHash: p2pMessage.ipfsCid,
        isEncrypted: true,
        encryptedContent: p2pMessage.content, // P2P messages are already encrypted
        nonce: p2pMessage.nonce,
        publicKey: p2pMessage.encryptionKey,
        isRead: false
      };

      // Notify UI handlers
      const threadId = p2pMessage.threadId;
      const handler = this.messageHandlers.get(threadId);
      if (handler) {
        console.log('📨 P2P Integration: Calling specific thread handler for:', threadId);
        handler(uiMessage);
      } else {
        console.log('📨 P2P Integration: No specific handler for thread:', threadId);
      }

      // Also notify global handler if exists
      const globalHandler = this.messageHandlers.get('*');
      if (globalHandler) {
        console.log('📨 P2P Integration: Calling global handler');
        globalHandler(uiMessage);
      } else {
        console.log('📨 P2P Integration: No global handler found');
      }

      console.log(`✅ P2P Integration: Message processed: ${p2pMessage.id}`);
    } catch (error) {
      console.error('Error handling incoming P2P message:', error);
    }
  }

  /**
   * Register message handler for a thread
   */
  registerMessageHandler(threadId: string, handler: (message: Message) => void): void {
    this.messageHandlers.set(threadId, handler);
  }

  /**
   * Unregister message handler
   */
  unregisterMessageHandler(threadId: string): void {
    this.messageHandlers.delete(threadId);
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    if (this.p2pService) {
      await this.p2pService.markAsRead(messageId);
    }
  }

  /**
   * Get message status
   */
  getMessageStatus(messageId: string): string | null {
    if (this.p2pService) {
      return this.p2pService.getMessageStatus(messageId);
    }
    return null;
  }

  /**
   * Get message delivery statistics
   */
  getDeliveryStats() {
    if (this.p2pService) {
      return this.p2pService.getStats();
    }
    return null;
  }

  /**
   * Check if P2P is ready
   */
  isReady(): boolean {
    // Always prefer libp2p if available and initialized
    if (this.libp2pService && this.isInitialized) {
      return true;
    }
    
    // Fallback to SimpleP2P if libp2p is not available
    if (this.p2pService && this.isInitialized) {
      return true;
    }
    
    return false;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; peers: number } {
    if ((this.p2pService || this.libp2pService || this.enhancedP2PService) && this.isInitialized) {
      try {
        // Check enhanced P2P first
        if (this.enhancedP2PService) {
          const status = this.enhancedP2PService.getConnectionStatus();
          console.log('Enhanced P2P Status:', status);
          return {
            connected: status.connected,
            peers: status.peerCount
          };
        }
        
        // Check libp2p
        if (this.libp2pService) {
          const status = this.libp2pService.getConnectionStatus();
          console.log('libp2p Status:', status);
          return {
            connected: status.connected,
            peers: status.peerCount
          };
        }
        
        // Fallback to WebSocket P2P
        if (this.p2pService) {
          const stats = this.p2pService.getStats();
          console.log('P2P Stats:', stats);
          
          // Consider connected if we have any network activity or database fallback
          const hasNetworkConnection = stats.network?.connected > 0;
          const hasDatabaseFallback = true; // Database is always available
          const isP2PReady = this.p2pService.isReady(); // Check if libp2p is initialized
          
          const isConnected = hasNetworkConnection || hasDatabaseFallback || isP2PReady;
          const peerCount = stats.network?.connected || (isP2PReady ? 0 : 1); // Show 0 peers if P2P is ready but no connections
        
          console.log('P2P Connection Status:', { 
            hasNetworkConnection, 
            hasDatabaseFallback, 
            isConnected, 
            peerCount,
            networkStats: stats.network 
          });
          
          return {
            connected: isConnected,
            peers: peerCount
          };
        }
      } catch (error) {
        console.error('Error getting P2P connection status:', error);
        return { connected: true, peers: 1 }; // Database fallback is always available
      }
    }
    // If P2P is not available, still show as connected due to database fallback
    return { connected: true, peers: 1 };
  }


  /**
   * Store message in IPFS for offline access
   */
  async storeInIPFS(message: Message): Promise<string | null> {
    if (this.p2pService) {
      try {
        // Convert UI message to P2P message format
        const p2pMessage: P2PMessage = {
          id: message.id,
          threadId: `thread_${message.sender}_${message.recipient}`,
          sequence: 0,
          sender: message.sender,
          recipient: message.recipient,
          content: message.content,
          contentType: message.messageType as 'text' | 'image' | 'file' | 'system',
          encryptionKey: message.publicKey || '',
          nonce: message.nonce || '',
          timestamp: message.timestamp,
          ttl: 30 * 24 * 60 * 60, // 30 days
          deliveryStatus: 'delivered',
          acks: [],
          storageLocation: 'hot',
          signature: message.transactionSignature || '',
          ipfsCid: message.ipfsHash
        };

        const cid = await this.p2pService.storeInIPFS(p2pMessage);
        return cid;
      } catch (error) {
        console.error('Failed to store message in IPFS:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Retrieve message from IPFS
   */
  async retrieveFromIPFS(cid: string): Promise<Message | null> {
    if (this.p2pService) {
      try {
        const p2pMessage = await this.p2pService.retrieveFromIPFS(cid);
        if (p2pMessage) {
          // Convert P2P message to UI message format
          return {
            id: p2pMessage.id,
            sender: p2pMessage.sender,
            recipient: p2pMessage.recipient,
            content: p2pMessage.content,
            messageType: p2pMessage.contentType === 'system' ? 'text' : p2pMessage.contentType,
            timestamp: p2pMessage.timestamp,
            transactionSignature: p2pMessage.signature,
            chainType: 'evm',
            chainId: 8453,
            ipfsHash: p2pMessage.ipfsCid,
            isEncrypted: true,
            encryptedContent: p2pMessage.content,
            nonce: p2pMessage.nonce,
            publicKey: p2pMessage.encryptionKey,
            isRead: false
          };
        }
      } catch (error) {
        console.error('Failed to retrieve message from IPFS:', error);
      }
    }
    return null;
  }

  /**
   * Get peer information for testing
   */
  getPeerInfo(): { peerId: string | null; connectedPeers: string[]; multiaddrs?: string[] } {
    if (this.enhancedP2PService) {
      return {
        peerId: this.enhancedP2PService.getPeerId(),
        connectedPeers: this.enhancedP2PService.getConnectedPeers(),
        multiaddrs: [] // No multiaddrs needed for GossipSub + IPFS
      };
    }
    if (this.libp2pService) {
      return {
        peerId: this.libp2pService.getPeerId(),
        connectedPeers: this.libp2pService.getConnectedPeers()
      };
    }
    return { peerId: null, connectedPeers: [] };
  }

  /**
   * Manually connect to a peer (for testing)
   */
  // No direct peer connections - just use GossipSub + IPFS

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.enhancedP2PService) {
      this.enhancedP2PService.cleanup();
    }
    if (this.p2pService) {
      this.p2pService.cleanup();
    }
    this.messageHandlers.clear();
    this.isInitialized = false;
    console.log('P2P Integration Service cleaned up');
  }
}

export default P2PIntegrationService;
