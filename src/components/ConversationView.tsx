import React, { useEffect, useRef } from 'react';
import { Conversation, Message } from '../types';
import { Send, ArrowLeft, Copy, ExternalLink, User, Users, Trash2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { MessageStorageService } from '../services/messageStorage';
import SecurityIndicator from './SecurityIndicator';

interface ConversationViewProps {
  conversation: Conversation | null;
  onBack: () => void;
  onSendMessage: (content: string) => void;
  isSending: boolean;
  currentWalletAddress: string;
  onDeleteGroup?: (groupId: string) => void;
  onOpenGroupMembers?: () => void;
}

const ConversationView: React.FC<ConversationViewProps> = ({
  conversation,
  onBack,
  onSendMessage,
  isSending,
  currentWalletAddress,
  onDeleteGroup,
  onOpenGroupMembers,
}) => {
  const { isDark } = useTheme();
  const [messageInput, setMessageInput] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim() && !isSending) {
      onSendMessage(messageInput.trim());
      setMessageInput('');
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getSenderDisplayName = (senderAddress: string, isGroup: boolean) => {
    if (!isGroup) return null;
    
    // For group messages, try to get custom tag first, then fallback to formatted address
    // We need to check if this sender has a custom tag in the current wallet's contacts
    const customTag = getCustomTagForAddress(senderAddress);
    return customTag || formatAddress(senderAddress);
  };

  const getCustomTagForAddress = (address: string) => {
    // Get the custom tag for this address from the current wallet's contacts
    return MessageStorageService.getContactTag(currentWalletAddress, address);
  };

  if (!conversation) {
    return (
      <div className={`flex-1 flex items-center justify-center hidden lg:flex ${
        isDark ? 'bg-gray-800' : 'bg-gray-50'
      }`}>
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isDark ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <Send className={`w-8 h-8 ${
              isDark ? 'text-gray-400' : 'text-gray-400'
            }`} />
          </div>
          <h3 className={`text-lg font-medium mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Select a conversation
          </h3>
          <p className={`${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Choose a contact to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex-1 flex flex-col h-full ${
      isDark 
        ? 'bg-gray-900' 
        : 'bg-white'
    }`}>
      {/* Header */}
      <div className={`p-4 sm:p-6 border-b ${
        isDark 
          ? 'border-gray-700 bg-gray-900' 
          : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              console.log('Back button clicked');
              onBack();
            }}
            className={`p-2.5 rounded-2xl transition-all duration-200 hover:shadow-md ${
              isDark 
                ? 'hover:bg-gray-800' 
                : 'hover:bg-gray-100'
            }`}
          >
            <ArrowLeft className={`w-5 h-5 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`} />
          </button>
          
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className={`w-12 h-12 rounded-3xl flex items-center justify-center shadow-lg flex-shrink-0 ${
              conversation.group 
                ? (isDark 
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                    : 'bg-gradient-to-br from-blue-400 to-indigo-600')
                : (isDark 
                    ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-br from-green-400 to-green-600')
            }`}>
              {conversation.group ? (
                <Users className="w-6 h-6 text-white" />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className={`text-lg font-bold truncate ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                {conversation.group ? conversation.group.name : conversation.contact?.displayName}
              </h2>
              <div className="flex items-center space-x-2">
                <p className={`text-sm truncate ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {conversation.group 
                    ? `${conversation.group.members.length} members`
                    : formatAddress(conversation.contact?.address || '')
                  }
                </p>
                <SecurityIndicator
                  walletAddress={currentWalletAddress}
                  contactAddress={conversation.contact?.address}
                  groupId={conversation.group?.id}
                  messageCount={conversation.messages.length}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            {conversation.contact && (
              <>
                <button
                  onClick={() => copyToClipboard(conversation.contact!.address, 'address')}
                  className={`p-2.5 rounded-2xl transition-all duration-200 hover:shadow-md ${
                    isDark 
                      ? 'hover:bg-gray-800' 
                      : 'hover:bg-gray-100'
                  }`}
                  title="Copy address"
                >
                  <Copy className={`w-5 h-5 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                </button>
                <button
                  onClick={() => window.open(`https://explorer.solana.com/address/${conversation.contact!.address}?cluster=devnet`, '_blank')}
                  className={`p-2.5 rounded-2xl transition-all duration-200 hover:shadow-md ${
                    isDark 
                      ? 'hover:bg-gray-800' 
                      : 'hover:bg-gray-100'
                  }`}
                  title="View on Explorer"
                >
                  <ExternalLink className={`w-5 h-5 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                </button>
              </>
            )}
            {conversation.group && (
              <>
                <button
                  onClick={() => copyToClipboard(conversation.group!.id, 'group-id')}
                  className={`p-2.5 rounded-2xl transition-all duration-200 hover:shadow-md ${
                    isDark 
                      ? 'hover:bg-gray-800' 
                      : 'hover:bg-gray-100'
                  }`}
                  title="Copy group ID"
                >
                  <Copy className={`w-5 h-5 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                </button>
                <button
                  onClick={() => {
                    if (onOpenGroupMembers) {
                      onOpenGroupMembers();
                    } else {
                      // Fallback: copy member addresses
                      const membersList = conversation.group!.members.join('\n');
                      copyToClipboard(membersList, 'group-members');
                    }
                  }}
                  className={`p-2.5 rounded-2xl transition-all duration-200 hover:shadow-md ${
                    isDark 
                      ? 'hover:bg-gray-800' 
                      : 'hover:bg-gray-100'
                  }`}
                  title={onOpenGroupMembers ? "View group members" : "Copy member addresses"}
                >
                  <Users className={`w-5 h-5 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                </button>
                {onDeleteGroup && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to delete the group "${conversation.group!.name}"? This action cannot be undone.`)) {
                        onDeleteGroup(conversation.group!.id);
                      }
                    }}
                    className={`p-2.5 rounded-2xl transition-all duration-200 hover:shadow-md ${
                      isDark 
                        ? 'hover:bg-red-900/50' 
                        : 'hover:bg-red-100'
                    }`}
                    title="Delete group"
                  >
                    <Trash2 className={`w-5 h-5 ${
                      isDark ? 'text-red-400' : 'text-red-600'
                    }`} />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {conversation.messages.map((message) => {
          const isFromCurrentUser = message.sender === currentWalletAddress;
          const isReceived = !isFromCurrentUser;
          const isGroup = !!conversation.group;
          const senderDisplayName = getSenderDisplayName(message.sender, isGroup);

          return (
            <div
              key={message.id}
              className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              <div className={`max-w-xs sm:max-w-sm lg:max-w-md ${isFromCurrentUser ? 'items-end' : 'items-start'} flex flex-col`}>
                {/* Sender identifier for group messages */}
                {isGroup && !isFromCurrentUser && senderDisplayName && (
                  <div className={`text-sm font-medium mb-1 px-3 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {senderDisplayName}
                  </div>
                )}
                
                <div
                  className={`px-4 py-3 rounded-3xl shadow-lg ${
                    isFromCurrentUser
                      ? isDark
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                        : 'bg-gradient-to-br from-green-400 to-green-600 text-white'
                      : isDark
                      ? 'bg-gray-800 border border-gray-700 text-white'
                      : 'bg-gray-100 border border-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${
                      isFromCurrentUser 
                        ? 'text-green-100' 
                        : isDark 
                          ? 'text-gray-400' 
                          : 'text-gray-500'
                    }`}>
                      {formatTime(message.timestamp)}
                    </span>
                    {message.transactionSignature && (
                      <button
                        onClick={() => copyToClipboard(message.transactionSignature!, 'tx')}
                        className={`ml-2 p-1 rounded ${
                          isFromCurrentUser ? 'hover:bg-purple-700' : 'hover:bg-gray-200'
                        }`}
                        title="Copy Transaction ID"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className={`p-4 border-t ${
        isDark 
          ? 'border-gray-700 bg-gray-900' 
          : 'border-gray-200 bg-white'
      }`}>
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            className={`flex-1 px-4 py-3 border rounded-3xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-lg hover:shadow-xl text-sm ${
              isDark 
                ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:ring-green-500' 
                : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-green-500'
            }`}
            disabled={isSending}
          />
            <button
              type="submit"
              disabled={!messageInput.trim() || isSending}
              className={`px-6 py-3 text-white rounded-3xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center shadow-lg hover:shadow-xl transform hover:scale-105 ${
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
                  <span className="hidden sm:inline">Send</span>
                </>
              )}
            </button>
        </form>
      </div>
    </div>
  );
};

export default ConversationView;
