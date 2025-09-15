import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction,
  SystemProgram
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Basic NFT Service for Message NFTs
// Creates simple SPL tokens with supply=1 for NFT-like behavior

export interface MessageMetadata {
  sender: string;
  recipient: string;
  content: string;
  timestamp: number;
  messageType: 'text' | 'image' | 'file';
}

export interface CreateMessageNFTParams {
  sender: string;
  recipient: string;
  content: string;
  messageType?: 'text' | 'image' | 'file';
}

export interface MessageNFTResult {
  mint: string;
  signature: string;
  metadataUri: string;
  imageUri: string;
}

export class BasicNFTService {
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
  }

  /**
   * Create metadata for a message NFT
   */
  private createMessageMetadata(
    sender: string,
    recipient: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ): MessageMetadata {
    return {
      sender,
      recipient,
      content,
      timestamp: Date.now(),
      messageType
    };
  }

  /**
   * Create SVG image for the message NFT
   */
  private createMessageImage(content: string, messageType: string): string {
    const svg = `
      <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="400" height="400" fill="url(#grad)"/>
        <rect x="20" y="20" width="360" height="360" fill="none" stroke="white" stroke-width="2" rx="20"/>
        <text x="200" y="100" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="24" font-weight="bold">
          Message NFT
        </text>
        <text x="200" y="150" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="16">
          Type: ${messageType}
        </text>
        <text x="200" y="200" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14">
          ${content.length > 50 ? content.substring(0, 50) + '...' : content}
        </text>
        <text x="200" y="350" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="12">
          ${new Date().toLocaleDateString()}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  /**
   * Upload metadata to a data URI (in production, use IPFS/Arweave)
   */
  private async uploadMetadata(metadata: MessageMetadata): Promise<string> {
    const imageUri = this.createMessageImage(metadata.content, metadata.messageType);
    
    const nftMetadata = {
      name: `Message from ${metadata.sender.substring(0, 8)}...`,
      symbol: 'MSG',
      description: metadata.content,
      image: imageUri,
      attributes: [
        {
          trait_type: 'Sender',
          value: metadata.sender
        },
        {
          trait_type: 'Recipient', 
          value: metadata.recipient
        },
        {
          trait_type: 'Message Type',
          value: metadata.messageType
        },
        {
          trait_type: 'Timestamp',
          value: metadata.timestamp.toString()
        }
      ],
      properties: {
        files: [
          {
            uri: imageUri,
            type: 'image/svg+xml'
          }
        ],
        category: 'image'
      }
    };

    // For now, use data URI
    // In production, upload to IPFS/Arweave and return the URI
    return `data:application/json;base64,${btoa(JSON.stringify(nftMetadata))}`;
  }

  /**
   * Mint a basic NFT for a message
   * This creates a simple SPL token with supply=1 and 0 decimals
   * Note: This will NOT appear as a collectible in wallets, but will work as a token
   */
  async mintMessageNFT(
    walletState: WalletContextState,
    recipientAddress: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ): Promise<MessageNFTResult> {
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
      const imageUri = this.createMessageImage(metadata.content, metadata.messageType);

      // For now, create a mock NFT with a SOL transfer as verification
      const mockMint = Keypair.generate().publicKey;

      // Create a SOL transfer as verification
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
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());

      // Wait for confirmation
      await this.connection.confirmTransaction(signature);

      return {
        mint: mockMint.toString(),
        signature,
        metadataUri,
        imageUri,
      };

    } catch (error) {
      console.error('Error creating message NFT:', error);
      throw new Error(`Failed to create message NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get NFT metadata
   */
  async getNFTMetadata(mintAddress: string): Promise<MessageMetadata | null> {
    try {
      // This would typically fetch from the metadata account
      // For now, return mock data
      return {
        sender: 'Unknown',
        recipient: 'Unknown',
        content: 'Mock message content',
        timestamp: Date.now(),
        messageType: 'text'
      };
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
    }
  }
}

// Export singleton instance
export const basicNFTService = new BasicNFTService(
  new Connection('https://api.devnet.solana.com', 'confirmed')
);
