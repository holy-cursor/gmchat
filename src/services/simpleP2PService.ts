/**
 * Simple P2P Messaging Service
 * Uses WebSocket connections for peer-to-peer messaging
 * Lightweight alternative to complex libp2p setup
 */

import { P2PMessage } from '../types/p2pMessage';
import IPFSStorageService from './ipfsStorageService';
import P2PMessageBuilder from './p2pMessageBuilder';

export interface SimpleP2PConfig {
  nodeId: string;
  relayUrl: string;
  enableP2P: boolean;
}

export class SimpleP2PService {
  private static instance: SimpleP2PService | null = null;
  private static isGloballyInitialized: boolean = false;
  private static initializationPromise: Promise<void> | null = null;
  private config: SimpleP2PConfig;
  private ws: WebSocket | null = null;
  private isInitialized: boolean = false;
  private isInitializing: boolean = false;
  private messageHandlers: Map<string, (message: P2PMessage) => void> = new Map();
  private ipfsService: IPFSStorageService;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 2000;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  constructor(config: SimpleP2PConfig) {
    this.config = config;
    this.ipfsService = new IPFSStorageService();
  }

  static getInstance(config: SimpleP2PConfig): SimpleP2PService {
    if (!SimpleP2PService.instance) {
      console.log('🏗️ Simple P2P: Creating new singleton instance');
      SimpleP2PService.instance = new SimpleP2PService(config);
    } else {
      console.log('♻️ Simple P2P: Reusing existing singleton instance');
    }
    return SimpleP2PService.instance;
  }

  static resetInstance(): void {
    if (SimpleP2PService.instance) {
      SimpleP2PService.instance.cleanup();
      SimpleP2PService.instance = null;
    }
    SimpleP2PService.isGloballyInitialized = false;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || this.isInitializing) {
      console.log('⚠️ Simple P2P: Already initialized or initializing, skipping...');
      return;
    }

    if (SimpleP2PService.isGloballyInitialized) {
      console.log('⚠️ Simple P2P: Global initialization already completed, skipping...');
      return;
    }

    this.isInitializing = true;
    SimpleP2PService.isGloballyInitialized = true;

