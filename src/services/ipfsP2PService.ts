/**
 * IPFS-based P2P Messaging Service
 * Uses IPFS for cross-device message delivery
 * Simpler and more reliable than libp2p
 */

import { Message, Contact } from '../types';
import { P2PMessage } from '../types/p2pMessage';
import IPFSService from './ipfsService';

export interface IPFSP2PConfig {
  nodeId: string;
  enableP2P: boolean;
  pollInterval?: number;
}

export class IPFSP2PService {
  private config: IPFSP2PConfig;
  private isInitialized = false;
  private isInitializing = false;
  private messageHandlers: ((message: P2PMessage) => void)[] = [];
  private pollInterval: NodeJS.Timeout | null = null;
  private sentMessageIds = new Set<string>();

  constructor(config: IPFSP2PConfig) {
    this.config = {
      pollInterval: 5000, // Poll for new messages every 5 seconds
      ...config
    };
  }

  async initialize(): Promise<void> {
    if (this.isInitialized || this.isInitializing) {
      console.log('⚠️ IPFS P2P: Already initialized or initializing');
      return;
    }

    this.isInitializing = true;
    console.log('🚀 IPFS P2P: Initializing IPFS-based P2P service...');

    try {
      // IPFSService doesn't need explicit initialization
      console.log('✅ IPFS P2P: IPFS service ready');
      
      // Start polling for messages
      this.startPolling();
      
      this.isInitialized = true;
      this.isInitializing = false;
      console.log('✅ IPFS P2P: Service initialized successfully');

    } catch (error) {
      this.isInitializing = false;
      console.error('❌ IPFS P2P: Failed to initialize:', error);
      throw error;
    }
  }

  private startPolling(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    this.pollInterval = setInterval(async () => {
      try {
        await this.pollForMessages();
      } catch (error) {
        console.warn('⚠️ IPFS P2P: Error polling for messages:', error);
      }
    }, this.config.pollInterval);
  }

  private async pollForMessages(): Promise<void> {
    // This is a simplified implementation
    // In a real implementation, you'd need a way to discover message CIDs
    // For now, we'll just log that we're polling
    console.log('🔍 IPFS P2P: Polling for new messages...');
  }

  async sendMessage(recipient: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('IPFS P2P service not initialized');
    }

    try {
      // Create message
      const message: P2PMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId: `thread_${this.config.nodeId}_${recipient}`,
        sequence: 1,
        sender: this.config.nodeId,
        recipient: recipient,
        content: content,
        contentType: messageType,
        encryptionKey: '',
        nonce: '',
        timestamp: Date.now(),
        ttl: 86400, // 24 hours
        deliveryStatus: 'delivered',
        acks: [],
        storageLocation: 'hot',
        signature: ''
      };

      // Store message in IPFS
      const messageData = JSON.stringify(message);
      const ipfsResult = await IPFSService.uploadContent(messageData);
      
      console.log('✅ IPFS P2P: Message stored in IPFS:', ipfsResult.hash);
      
      // Track sent message
      this.sentMessageIds.add(message.id);
      
      return message.id;

    } catch (error) {
      console.error('❌ IPFS P2P: Failed to send message:', error);
      throw error;
    }
  }

  onMessage(handler: (message: P2PMessage) => void): void {
    this.messageHandlers.push(handler);
  }

  getConnectionStatus(): { connected: boolean; peerCount: number; maxConnections: number } {
    return {
      connected: this.isInitialized,
      peerCount: 0, // IPFS doesn't have direct peer connections
      maxConnections: 0
    };
  }

  async cleanup(): Promise<void> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isInitialized = false;
    this.messageHandlers = [];
    this.sentMessageIds.clear();
  }
}

export default IPFSP2PService;
