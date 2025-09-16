import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export type BlockchainType = 'solana' | 'evm';

interface BlockchainOption {
  id: BlockchainType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

const BLOCKCHAIN_OPTIONS: BlockchainOption[] = [
  {
    id: 'solana',
    name: 'Solana',
    description: 'Fast, low-cost transactions',
    icon: '🟣',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'evm',
    name: 'EVM Chains',
    description: 'Ethereum, Polygon, Arbitrum, etc.',
    icon: '🔷',
    color: 'from-blue-500 to-cyan-500',
  },
];

interface BlockchainSelectorProps {
  selectedBlockchain: BlockchainType;
  onBlockchainSelect: (blockchain: BlockchainType) => void;
  disabled?: boolean;
}

const BlockchainSelector: React.FC<BlockchainSelectorProps> = ({
  selectedBlockchain,
  onBlockchainSelect,
  disabled = false,
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = BLOCKCHAIN_OPTIONS.find(option => option.id === selectedBlockchain);

  const handleSelect = (blockchain: BlockchainType) => {
    onBlockchainSelect(blockchain);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
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
          {selectedOption && (
            <>
              <div className="text-2xl">{selectedOption.icon}</div>
              <div className="text-left">
                <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {selectedOption.name}
                </div>
                <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedOption.description}
                </div>
              </div>
            </>
          )}
        </div>
        <ChevronDown className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-xl z-50 ${
          isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
        }`}>
          <div className="p-2">
            {BLOCKCHAIN_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors ${
                  selectedBlockchain === option.id
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
                    <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {option.name}
                    </div>
                    <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {option.description}
                    </div>
                  </div>
                </div>
                {selectedBlockchain === option.id && (
                  <Check className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainSelector;
