/**
 * WebRTC Service for Direct P2P Connections
 * Handles WebRTC peer connections with STUN/TURN support
 * Mobile and web compatible
 */

import P2P_CONFIG from '../config/p2pConfig';

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
  enableSTUN: boolean;
  enableTURN: boolean;
}

export interface PeerConnection {
  peerId: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel;
  status: 'connecting' | 'connected' | 'disconnected' | 'failed';
}

export class WebRTCService {
  private config: WebRTCConfig;
  private connections: Map<string, PeerConnection> = new Map();
  private localPeerId: string;

  constructor(config?: WebRTCConfig) {
    this.config = config || P2P_CONFIG.WEBRTC;
    this.localPeerId = this.generatePeerId();
  }

  /**
   * Create a new peer connection
   */
  async createPeerConnection(remotePeerId: string): Promise<PeerConnection> {
    try {
      const connection = new RTCPeerConnection({
        iceServers: this.config.iceServers
      });

      // Create data channel for messaging
      const dataChannel = connection.createDataChannel('messages', {
        ordered: true
      });

      // Set up connection event handlers
      this.setupConnectionHandlers(connection, remotePeerId);

      const peerConnection: PeerConnection = {
        peerId: remotePeerId,
        connection,
        dataChannel,
        status: 'connecting'
      };

      this.connections.set(remotePeerId, peerConnection);
      
      console.log(`Created peer connection for ${remotePeerId}`);
      return peerConnection;
    } catch (error) {
      console.error('Failed to create peer connection:', error);
      throw error;
    }
  }

