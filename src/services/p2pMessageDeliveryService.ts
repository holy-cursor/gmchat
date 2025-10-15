/**
 * P2P Message Delivery Service
 * Handles message delivery with ACKs, retries, and offline storage
 * Mobile and web compatible
 */

import { P2PMessage, MessageAck } from '../types/p2pMessage';
import P2PNetworkService from './p2pNetworkService';
import IPFSStorageService from './ipfsStorageService';
import P2PMessageBuilder from './p2pMessageBuilder';

export interface DeliveryConfig {
  maxRetries: number;
  retryDelay: number; // Base delay in milliseconds
  maxRetryDelay: number; // Maximum delay in milliseconds
  offlineStorageTTL: number; // TTL for offline storage in seconds
  batchSize: number; // Number of messages to batch for anchoring
  batchTimeout: number; // Timeout for batching in milliseconds
}

export interface DeliveryStats {
  messagesSent: number;
  messagesDelivered: number;
  messagesRead: number;
  messagesFailed: number;
  averageDeliveryTime: number;
  retryCount: number;
}

export class P2PMessageDeliveryService {
  private config: DeliveryConfig;
  private networkService: P2PNetworkService;
  private ipfsService: IPFSStorageService;
  private messageQueue: Map<string, P2PMessage> = new Map();
  private ackQueue: Map<string, MessageAck[]> = new Map();
  private retryQueue: Map<string, number> = new Map();
  private batchQueue: P2PMessage[] = [];
  private stats: DeliveryStats;
  private batchTimer?: NodeJS.Timeout;

  constructor(
    config: DeliveryConfig,
    networkService: P2PNetworkService,
    ipfsService: IPFSStorageService
  ) {
    this.config = config;
    this.networkService = networkService;
    this.ipfsService = ipfsService;
    this.stats = {
      messagesSent: 0,
      messagesDelivered: 0,
      messagesRead: 0,
      messagesFailed: 0,
      averageDeliveryTime: 0,
      retryCount: 0
    };

    this.initializeDeliverySystem();
  }

  /**
   * Initialize the delivery system
   */
  private initializeDeliverySystem(): void {
    // Only initialize if network service is available
    if (!this.networkService) {
      console.warn('P2P Delivery Service: Network service not available, skipping initialization');
      return;
    }

    // Register message handlers
    this.networkService.registerMessageHandler('message', this.handleIncomingMessage.bind(this));
    this.networkService.registerMessageHandler('ack', this.handleAck.bind(this));

    // Start retry processing
    this.startRetryProcessing();

    // Start batch processing
    this.startBatchProcessing();

    console.log('P2P Message Delivery Service initialized');
  }

  /**
   * Send a message
   */
  async sendMessage(message: P2PMessage): Promise<boolean> {
    try {
      console.log(`Sending message ${message.id} to ${message.recipient}`);
      
      // Add to message queue
      this.messageQueue.set(message.id, message);
      
      // Send via network
      const sent = await this.networkService.sendMessage(message);
      
      if (sent) {
        this.stats.messagesSent++;
        
        // Start delivery timeout
        this.startDeliveryTimeout(message.id);
        
        // Add to batch queue for anchoring
        this.addToBatchQueue(message);
        
        console.log(`Message ${message.id} sent successfully`);
        return true;
      } else {
        console.warn(`Failed to send message ${message.id}`);
        this.handleDeliveryFailure(message.id);
        return false;
      }
    } catch (error) {
      console.error(`Error sending message ${message.id}:`, error);
      this.handleDeliveryFailure(message.id);
      return false;
    }
  }

