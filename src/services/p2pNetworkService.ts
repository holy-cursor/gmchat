/**
 * P2P Network Service
 * Handles libp2p connections and message routing
 * Mobile and web compatible
 */

import { P2PMessage, NodeInfo, ConnectionState, MessageType } from '../types/p2pMessage';
import P2P_CONFIG from '../config/p2pConfig';

export interface NetworkConfig {
  nodeId: string;
  bootstrapNodes: string[];
  relayNodes: string[];
  enableWebRTC: boolean;
  enableSTUN: boolean;
  enableTURN: boolean;
}

export interface MessageHandler {
  (message: P2PMessage, fromNode: string): Promise<void>;
}

export class P2PNetworkService {
  private config: NetworkConfig;
  private connections: Map<string, WebSocket> = new Map();
  private connectionStates: Map<string, ConnectionState> = new Map();
  private messageHandlers: Map<MessageType, MessageHandler> = new Map();
  private messageQueue: P2PMessage[] = [];
  private isConnected: boolean = false;
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed' = 'disconnected';
  private nodeId: string;
  private publicKey: string = '';

  constructor(config: NetworkConfig) {
    this.config = {
      ...config,
      bootstrapNodes: config.bootstrapNodes.length > 0 ? config.bootstrapNodes : P2P_CONFIG.BOOTSTRAP_NODES,
      relayNodes: config.relayNodes.length > 0 ? config.relayNodes : P2P_CONFIG.RELAY_NODES
    };
    this.nodeId = this.config.nodeId;
    this.initializeNetwork();
  }

  /**
   * Initialize the P2P network
   */
  private async initializeNetwork(): Promise<void> {
    try {
      console.log('Initializing P2P network...');
      
      // Generate node key pair
      await this.generateNodeKeyPair();
      
      // Initialize WebSocket connections to bootstrap nodes
      await this.connectToBootstrapNodes();
      
      // Start connection health monitoring
      this.startHealthMonitoring();
      
      this.isConnected = true;
      console.log('P2P network initialized successfully');
    } catch (error) {
      console.error('Failed to initialize P2P network:', error);
      throw error;
    }
  }

