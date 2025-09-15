import React from 'react';
import { Contact, Group } from '../types';
import { MessageCircle, Clock, User, Tag, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ContactListProps {
  contacts: Contact[];
  groups: Group[];
  selectedContact: Contact | null;
  selectedGroup: Group | null;
  onContactSelect: (contact: Contact) => void;
  onGroupSelect: (group: Group) => void;
  onEditContact: (contact: Contact) => void;
  onEditGroup: (group: Group) => void;
  totalUnreadCount: number;
  onCreateGroup: () => void;
}

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  groups,
  selectedContact,
  selectedGroup,
  onContactSelect,
  onGroupSelect,
  onEditContact,
  onEditGroup,
  totalUnreadCount,
  onCreateGroup,
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

  const getGroupLastMessagePreview = (group: Group) => {
    if (!group.lastMessage) return 'No messages yet';
    
    const prefix = group.lastMessage.sender === group.createdBy ? 'You: ' : '';
    const content = group.lastMessage.content;
    
    return `${prefix}${content.length > 50 ? content.substring(0, 50) + '...' : content}`;
  };

  return (
    <div className={`w-full lg:w-80 border-r flex flex-col h-full ${
      isDark 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`p-4 sm:p-6 border-b ${
        isDark 
          ? 'border-gray-700 bg-gray-900' 
          : 'border-gray-200 bg-white'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-2xl font-bold ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            Chats
          </h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={onCreateGroup}
              className={`p-2.5 rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white' 
                  : 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700 text-white'
              }`}
              title="Create Group"
            >
              <Users className="w-5 h-5" />
            </button>
            {totalUnreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold animate-pulse shadow-lg">
                {totalUnreadCount}
              </span>
            )}
          </div>
        </div>
        <div className={`text-sm ${
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

      {/* Contacts and Groups List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {contacts.length === 0 && groups.length === 0 ? (
          <div className={`p-8 text-center ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl ${
              isDark 
                ? 'bg-gradient-to-br from-green-900/50 to-emerald-900/50' 
                : 'bg-gradient-to-br from-green-100 to-emerald-100'
            }`}>
              <MessageCircle className={`w-8 h-8 ${
                isDark ? 'text-green-400' : 'text-green-500'
              }`} />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              No conversations yet
            </h3>
            <p className={`text-sm ${
              isDark ? 'text-gray-500' : 'text-gray-600'
            }`}>
              Start a conversation by sending a message
            </p>
          </div>
        ) : (
          <div className="p-2">
            {contacts.map((contact) => (
              <div
                key={contact.address}
                onClick={() => onContactSelect(contact)}
                className={`p-4 cursor-pointer rounded-2xl mx-2 mb-1 transition-all duration-200 hover:shadow-md ${
                  selectedContact?.address === contact.address
                    ? isDark
                      ? 'bg-green-900/40 border border-green-600/50 shadow-lg'
                      : 'bg-green-50 border border-green-200 shadow-lg'
                    : isDark
                    ? 'hover:bg-gray-800/50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0 relative">
                    <div className={`w-12 h-12 rounded-3xl flex items-center justify-center shadow-lg ${
                      isDark 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
                        : 'bg-gradient-to-br from-green-400 to-green-600'
                    }`}>
                      <User className="w-6 h-6 text-white" />
                    </div>
                    {contact.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1">
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                          {contact.unreadCount > 9 ? '9+' : contact.unreadCount}
                        </span>
                      </div>
                    )}
                    {contact.isOnline && (
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-white rounded-full ${
                        isDark ? 'bg-green-400' : 'bg-green-500'
                      }`}></div>
                    )}
                  </div>

                  {/* Contact Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className={`text-base font-semibold truncate ${
                        isDark ? 'text-white' : 'text-gray-900'
                      }`}>
                        {contact.customTag || contact.displayName}
                      </h3>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {formatTime(contact.lastActivity)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditContact(contact);
                          }}
                          className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                            isDark 
                              ? 'hover:bg-gray-700/50' 
                              : 'hover:bg-gray-100'
                          }`}
                          title="Edit contact tag"
                        >
                          <Tag className={`w-4 h-4 ${
                            isDark 
                              ? 'text-gray-400 hover:text-green-400' 
                              : 'text-gray-400 hover:text-green-500'
                          }`} />
                        </button>
                      </div>
                    </div>
                    
                    <p className={`text-sm truncate leading-relaxed ${
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

        {/* Groups Section */}
        {groups.length > 0 && (
          <div className="p-2">
            <div className={`px-4 py-3 text-sm font-semibold ${
              isDark ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Groups ({groups.length})
            </div>
            {groups.map((group) => (
              <div
                key={group.id}
                onClick={() => onGroupSelect(group)}
                className={`p-4 cursor-pointer rounded-2xl mx-2 mb-1 transition-all duration-200 hover:shadow-md ${
                  selectedGroup?.id === group.id
                    ? isDark
                      ? 'bg-green-900/40 border border-green-600/50 shadow-lg'
                      : 'bg-green-50 border border-green-200 shadow-lg'
                    : isDark
                    ? 'hover:bg-gray-800/50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {/* Group Avatar */}
                  <div className="flex-shrink-0 relative">
                    <div className={`w-12 h-12 rounded-3xl flex items-center justify-center shadow-lg ${
                      isDark 
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600' 
                        : 'bg-gradient-to-br from-blue-400 to-indigo-600'
                    }`}>
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    {group.unreadCount > 0 && (
                      <div className="absolute -top-1 -right-1">
                        <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                          {group.unreadCount > 9 ? '9+' : group.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Group Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <h3 className={`text-base font-semibold truncate ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>
                          {group.name}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          isDark 
                            ? 'bg-blue-900/50 text-blue-300' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {group.members.length}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <span className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {formatTime(group.lastActivity)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditGroup(group);
                          }}
                          className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-110 ${
                            isDark 
                              ? 'hover:bg-gray-700/50' 
                              : 'hover:bg-gray-100'
                          }`}
                          title="Edit group"
                        >
                          <Tag className={`w-4 h-4 ${
                            isDark 
                              ? 'text-gray-400 hover:text-blue-400' 
                              : 'text-gray-400 hover:text-blue-500'
                          }`} />
                        </button>
                      </div>
                    </div>
                    
                    <p className={`text-sm truncate leading-relaxed ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {getGroupLastMessagePreview(group)}
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
