import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Send as SendIcon, Loader2 } from 'lucide-react';
import { Message } from '../types';
import { solanaService } from '../services/solana';
import MessageCard from './MessageCard';

interface OutboxProps {
  onMessageSelect: (message: Message) => void;
  isConnected: boolean;
}

const Outbox: React.FC<OutboxProps> = ({ onMessageSelect, isConnected }) => {
  const { publicKey } = useWallet();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!publicKey) return;

    setLoading(true);
    setError(null);

    try {
      const outboxData = await solanaService.getOutboxMessages(publicKey.toString());
      
      // Convert raw data to Message objects
      const messageList: Message[] = outboxData.map((item) => ({
        id: item.signature,
        sender: publicKey.toString(),
        recipient: item.recipient || 'Unknown',
        content: item.content || 'Message content would be here',
        messageType: 'text' as const,
        timestamp: item.timestamp || Date.now(),
        // Removed nftMint - using transaction signature instead
        transactionSignature: item.signature,
        isRead: true,
      }));

      setMessages(messageList);
    } catch (err) {
      setError('Failed to fetch sent messages');
      console.error('Error fetching outbox messages:', err);
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (isConnected && publicKey) {
      fetchMessages();
    }
  }, [isConnected, publicKey, fetchMessages]);

  if (!isConnected) {
    return (
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Outbox</h2>
        <p className="text-gray-500">Messages you've sent</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Outbox</h2>
          <p className="text-gray-500">Messages you've sent</p>
        </div>
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 flex items-center"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          Refresh
        </button>
      </div>

      {loading && messages.length === 0 ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 text-gray-400 mx-auto animate-spin" />
          <p className="mt-2 text-gray-500">Loading sent messages...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 px-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchMessages}
            className="mt-2 px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700"
          >
            Try Again
          </button>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-12 px-4 rounded-lg bg-white border border-dashed border-gray-300">
          <SendIcon className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-700">No sent messages</h3>
          <p className="mt-2 text-gray-500">Messages you send will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <MessageCard
              key={message.id}
              message={message}
              onClick={() => onMessageSelect(message)}
              type="outbox"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Outbox;
