import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { evmService, EVMProvider, EVMSigner } from '../services/evmService';
import { EVMWalletInfo, EVMChain, SUPPORTED_EVM_CHAINS } from '../types/evm';

interface EVMWalletContextType {
  // Connection state
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
  
  // Wallet info
  walletInfo: EVMWalletInfo | null;
  currentChain: EVMChain | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

const EVMWalletContext = createContext<EVMWalletContextType | undefined>(undefined);

interface EVMWalletProviderProps {
  children: ReactNode;
}

export const EVMWalletProvider: React.FC<EVMWalletProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentChain = chainId ? SUPPORTED_EVM_CHAINS.find(chain => chain.id === chainId) || null : null;

  const walletInfo: EVMWalletInfo | null = isConnected && address && chainId ? {
    address,
    connected: true,
    chainId,
    balance: balance || undefined,
  } : null;

  // Check for existing connection on mount
  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      if (evmService.isConnected()) {
        const currentChainId = evmService.getCurrentChainId();
        if (currentChainId) {
          setChainId(currentChainId);
          setIsConnected(true);
          // Get address and balance
          const address = await evmService.connectWallet();
          setAddress(address.address);
          await refreshBalance();
        }
      }
    } catch (error) {
      console.log('No existing EVM connection found');
    }
  };

  const connect = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    setError(null);

    try {
      const { address: connectedAddress, chainId: connectedChainId } = await evmService.connectWallet();
      
      setAddress(connectedAddress);
      setChainId(connectedChainId);
      setIsConnected(true);
      
      // Get initial balance
      await refreshBalance();
      
    } catch (error) {
      console.error('Failed to connect EVM wallet:', error);
      setError(error instanceof Error ? error.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    evmService.disconnect();
    setIsConnected(false);
    setAddress(null);
    setChainId(null);
    setBalance(null);
    setError(null);
  };

  const switchChain = async (newChainId: number) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      await evmService.switchChain(newChainId);
      setChainId(newChainId);
      await refreshBalance();
    } catch (error) {
      console.error('Failed to switch chain:', error);
      setError(error instanceof Error ? error.message : 'Failed to switch chain');
      throw error;
    }
  };

  const refreshBalance = async () => {
    if (!address || !chainId) return;

    try {
      const balanceWei = await evmService.getBalance(address, chainId);
      const chain = evmService.getChainById(chainId);
      const formattedBalance = evmService.formatBalance(balanceWei, chain?.nativeCurrency.decimals || 18);
      setBalance(formattedBalance);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
      // Don't set error for balance refresh failures
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: EVMWalletContextType = {
    isConnected,
    isConnecting,
    address,
    chainId,
    balance,
    walletInfo,
    currentChain,
    connect,
    disconnect,
    switchChain,
    refreshBalance,
    error,
    clearError,
  };

  return (
    <EVMWalletContext.Provider value={value}>
      {children}
    </EVMWalletContext.Provider>
  );
};

export const useEVMWallet = (): EVMWalletContextType => {
  const context = useContext(EVMWalletContext);
  if (context === undefined) {
    throw new Error('useEVMWallet must be used within an EVMWalletProvider');
  }
  return context;
};
