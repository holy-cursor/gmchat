import React, { useState } from 'react';
import { Send, Wallet, AlertCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useEVMWallet } from '../contexts/EVMWalletContext';
import ChainSelector from './ChainSelector';
import { SUPPORTED_EVM_CHAINS, TESTNET_EVM_CHAINS } from '../types/evm';

interface EVMMessageComposerProps {
  onSendMessage: (recipient: string, content: string, chainId: number) => Promise<void>;
  isSending?: boolean;
  disabled?: boolean;
}

const EVMMessageComposer: React.FC<EVMMessageComposerProps> = ({
  onSendMessage,
  isSending = false,
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const { isConnected, address, currentChain, balance, error, clearError } = useEVMWallet();
  const [recipient, setRecipient] = useState('');
  const [content, setContent] = useState('');
  const [selectedChainId, setSelectedChainId] = useState<number>(11155111); // Default to Sepolia testnet

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient.trim() || !content.trim()) {
      return;
    }

    // Debug logging (commented out for production)
    // console.log('EVMMessageComposer - isConnected:', isConnected);
    // console.log('EVMMessageComposer - address:', address);
    // console.log('EVMMessageComposer - currentChain:', currentChain);

    if (!isConnected) {
      alert('Please connect your EVM wallet first');
      return;
    }

    try {
      await onSendMessage(recipient, content, selectedChainId);
      setRecipient('');
      setContent('');
    } catch (error) {
      console.error('Failed to send EVM message:', error);
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const isValidAddress = (addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr);
  };

  return (
    <div className={`p-6 border-t ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      {error && (
        <div className={`mb-4 p-3 rounded-xl flex items-center space-x-2 ${
          isDark ? 'bg-red-900/50 border border-red-800' : 'bg-red-50 border border-red-200'
        }`}>
          <AlertCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />
          <span className={`text-sm ${isDark ? 'text-red-300' : 'text-red-700'}`}>
            {error}
          </span>
          <button
            onClick={clearError}
            className={`ml-auto text-xs px-2 py-1 rounded transition-colors ${
              isDark ? 'text-red-300 hover:bg-red-800' : 'text-red-600 hover:bg-red-100'
            }`}
          >
            Dismiss
          </button>
        </div>
      )}

      {!isConnected ? (
        <div className={`text-center py-8 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">Connect EVM Wallet</p>
          <p className="text-sm">Connect your MetaMask or other EVM wallet to send messages</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Chain Selection */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Blockchain
            </label>
            <ChainSelector
              selectedChainId={selectedChainId}
              onChainSelect={setSelectedChainId}
              disabled={disabled || isSending}
            />
          </div>

          {/* Wallet Info */}
          <div className={`p-3 rounded-xl ${
            isDark ? 'bg-gray-800' : 'bg-gray-50'
          }`}>
            <div className="flex items-center justify-between text-sm">
              <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                Connected Wallet:
              </span>
              <span className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {address ? formatAddress(address) : 'Not connected'}
              </span>
            </div>
            {currentChain && balance && (
              <div className="flex items-center justify-between text-sm mt-1">
                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                  Balance:
                </span>
                <span className={`font-mono ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {balance} {currentChain.nativeCurrency.symbol}
                </span>
              </div>
            )}
          </div>

          {/* Recipient Address */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Recipient Address
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRecipient(e.target.value)}
              placeholder="0x..."
              disabled={disabled || isSending}
              className={`w-full px-4 py-3 rounded-2xl border transition-colors ${
                isDark
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } ${disabled || isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            {recipient && !isValidAddress(recipient) && (
              <p className={`text-xs mt-1 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                Invalid Ethereum address format
              </p>
            )}
          </div>

          {/* Message Content */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Message
            </label>
            <textarea
              value={content}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              disabled={disabled || isSending}
              className={`w-full px-4 py-3 rounded-2xl border transition-colors resize-none ${
                isDark
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } ${disabled || isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={disabled || isSending || !recipient.trim() || !content.trim() || !isValidAddress(recipient)}
            className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-2xl font-semibold transition-all duration-200 ${
              disabled || isSending || !recipient.trim() || !content.trim() || !isValidAddress(recipient)
                ? isDark
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : isDark
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl'
                : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl'
            }`}
          >
            {isSending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </>
            )}
          </button>

          {/* Transaction Info */}
          <div className={`text-xs text-center ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            Messages are sent with a small {[...TESTNET_EVM_CHAINS, ...SUPPORTED_EVM_CHAINS].find(c => c.id === selectedChainId)?.nativeCurrency.symbol || 'ETH'} transfer
          </div>
        </form>
      )}
    </div>
  );
};

export default EVMMessageComposer;
