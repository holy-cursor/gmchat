import React, { useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useEVMWallet } from '../contexts/EVMWalletContext';
import EVMWalletSelector from './EVMWalletSelector';

export type WalletType = 'solana' | 'evm';

interface UnifiedWalletButtonProps {
  onWalletTypeChange?: (type: WalletType) => void;
}

const UnifiedWalletButton: React.FC<UnifiedWalletButtonProps> = ({ onWalletTypeChange }) => {
  const { isDark } = useTheme();
  const evmWallet = useEVMWallet();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedWalletType, setSelectedWalletType] = useState<WalletType>('solana');

  const handleWalletTypeSelect = (type: WalletType) => {
    setSelectedWalletType(type);
    setIsDropdownOpen(false);
    onWalletTypeChange?.(type);
  };

  const isConnected = selectedWalletType === 'solana' ? false : evmWallet.isConnected;
  const isConnecting = selectedWalletType === 'evm' ? evmWallet.isConnecting : false;
  const address = selectedWalletType === 'evm' ? evmWallet.address : null;

  // Debug logging (commented out for production)
  // React.useEffect(() => {
  //   console.log('UnifiedWalletButton - selectedWalletType:', selectedWalletType);
  //   console.log('UnifiedWalletButton - evmWallet.isConnected:', evmWallet.isConnected);
  //   console.log('UnifiedWalletButton - evmWallet.address:', evmWallet.address);
  // }, [selectedWalletType, evmWallet.isConnected, evmWallet.address]);

  const handleDisconnect = () => {
    if (selectedWalletType === 'evm') {
      evmWallet.disconnect();
    }
    // Solana disconnect is handled by WalletMultiButton
  };

  return (
    <div className="relative">
      {/* Wallet Type Selector */}
      <div className="flex items-center space-x-2">
        {/* Wallet Type Dropdown */}
        <div className="relative">
          <button
            onClick={(): void => setIsDropdownOpen(!isDropdownOpen)}
            className={`flex items-center space-x-2 px-4 py-3 rounded-2xl border transition-all duration-200 ${
              isDark
                ? 'bg-gray-800 border-gray-600 hover:border-gray-500 hover:bg-gray-700'
                : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center space-x-2">
              <div className="text-2xl">
                {selectedWalletType === 'solana' ? '🟣' : '🔷'}
              </div>
              <div className="text-left">
                <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedWalletType === 'solana' ? 'Solana' : 'EVM'}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedWalletType === 'solana' ? 'Fast & Low Cost' : 'Ethereum & More'}
                </div>
              </div>
            </div>
            <ChevronDown className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
          </button>

          {isDropdownOpen && (
            <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-xl z-50 ${
              isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              <div className="p-2">
                <button
                  onClick={(): void => handleWalletTypeSelect('solana')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                    selectedWalletType === 'solana'
                      ? isDark
                        ? 'bg-gray-700'
                        : 'bg-gray-100'
                      : isDark
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🟣</div>
                    <div className="text-left">
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Solana
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Fast & Low Cost
                      </div>
                    </div>
                  </div>
                  {selectedWalletType === 'solana' && (
                    <Check className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  )}
                </button>

                <button
                  onClick={(): void => handleWalletTypeSelect('evm')}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                    selectedWalletType === 'evm'
                      ? isDark
                        ? 'bg-gray-700'
                        : 'bg-gray-100'
                      : isDark
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">🔷</div>
                    <div className="text-left">
                      <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        EVM Chains
                      </div>
                      <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Ethereum & More
                      </div>
                    </div>
                  </div>
                  {selectedWalletType === 'evm' && (
                    <Check className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Wallet Connection Button */}
        {selectedWalletType === 'solana' ? (
          <div className="relative">
            <WalletMultiButton className={`!text-white !px-4 sm:!px-6 !py-3 !rounded-2xl !text-sm !font-semibold !transition-all !duration-200 !shadow-lg hover:!shadow-xl !transform hover:!scale-105 ${
              isDark 
                ? '!bg-gradient-to-r !from-purple-500 !to-pink-600 hover:!from-purple-600 hover:!to-pink-700' 
                : '!bg-gradient-to-r !from-purple-400 !to-pink-500 hover:!from-purple-500 hover:!to-pink-600'
            }`} />
          </div>
        ) : (
          <EVMWalletSelector
            onWalletSelect={(walletId) => {
              console.log('Wallet selected:', walletId);
            }}
            disabled={isConnecting}
          />
        )}
      </div>
    </div>
  );
};

export default UnifiedWalletButton;
