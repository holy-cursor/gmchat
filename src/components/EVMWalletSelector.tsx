import React, { useState } from 'react';
import { ChevronDown, Wallet, ExternalLink } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useEVMWallet } from '../contexts/EVMWalletContext';
import { EVMWalletProviderInfo } from '../services/evmService';

interface EVMWalletSelectorProps {
  onWalletSelect?: (walletId: string) => void;
  disabled?: boolean;
}

const EVMWalletSelector: React.FC<EVMWalletSelectorProps> = ({
  onWalletSelect,
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const { 
    isConnected, 
    currentWallet, 
    availableWallets, 
    connectToWallet, 
    disconnect,
    isConnecting 
  } = useEVMWallet();
  
  const [isOpen, setIsOpen] = useState(false);

         const handleWalletSelect = async (wallet: EVMWalletProviderInfo) => {
           if (disabled || isConnecting) return;

           console.log('EVM Wallet Selector - Selected wallet:', wallet);

           if (!wallet.isInstalled) {
             console.log('EVM Wallet Selector - Wallet not installed, opening installation page');
             // Open wallet installation page
             const installUrls: { [key: string]: string } = {
               metamask: 'https://metamask.io/download/',
               coinbase: 'https://www.coinbase.com/wallet',
             };

             const url = installUrls[wallet.id];
             if (url) {
               window.open(url, '_blank');
             }
             return;
           }

           try {
             if (wallet.id === 'walletconnect') {
               console.log('EVM Wallet Selector - Connecting via WalletConnect directly');
               // Connect directly to WalletConnect without showing custom modal
               await connectToWallet(wallet.id);
               onWalletSelect?.(wallet.id);
               setIsOpen(false);
             } else {
               console.log('EVM Wallet Selector - Connecting to installed wallet:', wallet.name);
               await connectToWallet(wallet.id);
               onWalletSelect?.(wallet.id);
               setIsOpen(false);
             }
           } catch (error) {
             console.error('EVM Wallet Selector - Failed to connect to wallet:', error);
             // Show user-friendly error message
             if (error instanceof Error) {
               alert(`Connection failed: ${error.message}`);
             }
           }
         };

  const handleDisconnect = () => {
    disconnect();
    setIsOpen(false);
  };

  const currentWalletInfo = availableWallets.find(w => w.id === currentWallet);

  return (
    <div className="relative">
      {/* Wallet Button */}
      <button
        onClick={(): void => setIsOpen(!isOpen)}
        disabled={disabled || isConnecting}
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl border transition-all duration-200 ${
          isDark
            ? 'bg-gray-800 border-gray-600 hover:bg-gray-700 text-white'
            : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
        } ${disabled || isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}`}
      >
        {isConnecting ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Connecting...</span>
          </>
        ) : isConnected && currentWalletInfo ? (
          <>
            <span className="text-lg">{currentWalletInfo.icon}</span>
            <span className="text-sm font-medium">{currentWalletInfo.name}</span>
          </>
        ) : (
          <>
            <Wallet className="w-4 h-4" />
            <span className="text-sm">Select Wallet</span>
          </>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute top-full left-0 mt-2 w-64 rounded-xl border shadow-lg z-50 ${
          isDark
            ? 'bg-gray-800 border-gray-600'
            : 'bg-white border-gray-200'
        }`}>
          <div className="p-2">
            {isConnected && (
              <div className="px-3 py-2 mb-2 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Connected
                  </span>
                  <button
                    onClick={handleDisconnect}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      isDark
                        ? 'text-red-400 hover:bg-red-900/20'
                        : 'text-red-600 hover:bg-red-50'
                    }`}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  onClick={async (): Promise<void> => {
                    await handleWalletSelect(wallet);
                  }}
                  disabled={disabled || isConnecting}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg transition-colors ${
                    isDark
                      ? 'hover:bg-gray-700 text-white'
                      : 'hover:bg-gray-50 text-gray-900'
                  } ${disabled || isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{wallet.icon}</span>
                    <div className="text-left">
                      <div className="text-sm font-medium">{wallet.name}</div>
                      {!wallet.isInstalled && (
                        <div className={`text-xs ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          Not installed
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {!wallet.isInstalled && (
                    <ExternalLink className="w-4 h-4 opacity-50" />
                  )}
                  
                  {isConnected && currentWallet === wallet.id && (
                    <div className={`w-2 h-2 rounded-full ${
                      isDark ? 'bg-green-400' : 'bg-green-500'
                    }`} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* WalletConnect Modal - Removed, using direct connection */}
    </div>
  );
};

export default EVMWalletSelector;
