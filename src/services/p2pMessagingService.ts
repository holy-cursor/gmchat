/**
 * Main P2P Messaging Service
 * Simple wrapper around SimpleP2PService for backward compatibility
 */

import { P2PMessage } from '../types/p2pMessage';
import { SimpleP2PService } from './simpleP2PService';
import IPFSStorageService from './ipfsStorageService';
import P2PMessageBuilder from './p2pMessageBuilder';

export interface P2PConfig {
  nodeId: string;
  enableP2P: boolean;
}

export class P2PMessagingService {
  private simpleP2P: SimpleP2PService;
  private ipfsService: IPFSStorageService;
  private config: P2PConfig;
  private isInitialized: boolean = false;

  constructor(config: P2PConfig) {
    this.config = config;
    this.ipfsService = new IPFSStorageService();
    
    this.simpleP2P = SimpleP2PService.getInstance({
      nodeId: config.nodeId,
      relayUrl: process.env.NODE_ENV === 'production' ? 'wss://relay.damus.io' : 'ws://localhost:9001/ws',
      enableP2P: config.enableP2P
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('🚀 P2P Messaging: Initializing services...');
      
      // Initialize IPFS service
      await this.ipfsService.initialize();
      
      // Initialize Simple P2P service
      await this.simpleP2P.initialize();
      
      this.isInitialized = true;
      console.log('✅ P2P Messaging: All services initialized');
    } catch (error) {
      console.error('❌ P2P Messaging: Failed to initialize:', error);
      throw error;
    }
  }

  async sendMessage(
    threadId: string,
    recipient: string,
    content: string,
    contentType: 'text' | 'image' | 'file' | 'system' = 'text'
  ): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('P2P Messaging Service not initialized');
    }

    try {
      return await this.simpleP2P.sendMessage(threadId, recipient, content, contentType);
    } catch (error) {
      console.error('❌ P2P Messaging: Failed to send message:', error);
      throw error;
    }
  }

  registerMessageHandler(threadId: string, handler: (message: P2PMessage) => void): void {
    this.simpleP2P.registerMessageHandler(threadId, handler);
  }

  getStats(): any {
    const simpleStats = this.simpleP2P.getStats();
    const ipfsStats = this.ipfsService.getCacheStats();

    return {
      initialized: this.isInitialized,
      simpleP2P: simpleStats,
      ipfs: ipfsStats,
      network: {
        connected: simpleStats.connected ? 1 : 0,
        total: 1
      }
    };
  }

  isReady(): boolean {
    return this.isInitialized && this.simpleP2P.isReady();
  }

  async storeInIPFS(message: any): Promise<string> {
    return await this.simpleP2P.storeInIPFS(message);
  }

  async retrieveFromIPFS(cid: string): Promise<any | null> {
    return await this.simpleP2P.retrieveFromIPFS(cid);
  }

  cleanup(): void {
    this.simpleP2P.cleanup();
    this.isInitialized = false;
    console.log('🧹 P2P Messaging: Service cleaned up');
  }
}

export default P2PMessagingService;