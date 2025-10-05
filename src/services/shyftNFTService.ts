import { 
  Connection, 
  PublicKey, 
  Keypair, 
  Transaction,
  SystemProgram
} from '@solana/web3.js';
import { WalletContextState } from '@solana/wallet-adapter-react';

// Shyft NFT Service for Message NFTs
// Uses Shyft API to create real NFTs that appear as collectibles

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

export class ShyftNFTService {
  private connection: Connection;
  private shyftApiKey: string;
  private shyftBaseUrl: string;

  constructor(connection: Connection) {
    this.connection = connection;
    // You'll need to get a free API key from https://shyft.to
    this.shyftApiKey = process.env.REACT_APP_SHYFT_API_KEY || 'YOUR_SHYFT_API_KEY';
    this.shyftBaseUrl = 'https://api.shyft.to';
    
    console.log('Shyft API Key:', this.shyftApiKey === 'YOUR_SHYFT_API_KEY' ? 'NOT SET' : 'SET');
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
   * Upload image to Shyft and get URI
   */
  private async uploadImageToShyft(imageData: string): Promise<string> {
    try {
      const response = await fetch(`${this.shyftBaseUrl}/v1/upload`, {
        method: 'POST',
        headers: {
          'x-api-key': this.shyftApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to upload image: ${response.statusText}`);
      }

      const result = await response.json();
      return result.uri;
    } catch (error) {
      console.error('Error uploading image to Shyft:', error);
      // Fallback to data URI
      return imageData;
    }
  }

  /**
   * Create NFT metadata and upload to Shyft
   */
  private async createAndUploadMetadata(metadata: MessageMetadata): Promise<string> {
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

    try {
      // Upload metadata to Shyft
      const response = await fetch(`${this.shyftBaseUrl}/v1/upload`, {
        method: 'POST',
        headers: {
          'x-api-key': this.shyftApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: nftMetadata
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to upload metadata: ${response.statusText}`);
      }

      const result = await response.json();
      return result.uri;
    } catch (error) {
      console.error('Error uploading metadata to Shyft:', error);
      // Fallback to data URI
      return `data:application/json;base64,${btoa(JSON.stringify(nftMetadata))}`;
    }
  }

  /**
   * Mint a real NFT using Shyft API
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

      // Check if Shyft API key is set
      if (this.shyftApiKey === 'YOUR_SHYFT_API_KEY') {
        console.log('Shyft API key not set, falling back to SOL transfer + mock NFT');
        return await this.createMockNFTWithSOLTransfer(walletState, recipientAddress, content, messageType);
      }

      // Create metadata
      const metadata = this.createMessageMetadata(
        walletState.publicKey.toString(),
        recipientAddress,
        content,
        messageType
      );

      // Upload metadata and get URI
      const metadataUri = await this.createAndUploadMetadata(metadata);
      const imageUri = this.createMessageImage(metadata.content, metadata.messageType);

      // Create NFT using Shyft API
      const createNFTResponse = await fetch(`${this.shyftBaseUrl}/v1/nft/create`, {
        method: 'POST',
        headers: {
          'x-api-key': this.shyftApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          network: 'devnet',
          wallet: walletState.publicKey.toString(),
          name: `Message from ${walletState.publicKey.toString().substring(0, 8)}...`,
          symbol: 'MSG',
          description: content,
          image: imageUri,
          attributes: [
            {
              trait_type: 'Sender',
              value: walletState.publicKey.toString()
            },
            {
              trait_type: 'Recipient', 
              value: recipientAddress
            },
            {
              trait_type: 'Message Type',
              value: messageType
            },
            {
              trait_type: 'Timestamp',
              value: metadata.timestamp.toString()
            }
          ],
          receiver: recipientAddress
        })
      });

      if (!createNFTResponse.ok) {
        const errorText = await createNFTResponse.text();
        throw new Error(`Failed to create NFT: ${errorText}`);
      }

      const nftResult = await createNFTResponse.json();

      // Sign and send the transaction
      const transaction = Transaction.from(Buffer.from(nftResult.encoded_transaction, 'base64'));
      const signedTransaction = await walletState.signTransaction(transaction);
      const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());

      // Wait for confirmation
      await this.connection.confirmTransaction(signature);

      return {
        mint: nftResult.mint,
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
   * Fallback method when Shyft API key is not available
   */
  private async createMockNFTWithSOLTransfer(
    walletState: WalletContextState,
    recipientAddress: string,
    content: string,
    messageType: 'text' | 'image' | 'file' = 'text'
  ): Promise<MessageNFTResult> {
    // Create a mock mint address
    const mockMint = Keypair.generate().publicKey.toString();
    
    // Create metadata
    const metadata = this.createMessageMetadata(
      walletState.publicKey!.toString(),
      recipientAddress,
      content,
      messageType
    );
    
    const metadataUri = `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
    const imageUri = this.createMessageImage(metadata.content, metadata.messageType);

    // Create and send a SOL transfer as verification
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: walletState.publicKey!,
        toPubkey: new PublicKey(recipientAddress),
        lamports: 100000, // 0.0001 SOL
      })
    );

    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletState.publicKey!;

    // Sign and send transaction
    const signedTransaction = await walletState.signTransaction!(transaction);
    const signature = await this.connection.sendRawTransaction(signedTransaction.serialize());

    return {
      mint: mockMint,
      signature,
      metadataUri,
      imageUri,
    };
  }

  /**
   * Get NFT metadata
   */
  async getNFTMetadata(mintAddress: string): Promise<MessageMetadata | null> {
    try {
      const response = await fetch(`${this.shyftBaseUrl}/v1/nft/read?network=devnet&token_address=${mintAddress}`, {
        headers: {
          'x-api-key': this.shyftApiKey,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch NFT metadata: ${response.statusText}`);
      }

      const nftData = await response.json();
      
      // Extract message metadata from NFT attributes
      const sender = nftData.attributes?.find((attr: { trait_type: string; value: string }) => attr.trait_type === 'Sender')?.value || 'Unknown';
      const recipient = nftData.attributes?.find((attr: { trait_type: string; value: string }) => attr.trait_type === 'Recipient')?.value || 'Unknown';
      const messageType = nftData.attributes?.find((attr: { trait_type: string; value: string }) => attr.trait_type === 'Message Type')?.value || 'text';
      const timestamp = nftData.attributes?.find((attr: { trait_type: string; value: string }) => attr.trait_type === 'Timestamp')?.value || Date.now().toString();

      return {
        sender,
        recipient,
        content: nftData.description || 'No content',
        timestamp: parseInt(timestamp),
        messageType: messageType as 'text' | 'image' | 'file'
      };
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
    }
  }
}

// Export singleton instance
export const shyftNFTService = new ShyftNFTService(
  new Connection('https://api.devnet.solana.com', 'confirmed')
);
