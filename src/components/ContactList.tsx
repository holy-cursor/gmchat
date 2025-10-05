import React from 'react';
import { Contact } from '../types';
import { MessageCircle, User, Tag, Plus } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ContactListProps {
  contacts: Contact[];
  selectedContact: Contact | null;
  onSelectContact: (contact: Contact) => void;
  onEditContact: (contact: Contact) => void;
  currentWalletAddress: string;
  onOpenContactTagModal: (contact: Contact) => void;
  totalUnreadCount: number;
}

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  selectedContact,
  onSelectContact,
  onEditContact,
  currentWalletAddress,
  onOpenContactTagModal,
  totalUnreadCount,
}) => {
  const { isDark } = useTheme();
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getLastMessagePreview = (contact: Contact) => {
    if (!contact.lastMessage) return 'No messages yet';
    
    const isReceived = contact.lastMessage.recipient === contact.address;
    const prefix = isReceived ? '' : 'You: ';
    const content = contact.lastMessage.content;
    
    return `${prefix}${content.length > 50 ? content.substring(0, 50) + '...' : content}`;
  };


  return (
    <div className={`w-full lg:w-80 border-r flex flex-col h-full ${
      isDark 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-3 sm:p-4 lg:p-6 border-b ${
        isDark 
          ? 'border-gray-700 bg-gray-900' 
          : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className={`text-xl sm:text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Chats
          </h2>
          <div className="flex items-center space-x-2">
            {totalUnreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse shadow-lg">
                {totalUnreadCount}
              </span>
            )}
          </div>
        </div>
        <div className={`text-xs sm:text-sm ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {totalUnreadCount > 0 ? (
            <span className="font-medium">
              {totalUnreadCount} unread message{totalUnreadCount !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="font-medium">
              All caught up! 🎉
            </span>
          )}
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {contacts.length === 0 ? (
          <div className={`p-8 text-center ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ${
              isDark 
                ? 'bg-gradient-to-br from-green-600 to-emerald-600' 
                : 'bg-gradient-to-br from-green-500 to-emerald-500'
            }`}>
              <MessageCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className={`text-xl font-bold mb-3 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Welcome to Parc3l! 🚀
            </h3>
            <p className={`text-base mb-6 ${
              isDark ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Start your first encrypted conversation on Base
            </p>
            <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl ${
              isDark 
                ? 'bg-green-700/20 border border-green-600/30' 
                : 'bg-green-100 border border-green-200'
            }`}>
              <Plus className={`w-4 h-4 ${
                isDark ? 'text-green-400' : 'text-green-600'
              }`} />
              <span className={`text-sm font-medium ${
                isDark ? 'text-green-300' : 'text-green-700'
              }`}>
                Click "New Message" to begin
              </span>
            </div>
          </div>
        ) : (
          <div className="p-1 sm:p-2">
            {contacts.map((contact) => (
              <div
                key={contact.address}
                onClick={(): void => onSelectContact(contact)}
                className={`p-3 sm:p-4 cursor-pointer rounded-2xl mx-1 sm:mx-2 mb-1 transition-all duration-200 hover:shadow-md contact-item ${
                  selectedContact?.address === contact.address
                    ? 'selected ' + (isDark
                      ? 'bg-green-900/40 border border-green-600/50 shadow-lg'
                      : 'bg-green-50 border border-green-200 shadow-lg')
                    : isDark
                    ? 'hover:bg-gray-800/50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0 relative">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-3xl flex items-center justify-center shadow-lg ${
                      isDark 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-br from-green-400 to-green-600'
                    }`}>
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    {contact.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1">
                        <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold shadow-lg text-xs">
                          {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                        </span>
                      </div>
                    )}
                    {contact.isOnline && (
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 border-2 border-white rounded-full ${
                        isDark ? 'bg-green-400' : 'bg-green-500'
                      }`}></div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-sm sm:text-base font-semibold truncate ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {contact.customTag || contact.displayName}
                      </h3>
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                        <span className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {formatTime(contact.lastActivity)}
                        </span>
                        <button
                          onClick={(e: React.MouseEvent): void => {
                            e.stopPropagation();
                            onEditContact(contact);
                          }}
                          className={`p-1 sm:p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                            isDark 
                              ? 'hover:bg-gray-700/50' 
                              : 'hover:bg-gray-100'
                          }`}
                          title="Edit contact tag"
                        >
                          <Tag className={`w-3 h-3 sm:w-4 sm:h-4 ${
                            isDark 
                              ? 'text-gray-400 hover:text-green-400' 
                              : 'text-gray-400 hover:text-green-500'
                          }`} />
                        </button>
                      </div>
                    </div>
                    
                    <p className={`text-xs sm:text-sm truncate leading-relaxed ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {getLastMessagePreview(contact)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default ContactList;