    try {
      console.log('🚀 Simple P2P: Initializing WebSocket connection...');
      
      // Initialize IPFS service
      await this.ipfsService.initialize();
      
      // Connect to relay server
      await this.connectToRelay();
      
      this.isInitialized = true;
      this.isInitializing = false;
      console.log('✅ Simple P2P: Service initialized successfully');
    } catch (error) {
      this.isInitializing = false;
      SimpleP2PService.isGloballyInitialized = false;
      console.error('❌ Simple P2P: Failed to initialize:', error);
      throw error;
    }
  }

  private async connectToRelay(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Close existing connection if any
        if (this.ws) {
          this.ws.close();
          this.ws = null;
        }

        const wsUrl = `${this.config.relayUrl}?peerId=${this.config.nodeId}`;
        console.log('🔗 Simple P2P: Connecting to:', wsUrl);
        
        // Check if WebSocket is available
        if (typeof WebSocket === 'undefined') {
          throw new Error('WebSocket is not available in this environment');
        }
        
        this.ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          console.error('❌ Simple P2P: Connection timeout after 10 seconds');
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('✅ Simple P2P: Connected to relay server successfully');
          this.reconnectAttempts = 0;
          resolve();
        };

            this.ws.onmessage = (event) => {
              console.log('📨 Simple P2P: Received message from relay');
              this.handleIncomingMessage(event.data).catch(error => {
                console.error('❌ Simple P2P: Error handling incoming message:', error);
              });
            };

        this.ws.onclose = (event) => {
          console.log('🔌 Simple P2P: Connection closed:', event.code, event.reason);
          clearTimeout(timeout);
          if (event.code !== 1000) {
            this.handleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('❌ Simple P2P: WebSocket error:', error);
          console.error('❌ Simple P2P: WebSocket readyState:', this.ws?.readyState);
          reject(new Error(`WebSocket connection failed: ${error}`));
        };
      } catch (error) {
        console.error('❌ Simple P2P: Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  private handleReconnect(): void {
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 10000); // Max 10 seconds
      console.log(`🔄 Simple P2P: Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);
      
      this.reconnectTimeout = setTimeout(() => {
        if (this.isInitialized && !this.isInitializing) {
          this.connectToRelay().catch(error => {
            console.error('❌ Simple P2P: Reconnect failed:', error);
          });
        }
      }, delay);
    } else {
      console.warn('⚠️ Simple P2P: Max reconnection attempts reached, P2P disabled');
      this.isInitialized = false;
    }
  }

  private async handleIncomingMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'welcome') {
        console.log('👋 Simple P2P: Welcome message:', message.message);
        return;
      }

      if (message.type === 'message' || message.fromPeer) {
        console.log('📨 Simple P2P: Received message from:', message.fromPeer);
        
        // Decrypt message content if encrypted
        let decryptedContent = message.content || '';
        if (message.encryptionKey && message.nonce && message.content) {
          try {
            const P2PEncryptionService = await import('./p2pEncryptionService');
            decryptedContent = await P2PEncryptionService.default.decryptMessage(
              message.content,
              message.encryptionKey,
              message.nonce
            );
            console.log('✅ Simple P2P: Message decrypted successfully');
          } catch (decryptError) {
            console.warn('⚠️ Simple P2P: Message decryption failed, using encrypted content:', decryptError);
            // Continue with encrypted content
          }
        }

        // Convert to P2PMessage format
        const p2pMessage: P2PMessage = {
          id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          threadId: message.threadId || 'unknown',
          sequence: message.sequence || 0,
          sender: message.sender || message.fromPeer,
          recipient: message.recipient || this.config.nodeId,
          content: decryptedContent,
          contentType: message.contentType || 'text',
          encryptionKey: message.encryptionKey || '',
          nonce: message.nonce || '',
          timestamp: message.timestamp || Date.now(),
          ttl: message.ttl || 86400,
          deliveryStatus: 'delivered' as const,
          acks: message.acks || [],
          storageLocation: 'hot' as const,
          signature: message.signature || ''
        };

        // Verify message signature for integrity
        if (message.signature && message.sender) {
          try {
            const P2PEncryptionService = await import('./p2pEncryptionService');
            const isValid = await P2PEncryptionService.default.verifySignature(
              p2pMessage, 
              message.signature, 
              message.sender // Using sender as public key for verification
            );
            
            if (!isValid) {
              console.warn('⚠️ Simple P2P: Message signature verification failed:', message.id);
              return; // Reject message with invalid signature
            }
            
            console.log('✅ Simple P2P: Message signature verified:', message.id);
          } catch (verifyError) {
            console.warn('⚠️ Simple P2P: Signature verification error:', verifyError);
            // Continue processing but log the warning
          }
        }

        // Call registered handlers
        const threadHandler = this.messageHandlers.get(p2pMessage.threadId);
        if (threadHandler) {
          threadHandler(p2pMessage);
        } else {
          const globalHandler = this.messageHandlers.get('*');
          if (globalHandler) {
            globalHandler(p2pMessage);
          }
        }
      }
    } catch (error) {
      console.error('❌ Simple P2P: Error handling incoming message:', error);
    }
  }

  async sendMessage(
    threadId: string,
    recipient: string,
    content: string,
    contentType: 'text' | 'image' | 'file' | 'system' = 'text'
  ): Promise<string> {
    console.log('📤 Simple P2P: sendMessage called', { 
      threadId, 
      recipient, 
      content: content.substring(0, 50) + '...', 
      contentType,
      isInitialized: this.isInitialized,
      wsReadyState: this.ws?.readyState,
      wsOpen: this.ws?.readyState === WebSocket.OPEN
    });

    if (!this.isInitialized || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ Simple P2P: Service not connected', {
        isInitialized: this.isInitialized,
        wsExists: !!this.ws,
        wsReadyState: this.ws?.readyState
      });
      throw new Error('Simple P2P Service not connected');
    }

    try {
      console.log('🔨 Simple P2P: Creating message with P2PMessageBuilder...');
      // Create message
      const message = await P2PMessageBuilder.createMessage({
        threadId,
        sender: this.config.nodeId,
        recipient,
        content,
        contentType
      });
      console.log('✅ Simple P2P: Message created successfully:', message.id);

      // Encrypt message content before sending
      let encryptedContent = message.content;
      let encryptionKey = message.encryptionKey;
      let nonce = message.nonce;
      
      try {
        const P2PEncryptionService = await import('./p2pEncryptionService');
        const encryptionResult = await P2PEncryptionService.default.encryptMessage(
          message.content,
          message.encryptionKey || 'default-key' // Use a default key if none provided
        );
        encryptedContent = encryptionResult.encryptedContent;
        encryptionKey = encryptionResult.publicKey;
        nonce = encryptionResult.nonce;
        console.log('✅ Simple P2P: Message encrypted before sending');
      } catch (encryptError) {
        console.warn('⚠️ Simple P2P: Message encryption failed, sending unencrypted:', encryptError);
        // Continue with unencrypted message
      }

      // Send via WebSocket
      const wsMessage = {
        type: 'message',
        id: message.id,
        threadId: message.threadId,
        sender: message.sender,
        recipient: message.recipient,
        content: encryptedContent,
        contentType: message.contentType,
        encryptionKey: encryptionKey,
        nonce: nonce,
        timestamp: message.timestamp
      };

      this.ws.send(JSON.stringify(wsMessage));
      
      console.log('✅ Simple P2P: Message sent successfully:', message.id);
      return message.id;
    } catch (error) {
      console.error('❌ Simple P2P: Failed to send message:', error);
      throw error;
    }
  }

  registerMessageHandler(threadId: string, handler: (message: P2PMessage) => void): void {
    this.messageHandlers.set(threadId, handler);
  }

  getStats(): any {
    return {
      initialized: this.isInitialized,
      connected: this.ws?.readyState === WebSocket.OPEN,
      reconnectAttempts: this.reconnectAttempts,
      ipfs: this.ipfsService.getCacheStats(),
      network: {
        connected: this.ws?.readyState === WebSocket.OPEN ? 1 : 0,
        total: 1
      }
    };
  }

  isReady(): boolean {
    return this.isInitialized && this.ws?.readyState === WebSocket.OPEN;
  }

  async storeInIPFS(message: any): Promise<string> {
    const result = await this.ipfsService.storeMessage(message);
    return result.cid;
  }

  async retrieveFromIPFS(cid: string): Promise<any | null> {
    const result = await this.ipfsService.retrieveMessage(cid);
    return result?.message || null;
  }

  async markAsRead(messageId: string): Promise<void> {
    // Simple P2P doesn't track read status, just log it
    console.log('📖 Simple P2P: Message marked as read:', messageId);
  }

  getMessageStatus(messageId: string): string | null {
    // Simple P2P assumes all messages are delivered
    return 'delivered';
  }

  async connectToPeer(peerId: string): Promise<boolean> {
    // In Simple P2P, connections are handled by the relay server
    // We can't directly connect to specific peers
    console.log('🔗 Simple P2P: Peer connection handled by relay server:', peerId);
    return this.isReady();
  }

  cleanup(): void {
    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
    this.isInitialized = false;
    this.isInitializing = false;
    this.reconnectAttempts = 0;
    console.log('🧹 Simple P2P: Service cleaned up');
  }
}
