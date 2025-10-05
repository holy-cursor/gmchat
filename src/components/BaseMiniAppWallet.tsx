import React, { useState } from 'react';
import { useAccount, useDisconnect, useConnect, useSwitchChain } from 'wagmi';
import { Wallet, ChevronDown, Check, AlertTriangle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { base } from 'wagmi/chains';

export type WalletType = 'base';

interface BaseMiniAppWalletProps {
  onWalletTypeChange?: (type: WalletType) => void;
}

const BaseMiniAppWallet: React.FC<BaseMiniAppWalletProps> = ({ onWalletTypeChange }) => {
  console.log('BaseMiniAppWallet - Component rendering!');
  
  const { isDark } = useTheme();
  const { address: evmAddress, isConnected: evmConnected, chainId } = useAccount();
  const { disconnect: evmDisconnect } = useDisconnect();
  const { connect, connectors } = useConnect();
  const { switchChain } = useSwitchChain();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedWalletType, setSelectedWalletType] = useState<WalletType>('base');

  // Debug logging
  console.log('BaseMiniAppWallet - Render state:', {
    evmAddress,
    evmConnected,
    chainId,
    connectors: connectors?.length || 0,
    connectorNames: connectors?.map(c => c.name) || []
  });

  // Check if we're on the correct network
  const isOnBase = chainId === base.id;
  const needsNetworkSwitch = evmConnected && !isOnBase;

  const blockchainOptions = [
    { id: 'base', name: 'Base', icon: '🔵' }
  ] as const;

  const handleWalletTypeSelect = (type: WalletType) => {
    setSelectedWalletType(type);
    setIsDropdownOpen(false);
    onWalletTypeChange?.(type);
  };

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
               {evmConnected && evmAddress ? (
                needsNetworkSwitch ? (
                  <button
                    onClick={(): void => switchChain({ chainId: base.id })}
                    className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                      isDark
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Switch to Base</span>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={(): void => evmDisconnect()}
                    className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                      isDark
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Wallet className="w-4 h-4" />
                      <span>
                        {`${evmAddress.slice(0, 6)}...${evmAddress.slice(-4)}`}
                      </span>
                    </div>
                  </button>
                )
              ) : (
                <button
                  onClick={(): void => {
                    console.log('Connect button clicked!');
                    console.log('Available connectors:', connectors);
                    console.log('Connector names:', connectors.map(c => c.name));
                    if (connectors.length > 0) {
                      // Try to find MetaMask, Coinbase, or Injected first
                      const preferredConnector = connectors.find(c => 
                        c.name.toLowerCase().includes('metamask') ||
                        c.name.toLowerCase().includes('coinbase') ||
                        c.name.toLowerCase().includes('injected')
                      );
                      const connectorToUse = preferredConnector || connectors[0];
                      console.log('Attempting to connect with:', connectorToUse.name);
                      connect({ connector: connectorToUse });
                    } else {
                      console.error('No connectors available!');
                    }
                  }}
                  className={`px-6 py-3 rounded-2xl font-semibold text-sm transition-all duration-200 ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4" />
                    <span>Connect Base Wallet</span>
                  </div>
                </button>
               )}
             </div>
      </div>
    </div>
  );
};

export default BaseMiniAppWallet;
