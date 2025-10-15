/**
 * P2P Integration Service
 * Integrates the new P2P messaging system with the existing UI
 * Handles the transition from on-chain to P2P messaging
 */

import { SimpleP2PService } from './simpleP2PService';
import { P2PMessage } from '../types/p2pMessage';
import { Message } from '../types';

export interface P2PIntegrationConfig {
  walletAddress: string;
  enableP2P: boolean;
  fallbackToOnChain: boolean;
}

export class P2PIntegrationService {
  private p2pService: SimpleP2PService | null = null;
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
      
        // Create Simple P2P service with wallet-specific node ID (singleton)
        const simpleP2PConfig = {
          nodeId: `node_${this.config.walletAddress.slice(2, 10)}`,
          relayUrl: 'ws://localhost:9001/ws',
          enableP2P: true
        };

        this.p2pService = SimpleP2PService.getInstance(simpleP2PConfig);
      
      // Initialize the P2P service asynchronously
      await this.p2pService.initialize();
      
      // Register message handler for all threads
      this.p2pService.registerMessageHandler('*', (p2pMessage: P2PMessage) => {
        this.handleIncomingP2PMessage(p2pMessage);
      });

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

    if (!this.p2pService || !this.isInitialized) {
      console.warn('P2P service not available, falling back to database');
      // Fallback to database or throw error
      throw new Error('P2P service not initialized - using database fallback');
    }

    try {
      const actualThreadId = threadId || `thread_${this.config.walletAddress}_${recipient}`;
      
      console.log('P2P Integration: Calling p2pService.sendMessage', { actualThreadId, recipient });
      
      const messageId = await this.p2pService.sendMessage(
        actualThreadId,
        recipient,
        content,
        'text'
      );

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
        handler(uiMessage);
      }

      // Also notify global handler if exists
      const globalHandler = this.messageHandlers.get('*');
      if (globalHandler) {
        globalHandler(uiMessage);
      }

      console.log(`P2P message processed: ${p2pMessage.id}`);
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
    return this.isInitialized && this.p2pService?.isReady() === true;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): { connected: boolean; peers: number } {
    if (this.p2pService && this.isInitialized) {
      try {
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
      } catch (error) {
        console.error('Error getting P2P connection status:', error);
        return { connected: true, peers: 1 }; // Database fallback is always available
      }
    }
    // If P2P is not available, still show as connected due to database fallback
    return { connected: true, peers: 1 };
  }

  /**
   * Connect to a specific peer
   */
  async connectToPeer(peerId: string): Promise<boolean> {
    if (this.p2pService) {
      return await this.p2pService.connectToPeer(peerId);
    }
    return false;
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
   * Clean up resources
   */
  cleanup(): void {
    if (this.p2pService) {
      this.p2pService.cleanup();
    }
    this.messageHandlers.clear();
    this.isInitialized = false;
    console.log('P2P Integration Service cleaned up');
  }
}

export default P2PIntegrationService;