  /**
   * Handle incoming message
   */
  private async handleIncomingMessage(message: P2PMessage, fromNode: string): Promise<void> {
    try {
      console.log(`Received message ${message.id} from ${fromNode}`);
      
      // Validate message
      const isValid = await P2PMessageBuilder.validateMessage(message);
      if (!isValid) {
        console.warn(`Invalid message received: ${message.id}`);
        return;
      }

      // Send queued ACK
      await this.sendAck(message.id, 'queued', fromNode);
      
      // Process message (decrypt, store, etc.)
      await this.processIncomingMessage(message);
      
      // Send delivered ACK
      await this.sendAck(message.id, 'delivered', fromNode);
      
      console.log(`Message ${message.id} processed successfully`);
    } catch (error) {
      console.error(`Error processing message ${message.id}:`, error);
    }
  }

  /**
   * Process incoming message
   */
  private async processIncomingMessage(message: P2PMessage): Promise<void> {
    // In production, this would:
    // 1. Decrypt the message
    // 2. Store locally
    // 3. Notify the UI
    // 4. Update message status
    
    console.log(`Processing message ${message.id}`);
    
    // For now, just log the message
    console.log('Message content:', message.content);
  }

  /**
   * Handle ACK
   */
  private async handleAck(ackMessage: P2PMessage, fromNode: string): Promise<void> {
    try {
      const ackData = JSON.parse(ackMessage.content);
      const originalMessageId = ackData.originalMessageId;
      const ackType = ackData.ackType;
      
      console.log(`Received ${ackType} ACK for message ${originalMessageId} from ${fromNode}`);
      
      // Add ACK to queue
      const ack: MessageAck = {
        type: ackType as 'queued' | 'delivered' | 'read',
        nodeId: fromNode,
        timestamp: Date.now(),
        signature: ackMessage.signature
      };
      
      if (!this.ackQueue.has(originalMessageId)) {
        this.ackQueue.set(originalMessageId, []);
      }
      
      this.ackQueue.get(originalMessageId)!.push(ack);
      
      // Update message status
      await this.updateMessageStatus(originalMessageId, ackType);
      
    } catch (error) {
      console.error('Error handling ACK:', error);
    }
  }

  /**
   * Send ACK
   */
  private async sendAck(originalMessageId: string, ackType: 'queued' | 'delivered' | 'read', targetNode: string): Promise<void> {
    try {
      const ackMessage = P2PMessageBuilder.createAck(originalMessageId, ackType, 'local_node');
      
      await this.networkService.sendMessage(ackMessage, targetNode);
      
      console.log(`Sent ${ackType} ACK for message ${originalMessageId} to ${targetNode}`);
    } catch (error) {
      console.error(`Failed to send ACK for message ${originalMessageId}:`, error);
    }
  }

  /**
   * Update message status based on ACKs
   */
  private async updateMessageStatus(messageId: string, ackType: string): Promise<void> {
    const message = this.messageQueue.get(messageId);
    if (!message) {
      return;
    }

    // Update delivery status
    switch (ackType) {
      case 'queued':
        message.deliveryStatus = 'queued';
        break;
      case 'delivered':
        message.deliveryStatus = 'delivered';
        this.stats.messagesDelivered++;
        break;
      case 'read':
        message.deliveryStatus = 'read';
        this.stats.messagesRead++;
        break;
    }

    // Remove from retry queue if delivered
    if (ackType === 'delivered' || ackType === 'read') {
      this.retryQueue.delete(messageId);
    }
  }

  /**
   * Start delivery timeout
   */
  private startDeliveryTimeout(messageId: string): void {
    setTimeout(() => {
      const message = this.messageQueue.get(messageId);
      if (message && message.deliveryStatus === 'pending') {
        console.warn(`Message ${messageId} delivery timeout`);
        this.handleDeliveryFailure(messageId);
      }
    }, this.config.maxRetryDelay);
  }

