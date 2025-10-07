import React from 'react';
import { useAccount, useDisconnect, useConnect, useSwitchChain } from 'wagmi';
import { Wallet, AlertTriangle } from 'lucide-react';
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

  return (
    <div className="w-full">
      {/* Wallet Connection Button */}
      <div className="w-full">
               {evmConnected && evmAddress ? (
                needsNetworkSwitch ? (
                  <button
                    onClick={(): void => switchChain({ chainId: base.id })}
                    className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      isDark
                        ? 'bg-orange-600 hover:bg-orange-700 text-white'
                        : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Switch to Base</span>
                    </div>
                  </button>
                ) : (
                  <button
                    onClick={(): void => evmDisconnect()}
                    className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      isDark
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
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
                  className={`w-full px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Wallet className="w-4 h-4" />
                    <span>Connect Base Wallet</span>
                  </div>
                </button>
               )}
      </div>
    </div>
  );
};

export default BaseMiniAppWallet;
