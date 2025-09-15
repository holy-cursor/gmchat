import React from 'react';
import { X, Send } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface NewMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (recipient: string, content: string) => void;
  isSending: boolean;
  walletBalance: number | null;
}

const NewMessageModal: React.FC<NewMessageModalProps> = ({
  isOpen,
  onClose,
  onSend,
  isSending,
  walletBalance,
}) => {
  const { isDark } = useTheme();
  const [recipientAddress, setRecipientAddress] = React.useState('');
  const [messageContent, setMessageContent] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recipientAddress.trim() && messageContent.trim()) {
      onSend(messageContent.trim(), recipientAddress.trim());
      setRecipientAddress('');
      setMessageContent('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300 ${
        isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className={`flex items-center justify-between p-6 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            New Message
          </h2>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-500'}`} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={`block text-sm font-semibold mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Recipient Address
            </label>
            <input
              type="text"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder="Enter Solana wallet address..."
              className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm shadow-lg ${
                isDark 
                  ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                  : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500'
              }`}
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Message Content
            </label>
            <textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder="Type your message here..."
              rows={3}
              className={`w-full px-4 py-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm shadow-lg ${
                isDark 
                  ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400' 
                  : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500'
              }`}
              required
            />
          </div>

          {walletBalance !== null && (
            <div className={`text-sm ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Balance: {walletBalance.toFixed(6)} SOL
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-3 rounded-2xl transition-all duration-200 text-sm font-semibold ${
                isDark 
                  ? 'text-gray-300 bg-gray-800 hover:bg-gray-700' 
                  : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending || !recipientAddress.trim() || !messageContent.trim()}
              className={`flex-1 px-4 py-3 text-white rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center text-sm font-semibold shadow-lg hover:shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                  : 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700'
              }`}
            >
              {isSending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Send
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewMessageModal;
