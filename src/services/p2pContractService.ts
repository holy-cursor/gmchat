/**
 * Base Contract Interface for P2P Message Anchoring
 * TypeScript interface for interacting with P2PMessageAnchor.sol
 */

export interface BatchAnchor {
  batchId: string;
  merkleRoot: string;
  messageCount: number;
  timestamp: number;
  sender: string;
  blockNumber: number;
}

export interface MessageProof {
  messageId: string;
  merkleProof: string[];
  index: number;
}

export interface ContractStats {
  totalBatches: number;
  totalMessages: number;
  version: number;
}

export class P2PContractService {
  private contractAddress: string;
  private provider: any; // ethers.js provider
  private contract: any; // ethers.js contract instance

  constructor(contractAddress: string, provider: any) {
    this.contractAddress = contractAddress;
    this.provider = provider;
    // Initialize contract instance here
  }

  /**
   * Anchor a batch of messages to the blockchain
   */
  async anchorBatch(
    batchId: string,
    merkleRoot: string,
    messageCount: number
  ): Promise<string> {
    try {
      const tx = await this.contract.anchorBatch(
        batchId,
        merkleRoot,
        messageCount
      );
      
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      console.error('Failed to anchor batch:', error);
      throw new Error('Batch anchoring failed');
    }
  }

  /**
   * Verify a message exists in a batch
   */
  async verifyMessage(
    messageId: string,
    batchId: string,
    proof: string[],
    index: number
  ): Promise<boolean> {
    try {
      const result = await this.contract.verifyMessage(
        messageId,
        batchId,
        proof,
        index
      );
      
      return result;
    } catch (error) {
      console.error('Failed to verify message:', error);
      return false;
    }
  }

  /**
   * Get batch information
   */
  async getBatch(batchId: string): Promise<BatchAnchor | null> {
    try {
      const batch = await this.contract.getBatch(batchId);
      
      return {
        batchId: batch.batchId,
        merkleRoot: batch.merkleRoot,
        messageCount: batch.messageCount.toNumber(),
        timestamp: batch.timestamp.toNumber(),
        sender: batch.sender,
        blockNumber: batch.blockNumber.toNumber()
      };
    } catch (error) {
      console.error('Failed to get batch:', error);
      return null;
    }
  }

  /**
   * Check if a message has been verified
   */
  async isMessageVerified(messageId: string): Promise<boolean> {
    try {
      return await this.contract.isMessageVerified(messageId);
    } catch (error) {
      console.error('Failed to check message verification:', error);
      return false;
    }
  }

  /**
   * Get contract statistics
   */
  async getStats(): Promise<ContractStats> {
    try {
      const stats = await this.contract.getStats();
      
      return {
        totalBatches: stats._totalBatches.toNumber(),
        totalMessages: stats._totalMessages.toNumber(),
        version: stats._version.toNumber()
      };
    } catch (error) {
      console.error('Failed to get contract stats:', error);
      throw new Error('Failed to get contract statistics');
    }
  }
}

export default P2PContractService;
