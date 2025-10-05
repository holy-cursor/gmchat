import { sendTransaction, waitForTransactionReceipt, estimateGas } from 'wagmi/actions';
import { parseEther } from 'viem';

export interface EVMMessageResult {
  hash: string;
  success: boolean;
}

export class RainbowKitEVMService {
  // Send a message using wagmi actions (this will trigger wallet popup)
  static async sendMessage(recipient: string, content: string, config: any): Promise<EVMMessageResult> {
    try {
      console.log('Sending EVM message with wagmi actions...');
      
      // Create a simple transaction that will trigger wallet popup
      // Send a small amount of ETH with the message as data
      const value = parseEther('0.0001'); // 0.0001 ETH (smaller amount)
      
      // Encode the message content as hex data
      const messageBytes = new TextEncoder().encode(content);
      const data = `0x${Array.from(messageBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')}`;
      
      console.log('Transaction details:', {
        to: recipient,
        value: value.toString(),
        data: data
      });

      // Estimate gas first
      let gasEstimate;
      try {
        gasEstimate = await estimateGas(config, {
          to: recipient as `0x${string}`,
          value: value,
          data: data as `0x${string}`,
        });
        console.log('Gas estimate:', gasEstimate);
      } catch (gasError) {
        console.warn('Gas estimation failed, using default:', gasError);
        gasEstimate = BigInt(21000); // Fallback to standard gas limit
      }

      // This will trigger the wallet popup for user approval
      const hash = await sendTransaction(config, {
        to: recipient as `0x${string}`,
        value: value,
        data: data as `0x${string}`,
        gas: gasEstimate,
      });

      console.log('Transaction sent, hash:', hash);

      // Wait for confirmation
      const receipt = await waitForTransactionReceipt(config, {
        hash: hash,
      });
      
      if (receipt) {
        console.log('Transaction confirmed:', receipt);
        return {
          hash: hash,
          success: true
        };
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('EVM message sending with wagmi failed:', error);
      throw error;
    }
  }
}

export default RainbowKitEVMService;
