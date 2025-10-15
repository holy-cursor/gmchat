/**
 * P2P Message Format for Decentralized Messaging
 * Compatible with web and mobile clients
 */

export interface P2PMessage {
  // Message identification
  id: string; // Unique message ID (UUID v4)
  threadId: string; // Conversation thread ID
  sequence: number; // Per-thread sequence number for ordering
  
  // Participants
  sender: string; // Wallet address
  recipient: string; // Wallet address
  
  // Content
  content: string; // Encrypted message content
  contentType: 'text' | 'image' | 'file' | 'system';
  
  // Encryption
  encryptionKey: string; // Public key used for encryption
  nonce: string; // Encryption nonce/IV
  
  // Metadata
  timestamp: number; // Unix timestamp
  ttl: number; // Time to live in seconds
  
  // Delivery tracking
  deliveryStatus: 'pending' | 'queued' | 'delivered' | 'read';
  acks: MessageAck[]; // Delivery acknowledgments
  
  // Storage
  ipfsCid?: string; // IPFS CID for cold storage
  storageLocation: 'hot' | 'cold' | 'both';
  
  // Verification
  signature: string; // Sender's signature
  merkleProof?: string; // Merkle proof for on-chain verification
}

export interface MessageAck {
  type: 'queued' | 'delivered' | 'read';
  nodeId: string; // Node that sent the ACK
  timestamp: number;
  signature: string; // Node's signature
}

export interface MessageBatch {
  id: string; // Batch ID
  messages: P2PMessage[];
  merkleRoot: string; // Merkle root of all message CIDs
  timestamp: number;
  baseTxHash?: string; // Base blockchain transaction hash
}

export interface ThreadMetadata {
  threadId: string;
  participants: string[]; // Wallet addresses
  lastSequence: number;
  lastMessageId: string;
  createdAt: number;
  updatedAt: number;
}

export interface NodeInfo {
  nodeId: string;
  address: string; // WebSocket address
  publicKey: string;
  capabilities: string[]; // ['relay', 'storage', 'bootstrap']
  lastSeen: number;
  reputation: number; // 0-100
}

export interface ConnectionState {
  nodeId: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
  latency?: number;
  lastPing: number;
  connectionType: 'direct' | 'relay' | 'turn';
}

// Message types for different operations
export type MessageType = 
  | 'message' // Regular message
  | 'ack' // Acknowledgment
  | 'ping' // Keep-alive
  | 'pong' // Keep-alive response
  | 'discovery' // Node discovery
  | 'sync' // Message synchronization
  | 'batch_anchor'; // Batch anchoring request
