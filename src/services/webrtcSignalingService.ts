/**
 * WebRTC Signaling Service
 * Enables peer discovery for browser-to-browser P2P communication
 * Uses a simple signaling server approach for peer discovery
 */

export interface SignalingConfig {
  signalingServerUrl: string;
  roomId: string;
  peerId: string;
}

export interface PeerInfo {
  peerId: string;
  walletAddress: string;
  multiaddrs: string[];
  lastSeen: number;
}

export class WebRTCSignalingService {
  private ws: WebSocket | null = null;
  private config: SignalingConfig;
  private isConnected = false;
  private peers = new Map<string, PeerInfo>();
  private messageHandlers: ((message: any) => void)[] = [];

  constructor(config: SignalingConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.isConnected) {
      console.log('⚠️ Signaling: Already connected');
      return;
    }

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.config.signalingServerUrl}/ws?room=${this.config.roomId}&peer=${this.config.peerId}`;
        console.log('🔗 Signaling: Connecting to:', wsUrl);
        console.log('🔗 Signaling: Base URL:', this.config.signalingServerUrl);
        
        this.ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          console.error('❌ Signaling: Connection timeout');
          reject(new Error('Signaling connection timeout'));
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('✅ Signaling: Connected successfully');
          this.isConnected = true;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleSignalingMessage(data);
          } catch (error) {
            console.error('❌ Signaling: Error parsing message:', error);
          }
        };

        this.ws.onclose = () => {
          console.log('🔌 Signaling: Connection closed');
          this.isConnected = false;
          this.peers.clear();
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.error('❌ Signaling: WebSocket error:', error);
          console.error('❌ Signaling: Error details:', {
            url: wsUrl,
            readyState: this.ws?.readyState,
            error: error
          });
          reject(error);
        };

      } catch (error) {
        console.error('❌ Signaling: Failed to connect:', error);
        reject(error);
      }
    });
  }

  private handleSignalingMessage(data: any): void {
    switch (data.type) {
      case 'peer-joined':
        console.log('👋 Signaling: Peer joined:', data.peerId);
        this.peers.set(data.peerId, {
          peerId: data.peerId,
          walletAddress: data.walletAddress || '',
          multiaddrs: data.multiaddrs || [],
          lastSeen: Date.now()
        });
        this.notifyHandlers({ type: 'peer-discovered', peer: data });
        break;

      case 'peer-left':
        console.log('👋 Signaling: Peer left:', data.peerId);
        this.peers.delete(data.peerId);
        this.notifyHandlers({ type: 'peer-left', peerId: data.peerId });
        break;

      case 'peer-list':
        console.log('📋 Signaling: Received peer list:', data.peers.length);
        data.peers.forEach((peer: PeerInfo) => {
          this.peers.set(peer.peerId, peer);
        });
        this.notifyHandlers({ type: 'peers-updated', peers: Array.from(this.peers.values()) });
        break;

      case 'offer':
      case 'answer':
      case 'ice-candidate':
        // Forward WebRTC signaling messages
        this.notifyHandlers(data);
        break;

      default:
        console.log('📨 Signaling: Unknown message type:', data.type);
    }
  }

  private notifyHandlers(message: any): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('❌ Signaling: Error in message handler:', error);
      }
    });
  }

  announcePeer(walletAddress: string, multiaddrs: string[]): void {
    if (!this.isConnected || !this.ws) {
      console.warn('⚠️ Signaling: Not connected, cannot announce peer');
      return;
    }

    const message = {
      type: 'announce',
      peerId: this.config.peerId,
      walletAddress,
      multiaddrs,
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(message));
    console.log('📢 Signaling: Announced peer:', this.config.peerId);
  }

  getDiscoveredPeers(): PeerInfo[] {
    return Array.from(this.peers.values());
  }

  onMessage(handler: (message: any) => void): void {
    this.messageHandlers.push(handler);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.peers.clear();
    console.log('🔌 Signaling: Disconnected');
  }

  isReady(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}

export default WebRTCSignalingService;

