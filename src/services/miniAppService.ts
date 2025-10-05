import { sendTransaction } from 'wagmi/actions';
import { parseEther } from 'viem';
import EnhancedMessageService from './enhancedMessageService';

export interface MiniAppMessageResult {
  hash: string;
  success: boolean;
}

export class MiniAppService {
  /**
   * Detect if we're running in a Base Mini App environment
   */
  static isMiniAppEnvironment(): boolean {
    // Check for Farcaster/Coinbase Wallet Mini App environment
    return !!(
      window.parent !== window || // Running in iframe
      (window as any).farcaster || // Farcaster SDK available
      (window as any).coinbaseWallet || // Coinbase Wallet SDK
      navigator.userAgent.includes('Farcaster') ||
      navigator.userAgent.includes('Coinbase')
    );
  }

  /**
   * Send message in Mini App mode (seamless, no popup)
   */
  static async sendMessageMiniApp(
    recipient: string, 
    content: string, 
    config: any,
    sender: string
  ): Promise<MiniAppMessageResult> {
    try {
      console.log('Sending message in Mini App mode (seamless)...');
      
      // Use enhanced message service with full features
      const result = await EnhancedMessageService.sendMessage(
        sender,
        recipient,
        content,
        config,
        {
          useEncryption: false, // Disabled by default to avoid complexity
          useIPFS: true, // Enable IPFS for cross-device storage
          useSmartContract: false // Disabled until contract is deployed
        }
      );
      
      return {
        hash: result.hash,
        success: result.success
      };
    } catch (error) {
      console.error('Mini App message sending failed:', error);
      throw error;
    }
  }

  /**
   * Store message hash on-chain (Mini App approach)
   */
  private static async storeMessageOnChain(
    recipient: string,
    content: string,
    config: any
  ): Promise<string> {
    // For now, we'll use a simple transaction approach
    // In production, this would interact with a smart contract
    const value = parseEther('0.0001');
    const data = `0x${Array.from(new TextEncoder().encode(content))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')}`;

    const hash = await sendTransaction(config, {
      to: recipient as `0x${string}`,
      value: value,
      data: data as `0x${string}`,
    });

    return hash;
  }

  /**
   * Send message with wallet popup (fallback mode)
   */
  static async sendMessageWithPopup(
    recipient: string,
    content: string,
    config: any,
    sender: string
  ): Promise<MiniAppMessageResult> {
    try {
      console.log('Sending message with wallet popup (fallback mode)...');
      
      // Use enhanced message service with full features
      const result = await EnhancedMessageService.sendMessage(
        sender,
        recipient,
        content,
        config,
        {
          useEncryption: false, // Disabled by default to avoid complexity
          useIPFS: true, // Enable IPFS for cross-device storage
          useSmartContract: false // Disabled until contract is deployed
        }
      );
      
      return {
        hash: result.hash,
        success: result.success
      };
    } catch (error) {
      console.error('Wallet popup message sending failed:', error);
      throw error;
    }
  }

  /**
   * Smart message sending - chooses the right method based on environment
   */
  static async sendMessage(
    recipient: string,
    content: string,
    config: any,
    sender: string
  ): Promise<MiniAppMessageResult> {
    if (this.isMiniAppEnvironment()) {
      console.log('Detected Mini App environment - using seamless mode');
      return this.sendMessageMiniApp(recipient, content, config, sender);
    } else {
      console.log('Detected regular web environment - using wallet popup mode');
      return this.sendMessageWithPopup(recipient, content, config, sender);
    }
  }
}

export default MiniAppService;
