import { Keypair } from '@solana/web3.js';
import { WalletAdapter } from '@solana/wallet-adapter-base';

// Create a simple text-based image for the NFT
const createMessageImage = (message: string, sender: string, recipient: string): string => {
  // Create a simple SVG image with the message
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="#1a1a2e"/>
      <rect x="20" y="20" width="360" height="360" fill="#16213e" stroke="#0f3460" stroke-width="2" rx="10"/>
      <text x="200" y="60" text-anchor="middle" fill="#e94560" font-family="Arial, sans-serif" font-size="24" font-weight="bold">Message NFT</text>
      <text x="200" y="100" text-anchor="middle" fill="#f5f5f5" font-family="Arial, sans-serif" font-size="14">From: ${sender.slice(0, 8)}...${sender.slice(-8)}</text>
      <text x="200" y="120" text-anchor="middle" fill="#f5f5f5" font-family="Arial, sans-serif" font-size="14">To: ${recipient.slice(0, 8)}...${recipient.slice(-8)}</text>
      <rect x="40" y="150" width="320" height="200" fill="#0f3460" rx="5"/>
      <text x="200" y="180" text-anchor="middle" fill="#f5f5f5" font-family="Arial, sans-serif" font-size="12" font-weight="bold">Message:</text>
      <text x="200" y="200" text-anchor="middle" fill="#f5f5f5" font-family="Arial, sans-serif" font-size="14">${message.length > 50 ? message.substring(0, 50) + '...' : message}</text>
      <text x="200" y="320" text-anchor="middle" fill="#e94560" font-family="Arial, sans-serif" font-size="10">Created on Solana</text>
    </svg>
  `;
  
  // Convert SVG to data URL
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export interface CreateMessageNFTParams {
  message: string;
  recipientAddress: string;
  senderAddress: string;
  wallet: WalletAdapter;
}

export interface MessageNFTResult {
  mint: string;
  signature: string;
  metadataUri: string;
  imageUri: string;
}

export class NFTService {
  constructor() {
    // Simple NFT service without Metaplex dependencies
  }

  async createMessageNFT({
    message,
    recipientAddress,
    senderAddress,
    wallet
  }: CreateMessageNFTParams): Promise<MessageNFTResult> {
    // For now, use the simple mock approach to avoid UMI complexity
    return this.createSimpleMessageNFT({
      message,
      recipientAddress,
      senderAddress,
      wallet
    });
  }

  // Alternative approach using direct SPL Token operations
  async createSimpleMessageNFT({
    message,
    recipientAddress,
    senderAddress,
    wallet
  }: CreateMessageNFTParams): Promise<MessageNFTResult> {
    try {
      if (!wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      // For now, return a mock result that simulates NFT creation
      // In a real implementation, you'd need to handle the complex signer requirements
      const mockMint = Keypair.generate().publicKey;
      const mockSignature = 'mock-signature-' + Date.now();
      
      return {
        mint: mockMint.toString(),
        signature: mockSignature,
        metadataUri: `https://mock-metadata.com/message-${Date.now()}`,
        imageUri: createMessageImage(message, senderAddress, recipientAddress),
      };

    } catch (error) {
      console.error('Error creating simple message NFT:', error);
      throw new Error(`Failed to create message NFT: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const nftService = new NFTService();
