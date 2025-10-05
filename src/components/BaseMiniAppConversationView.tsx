import React, { useState, useEffect } from 'react';
import { ArrowLeft, Send, MoreVertical, ExternalLink, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Conversation, Message } from '../types';

interface BaseMiniAppConversationViewProps {
  conversation: Conversation | null;
  onBack: () => void;
  onSendMessage: (content: string) => void;
  isSending: boolean;
  currentWalletAddress: string;
}

const BaseMiniAppConversationView: React.FC<BaseMiniAppConversationViewProps> = ({
  conversation,
  onBack,
  onSendMessage,
  isSending,
  currentWalletAddress,
}) => {
  const { isDark } = useTheme();
  const [messageInput, setMessageInput] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [decryptedMessages, setDecryptedMessages] = useState<Message[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const optionsRef = React.useRef<HTMLDivElement>(null);

  // Close options menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showOptions]);

  // Show messages (we store both encrypted and plain text for display)
  useEffect(() => {
    if (!conversation?.messages) {
      setDecryptedMessages([]);
      return;
    }

    // Display messages as they are (we store both plain text and encrypted content)
    setDecryptedMessages(conversation.messages);
  }, [conversation?.messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [decryptedMessages]);

  const handleSendMessage = () => {
    if (messageInput.trim() && !isSending) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };


  // Debug logging
  console.log('BaseMiniAppConversationView - conversation:', conversation);
  console.log('BaseMiniAppConversationView - messages:', conversation?.messages);
  console.log('BaseMiniAppConversationView - messages length:', conversation?.messages?.length);

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
            isDark ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <span className="text-2xl">💬</span>
          </div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Select a conversation
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Choose a contact to start messaging
          </p>
        </div>
      </div>
    );
  }

  const displayName = conversation.contact?.displayName;
  const displayAddress = conversation.contact?.address;

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Mobile-optimized header */}
      <div className={`flex items-center justify-between p-3 sm:p-4 border-b ${
        isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <button
            onClick={onBack}
            className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex-1 min-w-0">
            <h2 className={`text-base sm:text-lg font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {displayName}
            </h2>
            <p className={`text-xs sm:text-sm truncate flex items-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
              {displayAddress ? `${displayAddress.slice(0, 6)}...${displayAddress.slice(-4)}` : 'Unknown'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          
          <div className="relative" ref={optionsRef}>
            <button
              onClick={(): void => setShowOptions(!showOptions)}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <MoreVertical className="w-5 h-5" />
            </button>
            
            {showOptions && (
              <div className={`absolute right-0 top-full mt-2 w-48 rounded-xl border shadow-lg z-50 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="p-2">
                  <button className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`}>
                    View Profile
                  </button>
                  <button className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`}>
                    Block Contact
                  </button>
                  <button className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`}>
                    Clear Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {decryptedMessages.map((message, index) => {
          const isReceived = message.sender !== currentWalletAddress;
          const isLastMessage = index === decryptedMessages.length - 1;
          
          return (
            <div
              key={message.id}
              className={`flex ${isReceived ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md message-bubble relative group ${isLastMessage ? 'message-enter' : ''}`}>
                {/* Message Bubble */}
                <div
                  className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-sm ${
                    isReceived
                      ? isDark
                        ? 'message-received rounded-bl-none bg-gray-800 text-white'
                        : 'message-received rounded-bl-none'
                      : 'message-sent rounded-br-none'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <p className="text-sm leading-relaxed break-words">
                      {message.content}
                    </p>
                    {message.isEncrypted && (
                      <Shield className="w-3 h-3 text-green-400 flex-shrink-0" />
                    )}
                  </div>
                </div>
                
                {/* Time stamp and status */}
                <div className={`flex items-center mt-1 space-x-1 ${isReceived ? 'justify-start' : 'justify-end'}`}>
                  <p className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {message.transactionSignature && message.transactionSignature !== 'contact_placeholder' && (
                    <button
                      onClick={(): void => {
                        window.open(`https://basescan.org/tx/${message.transactionSignature}`, '_blank');
                      }}
                      className="text-xs hover:opacity-70 transition-opacity"
                      title="View transaction on BaseScan"
                    >
                      <ExternalLink className="w-3 h-3 text-gray-500" />
                    </button>
                  )}
                </div>
                
                {/* Reaction menu on hover */}
                <div className={`reaction-menu absolute ${isReceived ? '-top-2 -right-2' : '-top-2 -left-2'} bg-white dark:bg-gray-800 rounded-full shadow-lg p-1 flex space-x-1`}>
                  <button className="p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors text-sm">❤️</button>
                  <button className="p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors text-sm">😂</button>
                  <button className="p-1 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full transition-colors text-sm">👍</button>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Typing indicator */}
        {isSending && (
          <div className="flex justify-start">
            <div className="message-received rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className={`p-3 sm:p-4 border-t ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={messageInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMessageInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={isSending}
              className={`w-full px-3 sm:px-4 py-2 sm:py-3 rounded-2xl border transition-colors text-sm sm:text-base ${
                isDark
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isSending}
            className={`p-2 sm:p-3 rounded-2xl transition-all duration-200 ${
              !messageInput.trim() || isSending
                ? isDark
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : isDark
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Send className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BaseMiniAppConversationView;
