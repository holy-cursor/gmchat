import React, { useState } from 'react';
import { MessageCircle, Plus, Settings, RefreshCw, Code, ChevronUp, UserPlus, Moon, Sun } from 'lucide-react';
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
  const [isDevMode, setIsDevMode] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState('');

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-200 ${
      isDark 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
             {/* Mobile-optimized header */}
             <div className="px-2 sm:px-4 py-2 sm:py-3">
               <div className="flex items-center justify-between">
                 {/* App Title & Logo */}
                 <div className="flex items-center space-x-1 sm:space-x-3 min-w-0 flex-1">
                   <div className="flex items-center space-x-1 sm:space-x-2">
                     <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                       <MessageCircle className="w-3 h-3 sm:w-5 sm:h-5 text-white" />
                     </div>
                     <div className="min-w-0">
                       <h1 className={`text-sm sm:text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'} truncate`}>
                         Parc3l
                       </h1>
                       <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} hidden sm:block`}>
                         Base Mini App
                       </p>
                     </div>
                   </div>
                 </div>

                 {/* Action Buttons */}
                 <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                   {/* Dark Mode Toggle */}
                   <button
                     onClick={toggleTheme}
                     className={`p-1.5 sm:p-2 rounded-xl transition-all duration-200 ${
                       isDark
                         ? 'bg-gray-800 hover:bg-gray-700 text-yellow-400 hover:text-yellow-300'
                         : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                     }`}
                     title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                   >
                     {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
                   </button>

                   {/* Sync Messages Button */}
                   <button
                     onClick={onSyncMessages}
                     className={`p-1.5 sm:p-2 rounded-xl transition-all duration-200 ${
                       isDark
                         ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                         : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                     }`}
                     title="Sync messages from IPFS (cross-device)"
                   >
                     <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5" />
                   </button>

            {/* Developer Mode Toggle */}
            <div className="relative">
              <button
                onClick={() => {
                  if (!isDevMode) {
                    // Show passcode modal to enable dev mode
                    setShowPasscodeModal(true);
                  } else {
                    // Toggle dev menu visibility
                    setShowDevMenu(!showDevMenu);
                  }
                }}
                className={`p-2 rounded-xl transition-all duration-200 ${
                  isDevMode
                    ? isDark
                      ? 'bg-purple-800 hover:bg-purple-700 text-purple-300 hover:text-white'
                      : 'bg-purple-100 hover:bg-purple-200 text-purple-600 hover:text-purple-900'
                    : isDark
                      ? 'bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-gray-300'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-600'
                }`}
                title={isDevMode ? "Developer Menu" : "Enter passcode to access developer mode"}
              >
                <Code className="w-5 h-5" />
              </button>

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

            {/* Passcode Modal */}
            {showPasscodeModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className={`p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 ${
                  isDark ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      isDark ? 'bg-purple-800' : 'bg-purple-100'
                    }`}>
                      <Code className={`w-8 h-8 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
                    </div>
                    <h3 className={`text-xl font-bold mb-2 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>
                      Developer Access
                    </h3>
                    <p className={`text-sm ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      Enter passcode to access developer tools
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <input
                        type="password"
                        value={passcodeInput}
                        onChange={(e) => setPasscodeInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            if (passcodeInput === 'codernigga') {
                              setIsDevMode(true);
                              setShowDevMenu(true);
                              setShowPasscodeModal(false);
                              setPasscodeInput('');
                            } else {
                              alert('Incorrect passcode');
                              setPasscodeInput('');
                            }
                          }
                        }}
                        placeholder="Enter passcode..."
                        className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center font-mono ${
                          isDark 
                            ? 'border-gray-600 bg-gray-700 text-white placeholder-gray-400' 
                            : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500'
                        }`}
                        autoFocus
                      />
                    </div>

                    <div className="flex space-x-3">
                      <button
                        onClick={() => {
                          setShowPasscodeModal(false);
                          setPasscodeInput('');
                        }}
                        className={`flex-1 px-4 py-2 rounded-xl transition-colors ${
                          isDark
                            ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                        }`}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (passcodeInput === 'codernigga') {
                            setIsDevMode(true);
                            setShowDevMenu(true);
                            setShowPasscodeModal(false);
                            setPasscodeInput('');
                          } else {
                            alert('Incorrect passcode');
                            setPasscodeInput('');
                          }
                        }}
                        className={`flex-1 px-4 py-2 rounded-xl transition-colors ${
                          isDark
                            ? 'bg-purple-700 hover:bg-purple-600 text-white'
                            : 'bg-purple-600 hover:bg-purple-700 text-white'
                        }`}
                      >
                        Access
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

                   {/* Add Contact Button */}
                   <button
                     onClick={onAddContact}
                     className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all duration-200 font-medium ${
                       isDark
                         ? 'bg-blue-700 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                         : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl'
                     }`}
                     title="Add new contact"
                   >
                     <UserPlus className="w-3 h-3 sm:w-4 sm:h-4" />
                     <span className="text-xs sm:text-sm hidden sm:inline">Add Contact</span>
                     <span className="text-xs sm:text-sm sm:hidden">Add</span>
                   </button>

                   {/* New Message Button */}
                   <button
                     onClick={onNewMessage}
                     className={`relative flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-xl transition-all duration-200 font-medium ${
                       isDark
                         ? 'bg-green-700 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                         : 'bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl'
                     }`}
                     title="Start new conversation"
                   >
                     <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                     <span className="text-xs sm:text-sm hidden sm:inline">New Message</span>
                     <span className="text-xs sm:text-sm sm:hidden">New</span>
                     {unreadCount > 0 && (
                       <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold shadow-lg">
                         {unreadCount > 99 ? '99+' : unreadCount}
                       </span>
                     )}
                   </button>

            {/* Settings Button */}
            <button
              onClick={onOpenAbout}
              className={`p-2 rounded-xl transition-all duration-200 ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
              }`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Wallet Connection - Mobile Optimized */}
        <div className="mt-3">
          {walletButton}
        </div>
      </div>
    </header>
  );
};

export default BaseMiniAppHeader;
