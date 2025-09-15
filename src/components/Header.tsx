import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Settings, HelpCircle, Info, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import PrivacySettings from './PrivacySettings';

interface HeaderProps {
  onOpenAbout: () => void;
  unreadCount?: number;
  onNewMessage: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenAbout, unreadCount = 0, onNewMessage }) => {
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isPrivacySettingsOpen, setIsPrivacySettingsOpen] = React.useState(false);
  const { isDark, toggleTheme } = useTheme();

  return (
    <header className={`backdrop-blur-xl border-b px-4 sm:px-6 py-4 sticky top-0 z-10 ${
      isDark 
        ? 'bg-gray-900/95 border-gray-700 shadow-2xl' 
        : 'bg-white/95 border-gray-200 shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${
            isDark 
              ? 'bg-gradient-to-br from-green-500 to-emerald-600' 
              : 'bg-gradient-to-br from-green-400 to-green-600'
          }`}>
            <span className="text-white font-bold text-lg sm:text-xl">P</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className={`text-xl sm:text-2xl font-bold truncate ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              <span className="hidden sm:inline">Parc3l</span>
              <span className="sm:hidden">P3L</span>
            </h1>
            <p className={`text-sm font-medium hidden sm:block ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Decentralized messaging
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="relative flex-shrink-0">
              <span className="bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold animate-pulse shadow-lg">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </div>
          )}
        </div>

        {/* Wallet & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          <button
            onClick={onNewMessage}
            className={`p-3 text-white rounded-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${
              isDark 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700' 
                : 'bg-gradient-to-r from-green-400 to-green-600 hover:from-green-500 hover:to-green-700'
            }`}
            title="New Message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <div className="relative">
            <WalletMultiButton className={`!text-white !px-4 sm:!px-6 !py-3 !rounded-2xl !text-sm !font-semibold !transition-all !duration-200 !shadow-lg hover:!shadow-xl !transform hover:!scale-105 ${
              isDark 
                ? '!bg-gradient-to-r !from-green-500 !to-emerald-600 hover:!from-green-600 hover:!to-emerald-700' 
                : '!bg-gradient-to-r !from-green-400 !to-green-600 hover:!from-green-500 hover:!to-green-700'
            }`} />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-3 rounded-2xl transition-all duration-200 hover:shadow-md ${
                isDark 
                  ? 'hover:bg-gray-800/50 text-gray-300 hover:text-white' 
                  : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
            
            {isSettingsOpen && (
              <div className={`absolute right-0 mt-3 w-48 sm:w-56 backdrop-blur-xl rounded-2xl shadow-2xl py-2 z-20 border animate-in slide-in-from-top-2 duration-200 ${
                isDark 
                  ? 'bg-gray-800/95 border-gray-700' 
                  : 'bg-white/95 border-green-200'
              }`}>
                <button className={`w-full text-left px-4 py-3 text-sm flex items-center transition-colors rounded-lg mx-2 ${
                  isDark 
                    ? 'text-gray-300 hover:bg-gray-700' 
                    : 'text-gray-700 hover:bg-green-50'
                }`}>
                  <HelpCircle className={`w-4 h-4 mr-3 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                  Help & Support
                </button>
                <button
                  onClick={() => {
                    setIsPrivacySettingsOpen(true);
                    setIsSettingsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center transition-colors rounded-lg mx-2 ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-green-50'
                  }`}
                >
                  <Settings className={`w-4 h-4 mr-3 ${isDark ? 'text-purple-400' : 'text-purple-500'}`} />
                  Privacy & Security
                </button>
                <button
                  onClick={() => {
                    onOpenAbout();
                    setIsSettingsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center transition-colors rounded-lg mx-2 ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-green-50'
                  }`}
                >
                  <Info className={`w-4 h-4 mr-3 ${isDark ? 'text-green-400' : 'text-green-500'}`} />
                  About
                </button>
                <button 
                  onClick={() => {
                    toggleTheme();
                    setIsSettingsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center transition-colors rounded-lg mx-2 ${
                    isDark 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-green-50'
                  }`}
                >
                  {isDark ? (
                    <Sun className={`w-4 h-4 mr-3 ${isDark ? 'text-yellow-400' : 'text-yellow-500'}`} />
                  ) : (
                    <Moon className={`w-4 h-4 mr-3 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                  )}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </button>
                <div className={`border-t my-2 ${isDark ? 'border-gray-700' : 'border-green-200'}`}></div>
                <button className={`w-full text-left px-4 py-3 text-sm flex items-center transition-colors rounded-lg mx-2 ${
                  isDark 
                    ? 'text-red-400 hover:bg-gray-700' 
                    : 'text-red-600 hover:bg-red-50'
                }`}>
                  <LogOut className="w-4 h-4 mr-3" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Privacy Settings Modal */}
      <PrivacySettings
        isOpen={isPrivacySettingsOpen}
        onClose={() => setIsPrivacySettingsOpen(false)}
        currentWalletAddress=""
      />
    </header>
  );
};

export default Header;
