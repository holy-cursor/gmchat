import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Plus, Settings, RefreshCw, Code, ChevronUp, UserPlus, Moon, Sun, Shield, MoreVertical } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { WalletType } from './BaseMiniAppWallet';

interface BaseMiniAppHeaderProps {
  onOpenAbout: () => void;
  unreadCount: number;
  onNewMessage: () => void;
  onAddContact: () => void;
  onSyncMessages: () => void;
  onCleanupMessages: () => void;
  onClearAllMessages: () => void;
  onInspectStorage: () => void;
  onManualRecovery: () => void;
  onDebugSendMessage: () => void;
  onOpenPrivacySettings: () => void;
  selectedWalletType: WalletType;
  onWalletTypeChange: (type: WalletType) => void;
  walletButton: React.ReactNode;
  useHybridMode: boolean;
  onToggleHybridMode: () => void;
  onTestDatabase: () => void;
  ultraLowCostMode: boolean;
  onToggleUltraLowCostMode: () => void;
}

const BaseMiniAppHeader: React.FC<BaseMiniAppHeaderProps> = ({
  onOpenAbout,
  unreadCount,
  onNewMessage,
  onAddContact,
  onSyncMessages,
  onCleanupMessages,
  onClearAllMessages,
  onInspectStorage,
  onManualRecovery,
  onDebugSendMessage,
  onOpenPrivacySettings,
  selectedWalletType,
  onWalletTypeChange,
  walletButton,
  useHybridMode,
  onToggleHybridMode,
  onTestDatabase,
  ultraLowCostMode,
  onToggleUltraLowCostMode,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const [isDevMode] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMainMenu(false);
        setShowDevMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
      isDark 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      {/* Mobile-optimized header */}
      <div className="px-3 py-3">
        <div className="flex items-center justify-between">
          {/* App Title & Logo */}
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                Parc3l
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Base Mini App
              </p>
            </div>
          </div>

          {/* Action Buttons - Hidden on mobile, shown in FAB */}
          <div className="hidden sm:flex items-center space-x-2 flex-shrink-0">
            {/* New Message Button */}
            <button
              onClick={onNewMessage}
              className={`relative flex items-center space-x-1 px-3 py-2 rounded-xl transition-all duration-200 font-medium ${
                isDark
                  ? 'bg-green-700 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
              }`}
              title="Start new conversation"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">New</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Add Contact Button */}
            <button
              onClick={onAddContact}
              className={`flex items-center space-x-1 px-3 py-2 rounded-xl transition-all duration-200 font-medium ${
                isDark
                  ? 'bg-blue-700 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                  : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
              }`}
              title="Add new contact"
            >
              <UserPlus className="w-4 h-4" />
              <span className="text-sm">Add</span>
            </button>
          </div>

          {/* Three Dots Menu - Always visible */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMainMenu(!showMainMenu)}
              className={`p-2 rounded-xl transition-all duration-200 ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
              }`}
              title="More Options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {/* Main Menu Dropdown */}
            {showMainMenu && (
              <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl border shadow-lg z-50 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="p-2 space-y-1">
                  {/* Dark Mode Toggle */}
                  <button
                    onClick={() => {
                      toggleTheme();
                      setShowMainMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                      isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                  </button>

                  {/* Sync Messages */}
                  <button
                    onClick={() => {
                      onSyncMessages();
                      setShowMainMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                      isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Sync Messages</span>
                  </button>

                  {/* Privacy Settings */}
                  <button
                    onClick={() => {
                      onOpenPrivacySettings();
                      setShowMainMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                      isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Privacy Settings</span>
                  </button>

                  {/* Developer Mode Toggle */}
                  <button
                    onClick={() => {
                      if (!isDevMode) {
                        // Developer mode is disabled - show message
                        alert('Developer mode is currently disabled');
                        setShowMainMenu(false);
                      } else {
                        setShowDevMenu(!showDevMenu);
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                      isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Code className="w-4 h-4" />
                    <span>{isDevMode ? 'Developer Menu' : 'Developer Mode'}</span>
                  </button>

                  {/* About/Settings */}
                  <button
                    onClick={() => {
                      onOpenAbout();
                      setShowMainMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center space-x-2 ${
                      isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>About & Settings</span>
                  </button>
                  </div>
                </div>
            )}

            {/* Developer Menu Dropdown */}
            {isDevMode && showDevMenu && (
              <div className={`absolute right-0 top-full mt-2 w-64 rounded-xl border shadow-lg z-50 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-semibold ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Developer Tools
                    </h3>
                    <button
                      onClick={() => setShowDevMenu(false)}
                      className={`p-1 rounded-lg transition-colors ${
                        isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                      }`}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {/* Ultra-Low-Cost Mode Toggle */}
                    <div className="flex items-center justify-between px-3 py-2">
                      <span className={`text-sm font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        Ultra-Low-Cost Mode
                      </span>
                      <button
                        onClick={onToggleUltraLowCostMode}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          ultraLowCostMode
                            ? isDark
                              ? 'bg-green-600'
                              : 'bg-green-500'
                            : isDark
                              ? 'bg-gray-600'
                              : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            ultraLowCostMode ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Cleanup Messages Button */}
                    <button
                      onClick={() => {
                        onCleanupMessages();
                        setShowDevMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isDark
                          ? 'hover:bg-gray-700 text-gray-300'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Clean up duplicate messages</span>
                    </button>

                    {/* Clear All Messages Button */}
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to clear ALL messages? This cannot be undone.')) {
                          onClearAllMessages();
                          setShowDevMenu(false);
                        }
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isDark
                          ? 'hover:bg-red-900/50 text-red-400'
                          : 'hover:bg-red-100 text-red-600'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Clear all messages</span>
                    </button>

                    {/* Inspect Storage Button */}
                    <button
                      onClick={() => {
                        onInspectStorage();
                        setShowDevMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isDark
                          ? 'hover:bg-yellow-900/50 text-yellow-400'
                          : 'hover:bg-yellow-100 text-yellow-600'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Inspect localStorage</span>
                    </button>

                    {/* Manual Recovery Button */}
                    <button
                      onClick={() => {
                        onManualRecovery();
                        setShowDevMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isDark
                          ? 'hover:bg-blue-900/50 text-blue-400'
                          : 'hover:bg-blue-100 text-blue-600'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Recover from transactions</span>
                    </button>

                    {/* Debug Send Button */}
                    <button
                      onClick={() => {
                        onDebugSendMessage();
                        setShowDevMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isDark
                          ? 'hover:bg-green-900/50 text-green-400'
                          : 'hover:bg-green-100 text-green-600'
                      }`}
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Debug send message</span>
                    </button>

                    {/* Database Test Button */}
                    <button
                      onClick={() => {
                        onTestDatabase();
                        setShowDevMenu(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isDark
                          ? 'hover:bg-purple-900/50 text-purple-400'
                          : 'hover:bg-purple-100 text-purple-600'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Test database connection</span>
                    </button>
                    </div>
                  </div>
                </div>
              )}
          </div>

          {/* Wallet Connection - Mobile Optimized */}
          <div className="mt-3">
            {walletButton}
          </div>
        </div>
      </div>
    </header>
  );
};

export default BaseMiniAppHeader;