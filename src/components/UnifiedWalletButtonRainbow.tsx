import React, { useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useDisconnect } from 'wagmi';
import { Wallet, ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export type WalletType = 'solana' | 'base';

interface UnifiedWalletButtonRainbowProps {
  onWalletTypeChange?: (type: WalletType) => void;
}

const UnifiedWalletButtonRainbow: React.FC<UnifiedWalletButtonRainbowProps> = ({ onWalletTypeChange }) => {
  const { isDark } = useTheme();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const { disconnect: evmDisconnect } = useDisconnect();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedWalletType, setSelectedWalletType] = useState<WalletType>('base');

  const blockchainOptions = [
    { id: 'base', name: 'Base', icon: '🔵' },
    { id: 'solana', name: 'Solana', icon: '🟣' }
  ] as const;

  const handleWalletTypeSelect = (type: WalletType) => {
    setSelectedWalletType(type);
    setIsDropdownOpen(false);
    onWalletTypeChange?.(type);
  };

  const handleDisconnect = () => {
    if (selectedWalletType !== 'solana' && evmConnected) {
      evmDisconnect();
    }
    // Solana disconnect is handled by WalletMultiButton
  };

  const isConnected = selectedWalletType === 'solana' ? false : evmConnected; // Solana connection state handled by WalletMultiButton
  const address = selectedWalletType !== 'solana' ? evmAddress : null;
  const selectedOption = blockchainOptions.find(option => option.id === selectedWalletType);

  return (
    <div className="relative">
      {/* Wallet Type Selector */}
      <div className="flex items-center space-x-2">
        {/* Blockchain Type Dropdown */}
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
                {selectedOption?.icon}
              </div>
              <div className="text-left">
                <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedOption?.name}
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
                {blockchainOptions.map((option) => (
                  <button
                    key={option.id}
                    onClick={(): void => handleWalletTypeSelect(option.id as WalletType)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                      selectedWalletType === option.id
                        ? isDark
                          ? 'bg-gray-700'
                          : 'bg-gray-100'
                        : isDark
                        ? 'hover:bg-gray-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{option.icon}</div>
                      <div className="text-left">
                        <div className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {option.name}
                        </div>
                      </div>
                    </div>
                    {selectedWalletType === option.id && (
                      <Check className="w-4 h-4 text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Wallet Connection Button */}
        <div className="flex items-center space-x-2">
          {selectedWalletType === 'solana' ? (
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !text-white !rounded-2xl !px-6 !py-3 !font-semibold !text-sm !transition-all !duration-200" />
          ) : (
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openConnectModal,
                authenticationStatus,
                mounted,
              }) => {
                // Note: If your app doesn't use authentication, you
                // can remove all 'authenticationStatus' checks
                const ready = mounted && authenticationStatus !== 'loading';
                const connected =
                  ready &&
                  account &&
                  chain &&
                  (!authenticationStatus ||
                    authenticationStatus === 'authenticated');

                return (
                  <div
                    {...(!ready && {
                      'aria-hidden': true,
                      'style': {
                        opacity: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                      },
                    })}
                  >
                    {(() => {
                      if (!connected) {
                        return (
                          <button
                            onClick={openConnectModal}
                            type="button"
                            className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                              isDark
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                          >
                            <Wallet className="w-4 h-4" />
                            <span>Connect EVM Wallet</span>
                          </button>
                        );
                      }


                      return (
                        <button
                          onClick={openAccountModal}
                          type="button"
                          className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                            isDark
                              ? 'bg-green-600 hover:bg-green-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                          }`}
                        >
                          <Wallet className="w-4 h-4" />
                          <span>
                            {account.displayName}
                            {account.displayBalance
                              ? ` (${account.displayBalance})`
                              : ''}
                          </span>
                        </button>
                      );
                    })()}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          )}
        </div>
      </div>
    </div>
  );
};

export default UnifiedWalletButtonRainbow;
