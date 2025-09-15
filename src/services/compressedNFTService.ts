import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction,
  SystemProgram
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Compressed NFT (cNFT) Service for Message NFTs
// Uses Bubblegum program directly without Metaplex SDK

export interface MessageMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  properties: {
    sender: string;
    recipient: string;
    content: string;
    timestamp: number;
    messageType: 'text' | 'image' | 'file';
  };
}

export interface CompressedNFTResult {
  mint: string;
  signature: string;
  metadataUri: string;
  imageUri: string;
}

export class CompressedNFTService {
  private connection: Connection;
  private bubblegumProgramId: PublicKey;

  constructor() {
    this.connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    // Bubblegum program ID for compressed NFTs
    this.bubblegumProgramId = new PublicKey('BGUMAp9Gq7iTEuizy4pqaxsTyUCBK68MDfK752saRPUY');
  }

  /**
   * Create message metadata for compressed NFT
   */
  private createMessageMetadata(
    sender: string,
    recipient: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ): MessageMetadata {
    return {
      name: `Message from ${sender.slice(0, 8)}...`,
      description: `OnChain message sent to ${recipient.slice(0, 8)}...`,
      image: this.generateMessageImage(content, sender, recipient),
      attributes: [
        {
          trait_type: 'Sender',
          value: sender,
        },
        {
          trait_type: 'Recipient',
          value: recipient,
        },
        {
          trait_type: 'Message Type',
          value: messageType,
        },
        {
          trait_type: 'Timestamp',
          value: Date.now().toString(),
        },
      ],
      properties: {
        sender,
        recipient,
        content,
        timestamp: Date.now(),
        messageType,
      },
    };
  }

  /**
   * Generate SVG image for the message NFT
   */
  private generateMessageImage(content: string, sender: string, recipient: string): string {
    const svg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="400" fill="#1a1a2e"/>
        <rect x="20" y="20" width="360" height="360" fill="#16213e" stroke="#0f3460" stroke-width="2" rx="10"/>
        <text x="200" y="60" text-anchor="middle" fill="#e94560" font-family="Arial, sans-serif" font-size="24" font-weight="bold">Message NFT</text>
        <text x="200" y="100" text-anchor="middle" fill="#f5f5f5" font-family="Arial, sans-serif" font-size="14">From: ${sender.slice(0, 8)}...${sender.slice(-8)}</text>
        <text x="200" y="120" text-anchor="middle" fill="#f5f5f5" font-family="Arial, sans-serif" font-size="14">To: ${recipient.slice(0, 8)}...${recipient.slice(-8)}</text>
        <rect x="40" y="150" width="320" height="200" fill="#0f3460" rx="5"/>
        <text x="200" y="180" text-anchor="middle" fill="#f5f5f5" font-family="Arial, sans-serif" font-size="12" font-weight="bold">Message:</text>
        <text x="200" y="200" text-anchor="middle" fill="#f5f5f5" font-family="Arial, sans-serif" font-size="14">${content.length > 50 ? content.substring(0, 50) + '...' : content}</text>
        <text x="200" y="320" text-anchor="middle" fill="#e94560" font-family="Arial, sans-serif" font-size="10">Compressed NFT on Solana</text>
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Upload metadata to a simple storage (for now, use data URI)
   * In production, upload to IPFS/Arweave
   */
  private async uploadMetadata(metadata: MessageMetadata): Promise<string> {
    // For now, use data URI
    // In production, upload to IPFS/Arweave and return the URI
    return `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
  }

  /**
   * Mint a compressed NFT for a message
   * This is a simplified implementation - in production you'd use actual Bubblegum instructions
   */
  async mintMessageNFT(
    walletState: WalletContextState,
    recipientAddress: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ): Promise<CompressedNFTResult> {
    try {
      if (!walletState.publicKey || !walletState.signTransaction) {
        throw new Error('Wallet not connected or does not support transaction signing');
      }

      // Create metadata
      const metadata = this.createMessageMetadata(
        walletState.publicKey.toString(),
        recipientAddress,
        content,
        messageType
      );

      // Upload metadata
      const metadataUri = await this.uploadMetadata(metadata);
      const imageUri = metadata.image;

      // For now, create a mock compressed NFT
      // In production, you would:
      // 1. Create a Merkle tree for the compressed NFT
      // 2. Use Bubblegum program to mint the cNFT
      // 3. Transfer to recipient's wallet
      
      const mockMint = Keypair.generate().publicKey;

      // Also send a small SOL transfer as verification
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: walletState.publicKey,
          toPubkey: new PublicKey(recipientAddress),
          lamports: 100000, // 0.0001 SOL
        })
      );

      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = walletState.publicKey;

      // Sign and send transaction
      const signedTransaction = await walletState.signTransaction(transaction);
      const transferSignature = await this.connection.sendRawTransaction(signedTransaction.serialize());

      return {
        mint: mockMint.toString(),
        signature: transferSignature,
        metadataUri,
        imageUri,
      };

    } catch (error) {
      console.error('Error minting compressed NFT:', error);
      throw new Error(`Failed to mint message NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get messages for a wallet using indexing service
   * In production, this would query Helius/Triton/Shyft
   */
  async getMessagesForWallet(walletAddress: string): Promise<any[]> {
    try {
      // For now, return mock data
      // In production, query indexing service:
      // const response = await fetch(`https://api.helius.xyz/v0/addresses/${walletAddress}/nfts?api-key=YOUR_KEY`);
      // const nfts = await response.json();
      // return nfts.filter(nft => nft.content.metadata.attributes.some(attr => attr.trait_type === 'Message Type'));
      
      return [
        {
          mint: 'mock-mint-1',
          sender: 'sender-address',
          recipient: walletAddress,
          content: 'Hello! This is a test message.',
          timestamp: Date.now() - 3600000,
          image: 'data:image/svg+xml;base64,...',
        }
      ];
    } catch (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
  }

  /**
   * Validate Solana address
   */
  isValidAddress(address: string): boolean {
    try {
      new PublicKey(address);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }
}

export const compressedNFTService = new CompressedNFTService();
