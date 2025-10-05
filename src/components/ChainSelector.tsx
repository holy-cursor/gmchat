import React, { useState } from 'react';
import { ChevronDown, Check, ExternalLink } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useEVMWallet } from '../contexts/EVMWalletContext';
import { SUPPORTED_EVM_CHAINS, TESTNET_EVM_CHAINS, EVMChain } from '../types/evm';

interface ChainSelectorProps {
  selectedChainId?: number;
  onChainSelect: (chainId: number) => void;
  disabled?: boolean;
}

const ChainSelector: React.FC<ChainSelectorProps> = ({
  selectedChainId,
  onChainSelect,
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const { isConnected, switchChain } = useEVMWallet();
  const [isOpen, setIsOpen] = useState(false);

  // Use testnets by default for development
  const availableChains = [...TESTNET_EVM_CHAINS, ...SUPPORTED_EVM_CHAINS];
  const selectedChain = availableChains.find(chain => chain.id === selectedChainId);

  const handleChainSelect = async (chain: EVMChain) => {
    if (disabled) return;

    try {
      if (isConnected) {
        await switchChain(chain.id);
      }
      onChainSelect(chain.id);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch chain:', error);
      // Still allow selection even if chain switch fails
      onChainSelect(chain.id);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={(): void => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl border transition-all duration-200 ${
          disabled
            ? 'bg-gray-100 border-gray-200 cursor-not-allowed'
            : isDark
            ? 'bg-gray-800 border-gray-600 hover:border-gray-500 hover:bg-gray-700'
            : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center space-x-3">
          {selectedChain ? (
            <>
              {selectedChain.iconUrl && (
                <img
                  src={selectedChain.iconUrl}
                  alt={selectedChain.name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <div className="text-left">
                <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedChain.name}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedChain.nativeCurrency.symbol}
                </div>
              </div>
            </>
          ) : (
            <div className="text-left">
              <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Select Chain
              </div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Choose a blockchain
              </div>
            </div>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-xl z-50 ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          <div className="p-2 max-h-80 overflow-y-auto">
            {availableChains.map((chain) => (
              <button
                key={chain.id}
                onClick={async (): Promise<void> => {
                  await handleChainSelect(chain);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                  selectedChainId === chain.id
                    ? isDark
                      ? 'bg-gray-700'
                      : 'bg-gray-100'
                    : isDark
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {chain.iconUrl && (
                    <img
                      src={chain.iconUrl}
                      alt={chain.name}
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                  <div className="text-left">
                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {chain.name}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {chain.nativeCurrency.symbol}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={chain.blockExplorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e: React.MouseEvent): void => e.stopPropagation()}
                    className={`p-1 rounded-lg transition-colors ${
                      isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                    }`}
                  >
                    <ExternalLink className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                  </a>
                  {selectedChainId === chain.id && (
                    <Check className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChainSelector;
