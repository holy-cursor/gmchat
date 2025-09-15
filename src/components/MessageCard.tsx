import React from 'react';
import { Message } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface MessageCardProps {
  message: Message;
  onClick: () => void;
  type: 'inbox' | 'outbox';
}

const MessageCard: React.FC<MessageCardProps> = ({ message, onClick, type }) => {
  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const getTimeAgo = (timestamp: number) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <div
      className="message-card bg-white rounded-lg border border-gray-200 p-4 shadow-sm cursor-pointer hover:shadow-md transition-all duration-200"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          {type === 'inbox' ? (
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-primary-700 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {message.sender.slice(0, 2).toUpperCase()}
                </span>
              </div>
              <span className="font-medium text-gray-800 font-mono text-sm">
                {formatAddress(message.sender)}
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-xs text-gray-500">To:</span>
              <span className="font-mono text-xs text-gray-700">
                {formatAddress(message.recipient)}
              </span>
            </div>
          )}
          
          <p className="text-gray-600 text-sm line-clamp-2">
            {message.content}
          </p>
          
          {!message.isRead && type === 'inbox' && (
            <div className="mt-2">
              <span className="inline-block w-2 h-2 bg-primary-500 rounded-full"></span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col items-end space-y-1 ml-4">
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {getTimeAgo(message.timestamp)}
          </span>
          {type === 'outbox' && (
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-600">Sent</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageCard;
