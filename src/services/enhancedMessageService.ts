import IPFSService from './ipfsService';
import EnhancedEncryptionService, { EncryptedMessage, KeyPair } from './enhancedEncryptionService';
import SmartContractService from './smartContractService';
import { MessageStorageService } from './messageStorage';

export interface EnhancedMessageResult {
  hash: string;
  success: boolean;
  ipfsHash?: string;
  encryptedContent?: EncryptedMessage;
}

export class EnhancedMessageService {
  private static keyPairs: Map<string, KeyPair> = new Map();

  /**
   * Get or generate key pair for a wallet
   */
  private static getKeyPair(walletAddress: string): KeyPair {
    if (!this.keyPairs.has(walletAddress)) {
      const keyPair = EnhancedEncryptionService.generateKeyPair();
      this.keyPairs.set(walletAddress, keyPair);
    }
    return this.keyPairs.get(walletAddress)!;
  }

  /**
   * Send message with full on-chain + IPFS + encryption
   */
  static async sendMessage(
    sender: string,
    recipient: string,
    content: string,
    config: any,
    options: {
      useEncryption?: boolean;
      useIPFS?: boolean;
      useSmartContract?: boolean;
    } = {}
  ): Promise<EnhancedMessageResult> {
    const {
      useEncryption = false, // Disabled by default to avoid complexity
      useIPFS = true, // Enable IPFS for cross-device storage
      useSmartContract = false // Disabled by default since contract isn't deployed
    } = options;

    try {
      console.log('Sending enhanced message...', { sender, recipient, useEncryption, useIPFS, useSmartContract });

      let processedContent = content;
      let encryptedContent: EncryptedMessage | undefined;
      let ipfsHash: string | undefined;

      // Step 1: Encrypt message if requested
      if (useEncryption) {
        const senderKeyPair = this.getKeyPair(sender);
        const recipientKeyPair = this.getKeyPair(recipient);
        
        encryptedContent = await EnhancedEncryptionService.encryptMessage(
          content,
          senderKeyPair.privateKey,
          recipientKeyPair.publicKey
        );
        
        processedContent = JSON.stringify(encryptedContent);
        console.log('Message encrypted');
      }

      // Step 2: Upload to IPFS if requested
      if (useIPFS) {
        try {
          const ipfsResult = await IPFSService.uploadContent(processedContent);
          ipfsHash = ipfsResult.hash;
          console.log('Content uploaded to IPFS:', ipfsResult);
        } catch (error) {
          console.warn('IPFS upload failed, continuing without IPFS:', error);
          // Continue without IPFS - store content directly in transaction
        }
      }

      // Step 3: Send to smart contract if requested and available
      let transactionHash: string;
      if (useSmartContract && SmartContractService.isContractDeployed()) {
        if (!ipfsHash) {
          throw new Error('IPFS hash required for smart contract storage');
        }
        transactionHash = await SmartContractService.sendMessage(recipient, ipfsHash, config);
        console.log('Message stored on smart contract');
      } else {
        // Fallback to simple transaction with data
        const { sendTransaction } = await import('wagmi/actions');
        const { parseEther } = await import('viem');
        
        const data = ipfsHash 
          ? `0x${ipfsHash}` // Store IPFS hash in transaction data
          : `0x${Array.from(new TextEncoder().encode(processedContent))
              .map(b => b.toString(16).padStart(2, '0'))
              .join('')}`; // Store content directly if no IPFS

        transactionHash = await sendTransaction(config, {
          to: recipient as `0x${string}`,
          value: parseEther('0.0001'),
          data: data as `0x${string}`,
        });
        console.log('Message sent via transaction');
      }

      // Step 4: Store locally for immediate access
      MessageStorageService.storeMessage({
        sender,
        recipient,
        content: useEncryption ? '[Encrypted]' : content,
        messageType: 'text',
        transactionSignature: transactionHash,
        isEncrypted: useEncryption,
        ipfsHash: ipfsHash,
        encryptedContent: encryptedContent ? JSON.stringify(encryptedContent) : undefined
      });

      return {
        hash: transactionHash,
        success: true,
        ipfsHash,
        encryptedContent
      };

    } catch (error) {
      console.error('Enhanced message sending failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt and retrieve message content
   */
  static async retrieveMessage(
    message: any,
    recipientWallet: string
  ): Promise<string> {
    try {
      // If message is encrypted, decrypt it
      if (message.isEncrypted && message.encryptedContent) {
        const recipientKeyPair = this.getKeyPair(recipientWallet);
        const encryptedData = JSON.parse(message.encryptedContent);
        const senderPublicKey = new Uint8Array(
          encryptedData.publicKey.match(/.{2}/g)!.map((byte: string) => parseInt(byte, 16))
        );
        
        return await EnhancedEncryptionService.decryptMessage(
          encryptedData,
          recipientKeyPair.privateKey,
          senderPublicKey
        );
      }

      // If message has IPFS hash, retrieve from IPFS
      if (message.ipfsHash) {
        return await IPFSService.downloadContent(message.ipfsHash);
      }

      // Otherwise return stored content
      return message.content;
    } catch (error) {
      console.error('Message retrieval failed:', error);
      return message.content || '[Unable to decrypt]';
    }
  }

  /**
   * Sync messages from smart contract
   */
  static async syncMessagesFromContract(
    user1: string,
    user2: string,
    config: any
  ): Promise<void> {
    if (!SmartContractService.isContractDeployed()) {
      console.log('Smart contract not deployed, skipping sync');
      return;
    }

    try {
      const onChainMessages = await SmartContractService.getMessages(user1, user2, config);
      
      for (const onChainMsg of onChainMessages) {
        // Check if message already exists locally
        const existingMessages = MessageStorageService.getConversation(user1, user2);
        const exists = existingMessages?.messages.some(
          msg => msg.transactionSignature === onChainMsg.ipfsHash
        );

        if (!exists) {
          // Retrieve content from IPFS
          const content = await IPFSService.downloadContent(onChainMsg.ipfsHash);
          
          // Store locally
          MessageStorageService.storeMessage({
            sender: onChainMsg.sender,
            recipient: onChainMsg.recipient,
            content: content,
            messageType: 'text',
            transactionSignature: onChainMsg.ipfsHash,
            ipfsHash: onChainMsg.ipfsHash
          });
        }
      }
    } catch (error) {
      console.error('Message sync failed:', error);
    }
  }

  /**
   * Get message statistics
   */
  static async getMessageStats(
    user1: string,
    user2: string,
    config: any
  ): Promise<{
    localCount: number;
    onChainCount: number;
    ipfsCount: number;
  }> {
    const localMessages = MessageStorageService.getConversation(user1, user2);
    const localCount = localMessages?.messages.length || 0;
    
    let onChainCount = 0;
    if (SmartContractService.isContractDeployed()) {
      onChainCount = await SmartContractService.getMessageCount(user1, user2, config);
    }

    const ipfsCount = localMessages?.messages.filter((msg: any) => msg.ipfsHash).length || 0;

    return {
      localCount,
      onChainCount,
      ipfsCount
    };
  }
}

export default EnhancedMessageService;
