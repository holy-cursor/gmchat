/**
 * P2P Message Builder Service
 * Handles creation and validation of P2P messages
 */

import { P2PMessage } from '../types/p2pMessage';
import P2PEncryptionService from './p2pEncryptionService';

export interface MessageBuilderOptions {
  threadId: string;
  sender: string;
  recipient: string;
  content: string;
  contentType?: 'text' | 'image' | 'file' | 'system';
  ttl?: number; // Time to live in seconds
  sequence?: number;
}

export class P2PMessageBuilder {
  /**
   * Create a new P2P message
   */
  static async createMessage(options: MessageBuilderOptions): Promise<P2PMessage> {
    const messageId = this.generateMessageId();
    const timestamp = Date.now();
    const ttl = options.ttl || 30 * 24 * 60 * 60; // Default 30 days

    // Generate encryption key pair for this message
    const keyPair = await P2PEncryptionService.generateKeyPair();
    
    // For now, we'll use the generated private key as the symmetric key
    // In production, this would derive from the recipient's public key
    const symmetricKey = keyPair.privateKey;
    
    // Encrypt the message content
    const encryptionResult = await P2PEncryptionService.encryptMessage(
      options.content,
      symmetricKey
    );

    const message: Omit<P2PMessage, 'signature'> = {
      id: messageId,
      threadId: options.threadId,
      sequence: options.sequence || 0,
      sender: options.sender,
      recipient: options.recipient,
      content: encryptionResult.encryptedContent,
      contentType: options.contentType || 'text',
      encryptionKey: keyPair.publicKey,
      nonce: encryptionResult.nonce,
      timestamp,
      ttl,
      deliveryStatus: 'pending',
      acks: [],
      storageLocation: 'hot'
    };

    // Sign the message
    const signature = await P2PEncryptionService.signMessage(message, options.sender);

    return {
      ...message,
      signature
    };
  }

  /**
   * Create an acknowledgment message
   */
  static createAck(
    originalMessageId: string,
    ackType: 'queued' | 'delivered' | 'read',
    nodeId: string
  ): P2PMessage {
    const messageId = this.generateMessageId();
    const timestamp = Date.now();

    const message: Omit<P2PMessage, 'signature'> = {
      id: messageId,
      threadId: `ack_${originalMessageId}`,
      sequence: 0,
      sender: nodeId,
      recipient: '', // Will be set by the network layer
      content: JSON.stringify({
        type: 'ack',
        originalMessageId,
        ackType,
        timestamp
      }),
      contentType: 'system',
      encryptionKey: '',
      nonce: '',
      timestamp,
      ttl: 24 * 60 * 60, // 24 hours for ACKs
      deliveryStatus: 'pending',
      acks: [],
      storageLocation: 'hot'
    };

    return {
      ...message,
      signature: `ack_signature_${nodeId}_${timestamp}`
    };
  }

  /**
   * Create a ping message for connection health
   */
  static createPing(nodeId: string): P2PMessage {
    const messageId = this.generateMessageId();
    const timestamp = Date.now();

    const message: Omit<P2PMessage, 'signature'> = {
      id: messageId,
      threadId: `ping_${nodeId}`,
      sequence: 0,
      sender: nodeId,
      recipient: '',
      content: JSON.stringify({
        type: 'ping',
        timestamp,
        nodeId
      }),
      contentType: 'system',
      encryptionKey: '',
      nonce: '',
      timestamp,
      ttl: 60, // 1 minute for pings
      deliveryStatus: 'pending',
      acks: [],
      storageLocation: 'hot'
    };

    return {
      ...message,
      signature: `ping_signature_${nodeId}_${timestamp}`
    };
  }

  /**
   * Create a batch anchoring message
   */
  static createBatchAnchor(
    batchId: string,
    merkleRoot: string,
    messageCids: string[],
    sender: string
  ): P2PMessage {
    const messageId = this.generateMessageId();
    const timestamp = Date.now();

    const message: Omit<P2PMessage, 'signature'> = {
      id: messageId,
      threadId: `batch_${batchId}`,
      sequence: 0,
      sender,
      recipient: '', // Broadcast to all nodes
      content: JSON.stringify({
        type: 'batch_anchor',
        batchId,
        merkleRoot,
        messageCids,
        timestamp
      }),
      contentType: 'system',
      encryptionKey: '',
      nonce: '',
      timestamp,
      ttl: 7 * 24 * 60 * 60, // 7 days for batch anchors
      deliveryStatus: 'pending',
      acks: [],
      storageLocation: 'hot'
    };

    return {
      ...message,
      signature: `batch_signature_${sender}_${timestamp}`
    };
  }

  /**
   * Validate a P2P message
   */
  static async validateMessage(message: P2PMessage): Promise<boolean> {
    try {
      // Check required fields
      if (!message.id || !message.threadId || !message.sender || !message.recipient) {
        return false;
      }

      // Check timestamp is not too old
      const now = Date.now();
      const messageAge = now - message.timestamp;
      if (messageAge > message.ttl * 1000) {
        return false;
      }

      // Verify signature
      const isValidSignature = await P2PEncryptionService.verifySignature(
        message,
        message.sender
      );

      return isValidSignature;
    } catch (error) {
      console.error('Message validation failed:', error);
      return false;
    }
  }

  /**
   * Generate a unique message ID
   */
  private static generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a mock shared secret for testing
   * In production, this would derive from the recipient's public key
   */
  private static async createMockSharedSecret(): Promise<CryptoKey> {
    const keyPair = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );

    return keyPair;
  }
}

export default P2PMessageBuilder;
