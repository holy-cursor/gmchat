import React, { createContext, useContext, ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, getDefaultWallets } from '@rainbow-me/rainbowkit';
import { config } from '../config/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

// Create a client
const queryClient = new QueryClient();

interface RainbowKitContextType {
  // This will be provided by RainbowKit's hooks
}

const RainbowKitContext = createContext<RainbowKitContextType | undefined>(undefined);

interface RainbowKitProviderProps {
  children: ReactNode;
}

export const RainbowKitProviderWrapper: React.FC<RainbowKitProviderProps> = ({ children }) => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export const useRainbowKit = () => {
  const context = useContext(RainbowKitContext);
  if (context === undefined) {
    throw new Error('useRainbowKit must be used within a RainbowKitProvider');
  }
  return context;
};
