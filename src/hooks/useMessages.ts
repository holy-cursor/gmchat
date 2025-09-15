import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Message } from '../types';
import { solanaService } from '../services/solana';
import toast from 'react-hot-toast';

export const useMessages = () => {
  const { publicKey, connected } = useWallet();
  const [inboxMessages, setInboxMessages] = useState<Message[]>([]);
  const [outboxMessages, setOutboxMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInboxMessages = useCallback(async () => {
    if (!publicKey || !connected) return;

    setLoading(true);
    setError(null);

    try {
      const messages = await solanaService.getInboxMessages(publicKey.toString());
      setInboxMessages(messages);
    } catch (err) {
      const errorMessage = 'Failed to fetch inbox messages';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching inbox messages:', err);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected]);

  const fetchOutboxMessages = useCallback(async () => {
    if (!publicKey || !connected) return;

    setLoading(true);
    setError(null);

    try {
      const messages = await solanaService.getOutboxMessages(publicKey.toString());
      setOutboxMessages(messages);
    } catch (err) {
      const errorMessage = 'Failed to fetch outbox messages';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching outbox messages:', err);
    } finally {
      setLoading(false);
    }
  }, [publicKey, connected]);

  const sendMessage = useCallback(async (recipient: string, content: string) => {
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return false;
    }

    try {
      toast.loading('Sending message...', { id: 'sending' });
      
      // In a real implementation, this would call the Solana service
      // to mint the NFT and transfer it
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success('Message sent successfully!', { id: 'sending' });
      
      // Refresh messages after sending
      await Promise.all([fetchInboxMessages(), fetchOutboxMessages()]);
      
      return true;
    } catch (err) {
      const errorMessage = 'Failed to send message';
      toast.error(errorMessage, { id: 'sending' });
      console.error('Error sending message:', err);
      return false;
    }
  }, [publicKey, fetchInboxMessages, fetchOutboxMessages]);

  const refreshMessages = useCallback(async () => {
    if (!connected || !publicKey) return;
    
    await Promise.all([fetchInboxMessages(), fetchOutboxMessages()]);
  }, [connected, publicKey, fetchInboxMessages, fetchOutboxMessages]);

  // Auto-fetch messages when wallet connects
  useEffect(() => {
    if (connected && publicKey) {
      refreshMessages();
    } else {
      setInboxMessages([]);
      setOutboxMessages([]);
    }
  }, [connected, publicKey, refreshMessages]);

  return {
    inboxMessages,
    outboxMessages,
    loading,
    error,
    sendMessage,
    refreshMessages,
    fetchInboxMessages,
    fetchOutboxMessages,
  };
};