  /**
   * Set up connection event handlers
   */
  private setupConnectionHandlers(connection: RTCPeerConnection, peerId: string): void {
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.handleIceCandidate(event.candidate, peerId);
      }
    };

    connection.ondatachannel = (event) => {
      const channel = event.channel;
      this.setupDataChannelHandlers(channel, peerId);
    };

    connection.onconnectionstatechange = () => {
      this.handleConnectionStateChange(connection, peerId);
    };

    connection.oniceconnectionstatechange = () => {
      this.handleIceConnectionStateChange(connection, peerId);
    };
  }

  /**
   * Set up data channel event handlers
   */
  private setupDataChannelHandlers(channel: RTCDataChannel, peerId: string): void {
    channel.onopen = () => {
      console.log(`Data channel opened for ${peerId}`);
      const peerConnection = this.connections.get(peerId);
      if (peerConnection) {
        peerConnection.status = 'connected';
      }
    };

    channel.onmessage = (event) => {
      this.handleDataChannelMessage(event.data, peerId);
    };

    channel.onclose = () => {
      console.log(`Data channel closed for ${peerId}`);
      const peerConnection = this.connections.get(peerId);
      if (peerConnection) {
        peerConnection.status = 'disconnected';
      }
    };

    channel.onerror = (error) => {
      console.error(`Data channel error for ${peerId}:`, error);
      const peerConnection = this.connections.get(peerId);
      if (peerConnection) {
        peerConnection.status = 'failed';
      }
    };
  }

  /**
   * Handle ICE candidate
   */
  private handleIceCandidate(candidate: RTCIceCandidate, peerId: string): void {
    // In production, this would send the ICE candidate to the remote peer
    console.log(`ICE candidate for ${peerId}:`, candidate);
  }

  /**
   * Handle connection state change
   */
  private handleConnectionStateChange(connection: RTCPeerConnection, peerId: string): void {
    console.log(`Connection state changed for ${peerId}:`, connection.connectionState);
    
    const peerConnection = this.connections.get(peerId);
    if (peerConnection) {
      switch (connection.connectionState) {
        case 'connected':
          peerConnection.status = 'connected';
          break;
        case 'disconnected':
        case 'closed':
          peerConnection.status = 'disconnected';
          break;
        case 'failed':
          peerConnection.status = 'failed';
          break;
      }
    }
  }

  /**
   * Handle ICE connection state change
   */
  private handleIceConnectionStateChange(connection: RTCPeerConnection, peerId: string): void {
    console.log(`ICE connection state changed for ${peerId}:`, connection.iceConnectionState);
  }

  /**
   * Handle data channel message
   */
  private handleDataChannelMessage(data: string, peerId: string): void {
    try {
      const message = JSON.parse(data);
      console.log(`Received message from ${peerId}:`, message);
      
      // In production, this would handle the message according to its type
    } catch (error) {
      console.error('Failed to parse data channel message:', error);
    }
  }

  /**
   * Send message via data channel
   */
  async sendMessage(message: any, peerId: string): Promise<boolean> {
    try {
      const peerConnection = this.connections.get(peerId);
      if (!peerConnection || peerConnection.status !== 'connected') {
        console.warn(`No active connection to ${peerId}`);
        return false;
      }

      const data = JSON.stringify(message);
      peerConnection.dataChannel.send(data);
      
      console.log(`Sent message to ${peerId}:`, message);
      return true;
    } catch (error) {
      console.error('Failed to send message:', error);
      return false;
    }
  }

  /**
   * Create offer for peer connection
   */
  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    try {
      const peerConnection = this.connections.get(peerId);
      if (!peerConnection) {
        throw new Error('Peer connection not found');
      }

      const offer = await peerConnection.connection.createOffer();
      await peerConnection.connection.setLocalDescription(offer);
      
      console.log(`Created offer for ${peerId}`);
      return offer;
    } catch (error) {
      console.error('Failed to create offer:', error);
      throw error;
    }
  }

  /**
   * Create answer for peer connection
   */
  async createAnswer(peerId: string): Promise<RTCSessionDescriptionInit> {
    try {
      const peerConnection = this.connections.get(peerId);
      if (!peerConnection) {
        throw new Error('Peer connection not found');
      }

      const answer = await peerConnection.connection.createAnswer();
      await peerConnection.connection.setLocalDescription(answer);
      
      console.log(`Created answer for ${peerId}`);
      return answer;
    } catch (error) {
      console.error('Failed to create answer:', error);
      throw error;
    }
  }

  /**
   * Set remote description
   */
  async setRemoteDescription(peerId: string, description: RTCSessionDescriptionInit): Promise<void> {
    try {
      const peerConnection = this.connections.get(peerId);
      if (!peerConnection) {
        throw new Error('Peer connection not found');
      }

      await peerConnection.connection.setRemoteDescription(description);
      console.log(`Set remote description for ${peerId}`);
    } catch (error) {
      console.error('Failed to set remote description:', error);
      throw error;
    }
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    try {
      const peerConnection = this.connections.get(peerId);
      if (!peerConnection) {
        throw new Error('Peer connection not found');
      }

      await peerConnection.connection.addIceCandidate(candidate);
      console.log(`Added ICE candidate for ${peerId}`);
    } catch (error) {
      console.error('Failed to add ICE candidate:', error);
      throw error;
    }
  }

  /**
   * Close peer connection
   */
  closeConnection(peerId: string): void {
    const peerConnection = this.connections.get(peerId);
    if (peerConnection) {
      peerConnection.connection.close();
      peerConnection.status = 'disconnected';
      this.connections.delete(peerId);
      console.log(`Closed connection to ${peerId}`);
    }
  }

  /**
   * Get connection statistics
   */
  getConnectionStats(): { total: number; connected: number; connecting: number; failed: number } {
    const total = this.connections.size;
    let connected = 0;
    let connecting = 0;
    let failed = 0;
    
    for (const connection of Array.from(this.connections.values())) {
      switch (connection.status) {
        case 'connected':
          connected++;
          break;
        case 'connecting':
          connecting++;
          break;
        case 'failed':
          failed++;
          break;
      }
    }
    
    return { total, connected, connecting, failed };
  }

  /**
   * Generate unique peer ID
   */
  private generatePeerId(): string {
    return `peer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get local peer ID
   */
  getLocalPeerId(): string {
    return this.localPeerId;
  }

  /**
   * Clean up all connections
   */
  cleanup(): void {
    for (const [, connection] of Array.from(this.connections.entries())) {
      connection.connection.close();
    }
    this.connections.clear();
    console.log('Cleaned up all WebRTC connections');
  }
}

export default WebRTCService;