  /**
   * Generate node key pair
   */
  private async generateNodeKeyPair(): Promise<void> {
    try {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        true,
        ['sign', 'verify']
      );

      const publicKeyBuffer = await crypto.subtle.exportKey('raw', keyPair.publicKey);
      this.publicKey = this.arrayBufferToBase64(publicKeyBuffer);
      
      console.log('Node key pair generated');
    } catch (error) {
      console.error('Failed to generate node key pair:', error);
      throw error;
    }
  }

  /**
   * Connect to bootstrap nodes
   */
  private async connectToBootstrapNodes(): Promise<void> {
    console.log('P2P Network: Connecting to bootstrap nodes...');
    
    // Try to connect to each bootstrap node with shorter timeout
    for (const bootstrapNode of this.config.bootstrapNodes) {
      try {
        console.log(`P2P Network: Attempting connection to ${bootstrapNode}`);
        await this.connectToNode(bootstrapNode, 'bootstrap');
        
        if (this.isConnected) {
          console.log(`✅ P2P Network: Connected to bootstrap node ${bootstrapNode}`);
          break; // Connect to first available node
        }
      } catch (error) {
        console.warn(`⚠️ P2P Network: Failed to connect to ${bootstrapNode}:`, error);
        // Continue to next node instead of stopping
      }
    }
    
    if (!this.isConnected) {
      console.warn('⚠️ P2P Network: No bootstrap nodes available, running in offline mode');
      this.connectionState = 'disconnected';
    }
  }

  /**
   * Connect to a specific node
   */
  private async connectToNode(nodeAddress: string, connectionType: 'bootstrap' | 'relay' | 'peer'): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket(nodeAddress);
        
        ws.onopen = () => {
          console.log(`✅ Connected to ${nodeAddress}`);
          this.connections.set(nodeAddress, ws);
          this.isConnected = true;
          this.connectionState = 'connected';
          this.updateConnectionState(nodeAddress, 'connected', 'relay');
          this.sendNodeInfo(ws);
          resolve();
        };

        ws.onmessage = (event) => {
          this.handleIncomingMessage(event.data, nodeAddress);
        };

        ws.onclose = () => {
          console.log(`Disconnected from ${nodeAddress}`);
          this.connections.delete(nodeAddress);
          this.updateConnectionState(nodeAddress, 'disconnected', 'relay');
          
          // If this was our only connection, mark as disconnected
          if (this.connections.size === 0) {
            this.isConnected = false;
            this.connectionState = 'disconnected';
          }
        };

        ws.onerror = (error) => {
          console.error(`WebSocket error for ${nodeAddress}:`, error);
          this.updateConnectionState(nodeAddress, 'failed', 'relay');
          reject(error);
        };

                // Set a timeout for connection attempts
                setTimeout(() => {
                  if (ws.readyState !== WebSocket.OPEN) {
                    ws.close();
                    reject(new Error(`Connection timeout to ${nodeAddress}`));
                  }
                }, 3000); // 3 second timeout

      } catch (error) {
        console.error(`Failed to connect to ${nodeAddress}:`, error);
        this.updateConnectionState(nodeAddress, 'failed', 'relay');
        reject(error);
      }
    });
  }

  /**
   * Send node information to establish connection
   */
  private sendNodeInfo(ws: WebSocket): void {
    // Check if WebSocket is ready to send
    if (ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not ready, skipping node info send');
      return;
    }

    // For Nostr relays, we need to send a proper Nostr message format
    const nostrMessage = [
      "REQ",
      "parc3l_discovery",
      {
        "kinds": [30000], // Custom kind for Parc3l discovery
        "authors": [this.nodeId],
        "limit": 1
      }
    ];

    try {
      ws.send(JSON.stringify(nostrMessage));
      console.log('✅ Sent Nostr discovery message');
    } catch (error) {
      console.error('Failed to send node info:', error);
    }
  }

  /**
   * Handle incoming messages
   */
  private async handleIncomingMessage(data: string, fromNode: string): Promise<void> {
    try {
      // Check if data looks like JSON (starts with { or [)
      if (!data.trim().startsWith('{') && !data.trim().startsWith('[')) {
        // Skip non-JSON messages (like echo server responses)
        return;
      }

      const message = JSON.parse(data);
      
      // Handle Nostr relay responses
      if (Array.isArray(message) && message[0] === 'EVENT') {
        await this.handleNostrEvent(message[1], message[2], fromNode);
      } else if (Array.isArray(message) && message[0] === 'EOSE') {
        console.log('✅ Nostr subscription ended');
      } else if (message.type === 'discovery') {
        await this.handleNodeDiscovery(message.data, fromNode);
      } else if (message.type === 'message') {
        await this.handleP2PMessage(message.data, fromNode);
      } else if (message.type === 'ack') {
        await this.handleAck(message.data, fromNode);
      } else if (message.type === 'ping') {
        await this.handlePing(message.data, fromNode);
      }
    } catch (error) {
      // Only log JSON parsing errors for actual JSON-looking data
      if (data.trim().startsWith('{') || data.trim().startsWith('[')) {
        console.error('Failed to parse JSON message:', error);
      }
    }
  }

  /**
   * Handle Nostr event from relay
   */
  private async handleNostrEvent(subscriptionId: string, event: any, fromNode: string): Promise<void> {
    console.log(`Received Nostr event from ${fromNode}:`, event.id);
    
    // Convert Nostr event to P2P message format
    if (event.kind === 30000) { // Parc3l discovery event
      const p2pMessage: P2PMessage = {
        id: event.id,
        threadId: event.tags?.find((tag: any[]) => tag[0] === 'thread')?.[1] || '',
        sequence: 0,
        sender: event.pubkey,
        recipient: event.tags?.find((tag: any[]) => tag[0] === 'recipient')?.[1] || '',
        content: event.content,
        contentType: 'text',
        encryptionKey: event.tags?.find((tag: any[]) => tag[0] === 'pubkey')?.[1] || '',
        nonce: event.tags?.find((tag: any[]) => tag[0] === 'nonce')?.[1] || '',
        timestamp: event.created_at * 1000,
        ttl: 30 * 24 * 60 * 60,
        deliveryStatus: 'delivered',
        acks: [],
        storageLocation: 'hot',
        signature: event.sig
      };

      // Notify registered handlers
      const handler = this.messageHandlers.get('text' as MessageType);
      if (handler) {
        await handler(p2pMessage, fromNode);
      }
    }
  }

  /**
   * Handle node discovery
   */
  private async handleNodeDiscovery(nodeInfo: NodeInfo, fromNode: string): Promise<void> {
    console.log(`Discovered node: ${nodeInfo.nodeId}`);
    
    // Store node information
    // In production, this would be stored in a node registry
    
    // Send our node info back to the same connection
    const connection = this.connections.get(fromNode);
    if (connection && connection.readyState === WebSocket.OPEN) {
      this.sendNodeInfo(connection);
    }
  }

  /**
   * Handle P2P message
   */
  private async handleP2PMessage(message: P2PMessage, fromNode: string): Promise<void> {
    console.log(`Received P2P message from ${fromNode}:`, message.id);
    
    // Validate message
    if (!this.validateMessage(message)) {
      console.warn('Invalid message received:', message.id);
      return;
    }

    // Check if message is for us
    if (message.recipient === this.nodeId) {
      // Handle message locally
      const handler = this.messageHandlers.get('message');
      if (handler) {
        await handler(message, fromNode);
      }
    } else {
      // Forward message to recipient
      await this.forwardMessage(message);
    }
  }

  /**
   * Handle acknowledgment
   */
  private async handleAck(ackData: any, fromNode: string): Promise<void> {
    console.log(`Received ACK from ${fromNode}:`, ackData);
    
    // Update message delivery status
    // In production, this would update the message queue
  }

  /**
   * Handle ping
   */
  private async handlePing(pingData: any, fromNode: string): Promise<void> {
    console.log(`Received ping from ${fromNode}`);
    
    // Send pong back
    this.sendPong(fromNode);
  }

  /**
   * Send a message to a specific node
   */
  async sendMessage(message: P2PMessage, targetNode?: string): Promise<boolean> {
    try {
      if (targetNode) {
        // Send directly to target node
        return await this.sendToNode(message, targetNode);
      } else {
        // Broadcast to all connected nodes
        return await this.broadcastMessage(message);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  /**
   * Send message to specific node
   */
  private async sendToNode(message: P2PMessage, nodeId: string): Promise<boolean> {
    console.log(`P2P Network: Sending message to ${nodeId}:`, message.id);
    
    try {
      // Find the WebSocket connection for this node
      const connection = this.connections.get(nodeId);
      if (!connection || connection.readyState !== WebSocket.OPEN) {
        console.error(`❌ No active connection to node ${nodeId}`);
        return false;
      }

      // Convert P2P message to Nostr event format
      const nostrEvent = {
        id: message.id,
        pubkey: message.sender,
        created_at: Math.floor(message.timestamp / 1000),
        kind: 30000, // Custom kind for Parc3l messages
        tags: [
          ['thread', message.threadId],
          ['recipient', message.recipient],
          ['nonce', message.nonce || ''],
          ['pubkey', message.encryptionKey || ''],
          ['content-type', message.contentType]
        ],
        content: message.content,
        sig: message.signature
      };

      // Create Nostr EVENT message
      const nostrMessage = ["EVENT", nostrEvent];

      // Send the message
      connection.send(JSON.stringify(nostrMessage));
      console.log(`✅ P2P message ${message.id} sent successfully to ${nodeId}`);
      return true;
      
    } catch (error) {
      console.error(`❌ Failed to send message to ${nodeId}:`, error);
      return false;
    }
  }

  /**
   * Broadcast message to all connected nodes
   */
  private async broadcastMessage(message: P2PMessage): Promise<boolean> {
    console.log(`P2P Network: Broadcasting message ${message.id} to network`);
    
    let successCount = 0;
    const totalNodes = this.connections.size;
    
    if (totalNodes === 0) {
      console.warn('⚠️ P2P Network: No connected nodes to broadcast to');
      return false;
    }
    
    // Send to all connected nodes
    for (const [nodeId, connection] of Array.from(this.connections.entries())) {
      if (connection.readyState === WebSocket.OPEN) {
        try {
          const success = await this.sendToNode(message, nodeId);
          if (success) successCount++;
        } catch (error) {
          console.error(`Failed to send to node ${nodeId}:`, error);
        }
      }
    }
    
    console.log(`P2P Network: Broadcast complete - ${successCount}/${totalNodes} nodes successful`);
    return successCount > 0;
  }

  /**
   * Forward message to recipient
   */
  private async forwardMessage(message: P2PMessage): Promise<void> {
    // In production, this would implement message forwarding logic
    console.log(`Forwarding message ${message.id} to ${message.recipient}`);
  }

  /**
   * Send pong response
   */
  private sendPong(targetNode: string): void {
    // For demo purposes, simulate pong response
    console.log(`P2P Network: Simulating pong to ${targetNode}`);
    // Note: pongData would be used in production
  }

  /**
   * Register message handler
   */
  registerMessageHandler(type: MessageType, handler: MessageHandler): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Update connection state
   */
  private updateConnectionState(nodeId: string, status: ConnectionState['status'], connectionType: 'relay' | 'direct' | 'turn'): void {
    this.connectionStates.set(nodeId, {
      nodeId,
      status,
      lastPing: Date.now(),
      connectionType
    });
  }

  /**
   * Validate incoming message
   */
  private validateMessage(message: P2PMessage): boolean {
    // Basic validation
    return !!(message.id && message.sender && message.recipient && message.timestamp);
  }

  /**
   * Start connection health monitoring
   */
  private startHealthMonitoring(): void {
    setInterval(() => {
      this.pingAllConnections();
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Ping all connections
   */
  private pingAllConnections(): void {
    for (const [nodeId, connection] of Array.from(this.connections.entries())) {
      if (connection.readyState === WebSocket.OPEN) {
        this.sendPing(nodeId);
      }
    }
  }

  /**
   * Send ping to specific node
   */
  private sendPing(targetNode: string): void {
    // For demo purposes, simulate ping
    console.log(`P2P Network: Simulating ping to ${targetNode}`);
    // Note: pingData would be used in production
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): { total: number; connected: number; disconnected: number } {
    const total = this.connections.size;
    let connected = 0;
    let disconnected = 0;
    
    for (const connection of Array.from(this.connections.values())) {
      if (connection.readyState === WebSocket.OPEN) {
        connected++;
      } else {
        disconnected++;
      }
    }
    
    return { total, connected, disconnected };
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Disconnect from network
   */
  disconnect(): void {
    this.isConnected = false;
    this.connections.clear();
    console.log('Disconnected from P2P network');
  }
}

export default P2PNetworkService;
