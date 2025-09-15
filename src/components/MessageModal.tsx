import React from 'react';
import { X, CornerUpLeft, ExternalLink, Copy, Check } from 'lucide-react';
import { Message } from '../types';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface MessageModalProps {
  message: Message;
  onClose: () => void;
}

const MessageModal: React.FC<MessageModalProps> = ({ message, onClose }) => {
  const [copiedField, setCopiedField] = React.useState<string | null>(null);

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const getTimeAgo = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const handleReply = () => {
    // This would open the message composer with the sender's address pre-filled
    toast.success('Reply functionality coming soon');
  };

  const handleViewOnExplorer = () => {
    const explorerUrl = `https://explorer.solana.com/tx/${message.transactionSignature}?cluster=devnet`;
    window.open(explorerUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end opacity-100 transition-opacity duration-300">
      <div className="bg-white w-full max-w-md h-full transform translate-x-0 transition-transform duration-300 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">Message</h3>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-gray-700 whitespace-pre-wrap">{message.content}</p>
          </div>

          <div className="space-y-4 text-sm text-gray-600">
            <div className="flex justify-between items-center">
              <span>From:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs">{formatAddress(message.sender)}</span>
                <button
                  onClick={() => copyToClipboard(message.sender, 'sender')}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {copiedField === 'sender' ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span>To:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs">{formatAddress(message.recipient)}</span>
                <button
                  onClick={() => copyToClipboard(message.recipient, 'recipient')}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {copiedField === 'recipient' ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{getTimeAgo(message.timestamp)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span>Transaction ID:</span>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs">{formatAddress(message.transactionSignature || 'N/A')}</span>
                <button
                  onClick={() => copyToClipboard(message.transactionSignature || 'N/A', 'tx')}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                >
                  {copiedField === 'tx' ? (
                    <Check className="w-3 h-3 text-green-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-8 flex space-x-3">
            <button
              onClick={handleReply}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <CornerUpLeft className="w-4 h-4 mr-2" />
              Reply
            </button>
            <button
              onClick={handleViewOnExplorer}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageModal;