  /**
   * Handle delivery failure
   */
  private async handleDeliveryFailure(messageId: string): Promise<void> {
    const message = this.messageQueue.get(messageId);
    if (!message) {
      return;
    }

    const retryCount = this.retryQueue.get(messageId) || 0;
    
    if (retryCount < this.config.maxRetries) {
      // Retry delivery
      console.log(`Retrying delivery for message ${messageId} (attempt ${retryCount + 1})`);
      
      this.retryQueue.set(messageId, retryCount + 1);
      this.stats.retryCount++;
      
      // Calculate exponential backoff delay
      const delay = Math.min(
        this.config.retryDelay * Math.pow(2, retryCount),
        this.config.maxRetryDelay
      );
      
      setTimeout(() => {
        this.sendMessage(message);
      }, delay);
    } else {
      // Max retries exceeded, store in IPFS for offline delivery
      console.log(`Max retries exceeded for message ${messageId}, storing in IPFS`);
      
      try {
        // For demo purposes, simulate IPFS storage instead of real upload
        const mockCid = `Qm${Math.random().toString(36).substr(2, 44)}`;
        console.log(`Mock IPFS storage for offline delivery: ${mockCid}`);
        
        this.stats.messagesFailed++;
        
        // Remove from queues
        this.messageQueue.delete(messageId);
        this.retryQueue.delete(messageId);
        
        console.log(`Message ${messageId} stored in mock IPFS for offline delivery`);
      } catch (error) {
        console.error(`Failed to store message ${messageId} in mock IPFS:`, error);
      }
    }
  }

  /**
   * Add message to batch queue
   */
  private addToBatchQueue(message: P2PMessage): void {
    this.batchQueue.push(message);
    
    // Process batch if it reaches the size limit
    if (this.batchQueue.length >= this.config.batchSize) {
      this.processBatch();
    }
  }

  /**
   * Start batch processing
   */
  private startBatchProcessing(): void {
    this.batchTimer = setInterval(() => {
      if (this.batchQueue.length > 0) {
        this.processBatch();
      }
    }, this.config.batchTimeout);
  }

  /**
   * Process batch for anchoring
   */
  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) {
      return;
    }

    try {
      console.log(`Processing batch of ${this.batchQueue.length} messages`);
      
      // For demo purposes, simulate batch storage instead of real IPFS
      const mockCid = `Qm${Math.random().toString(36).substr(2, 44)}`;
      console.log(`Mock batch storage in IPFS with CID: ${mockCid}`);
      
      // In production, this would anchor the batch to the blockchain
      console.log(`Batch stored in mock IPFS with CID: ${mockCid}`);
      
      // Clear batch queue
      this.batchQueue = [];
      
    } catch (error) {
      console.error('Failed to process batch:', error);
    }
  }

  /**
   * Start retry processing
   */
  private startRetryProcessing(): void {
    setInterval(() => {
      this.processRetries();
    }, 5000); // Check every 5 seconds
  }

  /**
   * Process retries
   */
  private processRetries(): void {
    for (const [messageId, retryCount] of Array.from(this.retryQueue.entries())) {
      const message = this.messageQueue.get(messageId);
      if (message && message.deliveryStatus === 'pending') {
        // Check if it's time to retry
        const lastRetry = message.timestamp + (retryCount * this.config.retryDelay);
        if (Date.now() > lastRetry) {
          this.sendMessage(message);
        }
      }
    }
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId: string): Promise<void> {
    const message = this.messageQueue.get(messageId);
    if (message) {
      // Send read ACK
      await this.sendAck(messageId, 'read', message.sender);
      
      // Update local status
      message.deliveryStatus = 'read';
      this.stats.messagesRead++;
    }
  }

  /**
   * Get delivery statistics
   */
  getStats(): DeliveryStats {
    return { ...this.stats };
  }

  /**
   * Get message status
   */
  getMessageStatus(messageId: string): string | null {
    const message = this.messageQueue.get(messageId);
    return message ? message.deliveryStatus : null;
  }

  /**
   * Get ACKs for a message
   */
  getMessageAcks(messageId: string): MessageAck[] {
    return this.ackQueue.get(messageId) || [];
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    
    this.messageQueue.clear();
    this.ackQueue.clear();
    this.retryQueue.clear();
    this.batchQueue = [];
    
    console.log('P2P Message Delivery Service cleaned up');
  }
}

export default P2PMessageDeliveryService;
