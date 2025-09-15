import React from 'react';
import { X, Copy, User, Users } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Group } from '../types';
import { MessageStorageService } from '../services/messageStorage';

interface GroupMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group | null;
  currentWalletAddress: string;
}

const GroupMembersModal: React.FC<GroupMembersModalProps> = ({
  isOpen,
  onClose,
  group,
  currentWalletAddress,
}) => {
  const { isDark } = useTheme();

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const formatAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const getMemberDisplayName = (address: string) => {
    // Try to get custom tag first, then fallback to formatted address
    const customTag = MessageStorageService.getContactTag(currentWalletAddress, address);
    return customTag || formatAddress(address);
  };

  const getMemberSubtitle = (address: string) => {
    const customTag = MessageStorageService.getContactTag(currentWalletAddress, address);
    return customTag ? formatAddress(address) : 'Group Member';
  };

  if (!isOpen || !group) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 animate-in zoom-in-95 duration-300 ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold flex items-center ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            <Users className="w-5 h-5 mr-2 text-green-500" />
            Group Members
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </button>
        </div>

        <div className="mb-4">
          <h3 className={`text-lg font-semibold mb-2 ${
            isDark ? 'text-white' : 'text-gray-900'
          }`}>
            {group.name}
          </h3>
          <p className={`text-sm ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            {group.description || 'No description'}
          </p>
        </div>

        <div className="mb-4">
          <p className={`text-sm font-medium mb-3 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Members ({group.members.length})
          </p>
          <div className={`max-h-64 overflow-y-auto space-y-2 ${
            isDark ? 'bg-gray-700' : 'bg-gray-50'
          } rounded-xl p-3`}>
            {group.members.map((memberAddress, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  isDark ? 'bg-gray-600' : 'bg-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-green-600' : 'bg-green-500'
                  }`}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      {getMemberDisplayName(memberAddress)}
                    </p>
                    <p className={`text-xs ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {getMemberSubtitle(memberAddress)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(memberAddress, 'member-address')}
                  className={`p-2 rounded transition-colors ${
                    isDark 
                      ? 'hover:bg-gray-500 text-gray-400 hover:text-green-400' 
                      : 'hover:bg-gray-200 text-gray-500 hover:text-green-500'
                  }`}
                  title="Copy address"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <p className={`text-sm font-medium mb-2 ${
            isDark ? 'text-gray-300' : 'text-gray-700'
          }`}>
            Group Wallet
          </p>
          <div className={`flex items-center justify-between p-3 rounded-lg ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <div className="flex items-center space-x-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isDark ? 'bg-blue-600' : 'bg-blue-500'
              }`}>
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className={`text-sm font-mono ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {formatAddress(group.groupWallet)}
                </p>
                <p className={`text-xs ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  Group Wallet
                </p>
              </div>
            </div>
            <button
              onClick={() => copyToClipboard(group.groupWallet, 'group-wallet')}
              className={`p-2 rounded transition-colors ${
                isDark 
                  ? 'hover:bg-gray-600 text-gray-400 hover:text-blue-400' 
                  : 'hover:bg-gray-200 text-gray-500 hover:text-blue-500'
              }`}
              title="Copy group wallet"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className={`px-5 py-2.5 text-sm font-medium rounded-xl transition-colors ${
              isDark 
                ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' 
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupMembersModal;
