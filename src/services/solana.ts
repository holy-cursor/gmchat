import {
  Connection,
  PublicKey,
  Keypair,
} from '@solana/web3.js';
import { MessageMetadata } from '../types';

// Initialize connection
const connection = new Connection(
  process.env.REACT_APP_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  'confirmed'
);

export class SolanaService {
  private connection: Connection;

  constructor() {
    this.connection = connection;
  }

  /**
   * Create message metadata for NFT
   */
  async createMessageMetadata(
    sender: string,
    recipient: string,
    content: string
  ): Promise<string> {
    const metadata: MessageMetadata = {
      name: `Message from ${sender.slice(0, 8)}...`,
      description: `OnChain message sent to ${recipient.slice(0, 8)}...`,
      image: 'https://via.placeholder.com/400x400/8b5cf6/ffffff?text=Message',
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
          trait_type: 'Timestamp',
          value: Date.now().toString(),
        },
      ],
      properties: {
        sender,
        recipient,
        content,
        timestamp: Date.now(),
      },
    };

    // For now, we'll use a data URI for metadata
    // In production, you would upload to IPFS/Bundlr
    return `data:application/json;base64,${btoa(JSON.stringify(metadata))}`;
  }

  /**
   * Mint a message as NFT and transfer to recipient
   * Simplified implementation without Metaplex
   */
  async mintMessageNFT(
    senderKeypair: Keypair,
    recipientAddress: string,
    content: string
  ): Promise<{ mint: string; signature: string }> {
    try {
      // Create metadata URI
      const metadataUri = await this.createMessageMetadata(
        senderKeypair.publicKey.toString(),
        recipientAddress,
        content
      );

      // For now, return a mock result
      // In a real implementation, you would create the NFT using SPL Token Program
      const mockMint = Keypair.generate().publicKey;
      const mockSignature = 'mock-signature-' + Date.now();

      return {
        mint: mockMint.toString(),
        signature: mockSignature,
      };
    } catch (error) {
      console.error('Error minting message NFT:', error);
      throw new Error(`Failed to mint message NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get messages for a wallet address (inbox)
   */
  async getInboxMessages(walletAddress: string): Promise<any[]> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        {
          programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        }
      );

      // Filter for message NFTs and fetch their metadata
      const messageNFTs = [];
      
      for (const account of tokenAccounts.value) {
        if (account.account.data.parsed.info.tokenAmount.uiAmount > 0) {
          const mint = account.account.data.parsed.info.mint;
          
          try {
            // Get NFT metadata
            const metadata = await this.getNFTMetadata(mint);
            if (metadata && metadata.properties) {
              messageNFTs.push({
                mint,
                amount: account.account.data.parsed.info.tokenAmount.uiAmount,
                account: account.pubkey.toString(),
                metadata,
                sender: metadata.properties.sender,
                recipient: metadata.properties.recipient,
                content: metadata.properties.content,
                timestamp: metadata.properties.timestamp,
              });
            }
          } catch (error) {
            console.warn(`Failed to fetch metadata for mint ${mint}:`, error);
          }
        }
      }

      return messageNFTs;
    } catch (error) {
      console.error('Error fetching inbox messages:', error);
      return [];
    }
  }

  /**
   * Get sent messages for a wallet address (outbox)
   */
  async getOutboxMessages(walletAddress: string): Promise<any[]> {
    try {
      const publicKey = new PublicKey(walletAddress);
      const signatures = await this.connection.getSignaturesForAddress(publicKey, {
        limit: 50,
      });

      // Filter for successful transactions and try to extract NFT creation info
      const messageTransactions = [];
      
      for (const sig of signatures) {
        if (sig.err === null) {
          try {
            // Get transaction details
            const transaction = await this.connection.getTransaction(sig.signature, {
              commitment: 'confirmed',
            });
            
            if (transaction) {
              // Look for NFT creation in transaction logs
              // This is a simplified approach - in production you'd parse the transaction more carefully
              messageTransactions.push({
                signature: sig.signature,
                timestamp: sig.blockTime ? sig.blockTime * 1000 : Date.now(),
                slot: sig.slot,
                // These would be extracted from transaction logs in a real implementation
                mint: 'Unknown',
                recipient: 'Unknown',
                content: 'Message content would be extracted from transaction',
              });
            }
          } catch (error) {
            console.warn(`Failed to fetch transaction ${sig.signature}:`, error);
          }
        }
      }

      return messageTransactions;
    } catch (error) {
      console.error('Error fetching outbox messages:', error);
      return [];
    }
  }

  /**
   * Get NFT metadata from blockchain
   */
  async getNFTMetadata(mintAddress: string): Promise<MessageMetadata | null> {
    try {
      // Simplified implementation - return mock metadata
      // In a real implementation, you would fetch from the blockchain
      return {
        name: 'Message NFT',
        description: 'An onchain message',
        image: 'https://via.placeholder.com/400x400/8b5cf6/ffffff?text=Message',
        attributes: [],
        properties: {
          sender: '',
          recipient: '',
          content: 'Message content would be here',
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error('Error fetching NFT metadata:', error);
      return null;
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

export const solanaService = new SolanaService();
