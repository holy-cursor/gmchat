import React, { useState } from 'react';
import { Shield, Lock, Trash2, Key, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import EncryptionService from '../services/encryptionService';
import SecurityService from '../services/securityService';

interface PrivacySettingsProps {
  isOpen: boolean;
  onClose: () => void;
  currentWalletAddress: string;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({
  isOpen,
  onClose,
  currentWalletAddress
}) => {
  const { isDark } = useTheme();
  const [isClearingData, setIsClearingData] = useState(false);

  const handleClearEncryptionKeys = () => {
    if (window.confirm('Are you sure you want to clear all encryption keys? This will make existing encrypted messages unreadable.')) {
      EncryptionService.clearAllKeys();
      alert('All encryption keys have been cleared.');
    }
  };

  const handleClearSecurityData = () => {
    if (window.confirm('Are you sure you want to clear all security data? This will reset rate limits and flagged addresses.')) {
      SecurityService.clearAllSecurityData();
      alert('All security data has been cleared.');
    }
  };

  const handleClearAllData = async () => {
    if (window.confirm('Are you sure you want to clear ALL data? This will delete all messages, contacts, groups, and security data. This action cannot be undone.')) {
      setIsClearingData(true);
      
      try {
        // Clear all localStorage data
        localStorage.clear();
        
        // Reload the page to reset the app
        window.location.reload();
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data. Please try again.');
      } finally {
        setIsClearingData(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className={`rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300 ${
        isDark ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-2xl ${
                isDark ? 'bg-purple-900/50' : 'bg-purple-100'
              }`}>
                <Shield className={`w-6 h-6 ${
                  isDark ? 'text-purple-400' : 'text-purple-600'
                }`} />
              </div>
              <h3 className={`text-xl font-bold ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                Privacy & Security
              </h3>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-2xl transition-all duration-200 ${
                isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
              }`}
            >
              <svg className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className={`space-y-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}>
              <h4 className={`font-semibold mb-2 flex items-center space-x-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <Lock className="w-4 h-4" />
                <span>Encryption Status</span>
              </h4>
              <p className="text-sm">
                All messages are encrypted end-to-end using AES-256 encryption. 
                Only you and the recipient can read the messages.
              </p>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}>
              <h4 className={`font-semibold mb-2 flex items-center space-x-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <Key className="w-4 h-4" />
                <span>Encryption Keys</span>
              </h4>
              <p className="text-sm mb-3">
                Encryption keys are generated automatically for each conversation and stored locally.
              </p>
              <button
                onClick={handleClearEncryptionKeys}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isDark 
                    ? 'text-yellow-400 hover:bg-yellow-900/20' 
                    : 'text-yellow-600 hover:bg-yellow-100'
                }`}
              >
                Clear All Keys
              </button>
            </div>

            <div className={`p-4 rounded-2xl border ${
              isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'
            }`}>
              <h4 className={`font-semibold mb-2 flex items-center space-x-2 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>
                <AlertTriangle className="w-4 h-4" />
                <span>Security Data</span>
              </h4>
              <p className="text-sm mb-3">
                Rate limiting and security data help prevent spam and abuse.
              </p>
              <button
                onClick={handleClearSecurityData}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isDark 
                    ? 'text-blue-400 hover:bg-blue-900/20' 
                    : 'text-blue-600 hover:bg-blue-100'
                }`}
              >
                Clear Security Data
              </button>
            </div>

            <div className={`p-4 rounded-2xl border-2 border-dashed ${
              isDark ? 'border-red-700 bg-red-900/20' : 'border-red-200 bg-red-50'
            }`}>
              <h4 className={`font-semibold mb-2 flex items-center space-x-2 ${
                isDark ? 'text-red-400' : 'text-red-600'
              }`}>
                <Trash2 className="w-4 h-4" />
                <span>Danger Zone</span>
              </h4>
              <p className="text-sm mb-3">
                This will permanently delete all your data including messages, contacts, and groups.
              </p>
              <button
                onClick={handleClearAllData}
                disabled={isClearingData}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isDark 
                    ? 'bg-red-900 text-red-300 hover:bg-red-800' 
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                } ${isClearingData ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isClearingData ? 'Clearing...' : 'Clear All Data'}
              </button>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-3 text-white rounded-2xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl ${
                isDark 
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700' 
                  : 'bg-gradient-to-r from-purple-400 to-indigo-600 hover:from-purple-500 hover:to-indigo-700'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
