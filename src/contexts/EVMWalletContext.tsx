import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { evmService, EVMProvider, EVMSigner, EVMWalletProviderInfo } from '../services/evmService';
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
  currentWallet: string | null;
  availableWallets: EVMWalletProviderInfo[];
  
  // Actions
  connect: () => Promise<void>;
  connectToWallet: (walletId: string) => Promise<void>;
  disconnect: () => void;
  switchChain: (chainId: number) => Promise<void>;
  refreshBalance: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
  clearConnectionState: () => void;
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
  const [currentWallet, setCurrentWallet] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentChain = chainId ? SUPPORTED_EVM_CHAINS.find(chain => chain.id === chainId) || null : null;
  const availableWallets = evmService.getAvailableWallets();

  const walletInfo: EVMWalletInfo | null = isConnected && address && chainId ? {
    address,
    connected: true,
    chainId,
    balance: balance || undefined,
  } : null;

  // Check for existing connection on mount - DISABLED to prevent auto-reconnection
  useEffect(() => {
    // console.log('EVM Wallet Context - Initializing...');
    // checkExistingConnection(); // Disabled to prevent auto-reconnection
  }, []);

  // Debug state changes (commented out for production)
  // useEffect(() => {
  //   console.log('EVM Wallet Context - State changed:', {
  //     isConnected,
  //     address,
  //     chainId,
  //     isConnecting
  //   });
  // }, [isConnected, address, chainId, isConnecting]);

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
    try {
      if (isConnecting) return;
      
      console.log('EVM Wallet Context - Starting connection...');
      setIsConnecting(true);
      setError(null);

      // Set a timeout to clear connection state if it gets stuck
      const timeoutId = setTimeout(() => {
        if (isConnecting) {
          console.log('Connection timeout - clearing state');
          setIsConnecting(false);
          setError(null);
        }
      }, 30000); // 30 second timeout

      try {
        const { address: connectedAddress, chainId: connectedChainId } = await evmService.connectWallet();
        
        console.log('EVM Wallet Context - Connection successful:', { connectedAddress, connectedChainId });
        clearTimeout(timeoutId);
        setAddress(connectedAddress);
        setChainId(connectedChainId);
        setIsConnected(true);
        
        // Get initial balance
        await refreshBalance();
        
        console.log('EVM Wallet Context - State updated:', { 
          isConnected: true, 
          address: connectedAddress, 
          chainId: connectedChainId 
        });
        
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Failed to connect EVM wallet:', error);
        
        // Safely extract error message
        let errorMessage = 'Failed to connect wallet';
        
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          // Handle various error object formats
          if ('message' in error) {
            errorMessage = String(error.message);
          } else if ('error' in error) {
            errorMessage = String(error.error);
          } else if ('reason' in error) {
            errorMessage = String(error.reason);
          } else {
            errorMessage = JSON.stringify(error);
          }
        }
        
        // Check if it's a user rejection/cancellation
        if (errorMessage.includes('User rejected') || 
            errorMessage.includes('User denied') || 
            errorMessage.includes('cancelled') ||
            errorMessage.includes('rejected') ||
            errorMessage.includes('Connection cancelled by user') ||
            errorMessage.includes('User rejected the request') ||
            errorMessage.includes('User denied transaction') ||
            errorMessage.includes('User cancelled')) {
          // Don't show error for user cancellation
          console.log('User cancelled wallet connection');
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsConnecting(false);
      }
    } catch (outerError) {
      console.error('Unexpected error in connect function:', outerError);
      setIsConnecting(false);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const connectToWallet = async (walletId: string) => {
    try {
      if (isConnecting) return;
      
      console.log('EVM Wallet Context - Connecting to wallet:', walletId);
      setIsConnecting(true);
      setError(null);

      const timeoutId = setTimeout(() => {
        if (isConnecting) {
          console.log('Connection timeout - clearing state');
          setIsConnecting(false);
          setError(null);
        }
      }, 30000); // 30 second timeout

      try {
        const { address: connectedAddress, chainId: connectedChainId } = await evmService.connectToWallet(walletId);
        
        console.log('EVM Wallet Context - Connection successful:', { connectedAddress, connectedChainId });
        clearTimeout(timeoutId);
        setAddress(connectedAddress);
        setChainId(connectedChainId);
        setCurrentWallet(walletId);
        setIsConnected(true);
        
        // Get initial balance
        await refreshBalance();
        
        console.log('EVM Wallet Context - State updated:', { 
          isConnected: true, 
          address: connectedAddress, 
          chainId: connectedChainId,
          currentWallet: walletId
        });
        
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('Failed to connect to EVM wallet:', error);
        
        // Safely extract error message
        let errorMessage = 'Failed to connect wallet';
        
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          if ('message' in error) {
            errorMessage = String(error.message);
          } else if ('error' in error) {
            errorMessage = String(error.error);
          } else if ('reason' in error) {
            errorMessage = String(error.reason);
          } else {
            errorMessage = JSON.stringify(error);
          }
        }
        
        // Check if it's a user rejection/cancellation
        if (errorMessage.includes('User rejected') || 
            errorMessage.includes('User denied') || 
            errorMessage.includes('cancelled') ||
            errorMessage.includes('rejected') ||
            errorMessage.includes('Connection cancelled by user') ||
            errorMessage.includes('User rejected the request') ||
            errorMessage.includes('User denied transaction') ||
            errorMessage.includes('User cancelled')) {
          // Don't show error for user cancellation
          console.log('User cancelled wallet connection');
        } else {
          setError(errorMessage);
        }
      } finally {
        setIsConnecting(false);
      }
    } catch (outerError) {
      console.error('Unexpected error in connectToWallet function:', outerError);
      setIsConnecting(false);
      setError('An unexpected error occurred. Please try again.');
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

  const clearConnectionState = () => {
    setIsConnecting(false);
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
    currentWallet,
    availableWallets,
    connect,
    connectToWallet,
    disconnect,
    switchChain,
    refreshBalance,
    error,
    clearError,
    clearConnectionState,
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
