import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Keypair } from '@solana/web3.js';
import { Send, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { solanaService } from '../services/solana';

interface MessageFormData {
  recipient: string;
  content: string;
}

const MessageComposer: React.FC = () => {
  const { publicKey, signTransaction } = useWallet();
  const [isSending, setIsSending] = useState(false);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MessageFormData>();

  const onSubmit = async (data: MessageFormData) => {
    if (!publicKey || !signTransaction) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!solanaService.isValidAddress(data.recipient)) {
      toast.error('Invalid Solana address');
      return;
    }

    setIsSending(true);

    try {
      toast.loading('Minting message NFT...', { id: 'sending' });
      
      // Create a temporary keypair for the transaction
      // In a real implementation, you'd use the connected wallet's keypair
      const senderKeypair = Keypair.generate();
      
      // Mint the message as an NFT
      const result = await solanaService.mintMessageNFT(
        senderKeypair,
        data.recipient,
        data.content
      );
      
      toast.success(`Message sent! NFT: ${result.mint.slice(0, 8)}...`, { id: 'sending' });
      reset();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'sending' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-4 sticky bottom-0">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <div className="flex-1">
            <input
              {...register('recipient', {
                required: 'Recipient address is required',
                validate: (value) => 
                  solanaService.isValidAddress(value) || 'Invalid Solana address'
              })}
              type="text"
              placeholder="Recipient wallet address"
              className={`w-full px-4 py-3 border rounded-lg font-mono text-sm transition-colors ${
                errors.recipient
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
              } focus:outline-none focus:ring-1`}
            />
            {errors.recipient && (
              <p className="mt-1 text-sm text-red-600">{errors.recipient.message}</p>
            )}
          </div>
          
          <div className="flex-1 flex space-x-3">
            <div className="flex-1">
              <input
                {...register('content', {
                  required: 'Message content is required',
                  maxLength: {
                    value: 500,
                    message: 'Message must be less than 500 characters'
                  }
                })}
                type="text"
                placeholder="Write a message..."
                className={`w-full px-4 py-3 border rounded-lg transition-colors ${
                  errors.content
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500'
                } focus:outline-none focus:ring-1`}
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isSending}
              className="bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center whitespace-nowrap"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Send className="w-5 h-5 mr-2" />
              )}
              {isSending ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
        
        <div className="mt-2 text-xs text-gray-500">
          <p>Only Solana network gas fees apply. No platform fees.</p>
        </div>
      </div>
    </div>
  );
};

export default MessageComposer;
