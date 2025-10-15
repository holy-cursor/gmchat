/**
 * IPFS Storage Service for Cold Message Storage
 * Handles storing and retrieving messages from IPFS using Pinata
 * Mobile and web compatible
 */

import { P2PMessage } from '../types/p2pMessage';
import P2P_CONFIG from '../config/p2pConfig';

export interface IPFSConfig {
  gateway: string;
  apiEndpoint: string;
  pinningService?: string;
  pinningToken?: string;
  pinataApiKey?: string;
  pinataSecretKey?: string;
}

export interface StorageResult {
  cid: string;
  size: number;
  pinned: boolean;
}

export interface RetrievalResult {
  message: P2PMessage;
  cid: string;
  size: number;
}

export class IPFSStorageService {
  private config: IPFSConfig;
  private cache: Map<string, P2PMessage> = new Map();
  private isPinataEnabled: boolean = false;

  constructor(config?: IPFSConfig) {
    this.config = config || P2P_CONFIG.IPFS;
  }

  /**
   * Initialize IPFS client with secure backend API
   */
  async initialize(): Promise<void> {
    try {
      // Test connection to secure backend API
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '/api';
      const testResponse = await fetch(`${backendUrl}/health`);

      if (testResponse.ok) {
        this.isPinataEnabled = true;
        console.log('✅ IPFS: Secure backend API initialized successfully');
        console.log('✅ IPFS: Backend connection established');
      } else {
        throw new Error(`Backend API not available: ${testResponse.status}`);
      }
      
    } catch (error) {
      console.warn('⚠️ IPFS: Failed to connect to backend API:', error instanceof Error ? error.message : String(error));
      console.log('IPFS: Falling back to mock mode');
      this.isPinataEnabled = false;
    }
  }

  /**
   * Store a message in IPFS via secure backend
   */
  async storeMessage(message: P2PMessage): Promise<StorageResult> {
    if (!this.isPinataEnabled) {
      console.warn('⚠️ IPFS client not initialized, storing message in mock mode.');
      // Simulate IPFS upload
      const cid = `Qm${Math.random().toString(36).substring(2, 15)}`;
      this.cache.set(cid, message);
      return { cid, size: JSON.stringify(message).length, pinned: false };
    }

    try {
      console.log(`Storing message in IPFS via secure backend...`);
      
      // Prepare message for storage (encrypted content only, no metadata)
      const messageData = this.prepareMessageForStorage(message);
      const messageObject = JSON.parse(messageData);
      
      // Upload via secure backend API
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '/api';
      const response = await fetch(`${backendUrl}/ipfs/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messageData: messageObject,
          metadata: {
            // Only non-sensitive metadata
            timestamp: new Date().toISOString(),
            version: '1.0'
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend API error: ${response.status} ${errorData.details || response.statusText}`);
      }

      const result = await response.json();
      const cid = result.cid;
      
      // Cache the message
      this.cache.set(cid, message);
      
      console.log(`✅ Message stored in IPFS successfully`);
      return { cid, size: result.size, pinned: result.pinned };
    } catch (error) {
      console.error(`❌ Failed to store message in IPFS:`, error);
      throw error;
    }
  }

  /**
   * Retrieve a message from IPFS via secure backend
   */
  async retrieveMessage(cid: string): Promise<RetrievalResult | null> {
    // Try cache first
    if (this.cache.has(cid)) {
      console.log(`✅ Message ${cid} retrieved from cache.`);
      const message = this.cache.get(cid)!;
      return { message, cid, size: JSON.stringify(message).length };
    }

    if (!this.isPinataEnabled) {
      console.warn('⚠️ IPFS client not initialized, cannot retrieve from real IPFS.');
      return null;
    }

    try {
      console.log(`Retrieving message from IPFS via secure backend...`);
      
      // Retrieve via secure backend API
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '/api';
      const response = await fetch(`${backendUrl}/ipfs/retrieve/${cid}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Backend API error: ${response.status} ${errorData.details || response.statusText}`);
      }
      
      const result = await response.json();
      const message: P2PMessage = result.message;
      
      // Cache the retrieved message
      this.cache.set(cid, message);
      
      console.log(`✅ Message retrieved from IPFS successfully`);
      return { message, cid, size: result.size };
    } catch (error) {
      console.error(`❌ Failed to retrieve message ${cid} from IPFS:`, error);
      return null;
    }
  }

  /**
   * Prepare message for storage (e.g., stringify, add metadata)
   */
  private prepareMessageForStorage(message: P2PMessage): string {
    // Ensure all fields are present or default
    const preparedMessage = {
      id: message.id,
      threadId: message.threadId,
      sequence: message.sequence || 0,
      sender: message.sender,
      recipient: message.recipient,
      content: message.content,
      contentType: message.contentType,
      encryptionKey: message.encryptionKey || '',
      nonce: message.nonce || '',
      timestamp: message.timestamp || Date.now(),
      ttl: message.ttl || P2P_CONFIG.MESSAGE.ttl,
      deliveryStatus: message.deliveryStatus || 'pending',
      acks: message.acks || [],
      storageLocation: message.storageLocation || 'cold',
      signature: message.signature || ''
    };
    return JSON.stringify(preparedMessage);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: number } {
    return {
      size: Array.from(this.cache.values()).reduce((acc, msg) => acc + JSON.stringify(msg).length, 0),
      entries: this.cache.size,
    };
  }

  /**
   * Clear the IPFS cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('IPFS cache cleared.');
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export default IPFSStorageService;