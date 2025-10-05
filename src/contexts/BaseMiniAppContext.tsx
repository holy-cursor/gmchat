import React, { createContext, useContext, ReactNode } from 'react';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { minikitConfig } from '../config/minikit';
import { base } from 'wagmi/chains';

const queryClient = new QueryClient();

interface BaseMiniAppContextType {
  // Add any Base Mini App specific context here
}

const BaseMiniAppContext = createContext<BaseMiniAppContextType | undefined>(undefined);

interface BaseMiniAppProviderProps {
  children: ReactNode;
}

export const BaseMiniAppProvider: React.FC<BaseMiniAppProviderProps> = ({ children }) => {
  return (
    <WagmiProvider config={minikitConfig}>
      <QueryClientProvider client={queryClient}>
        <OnchainKitProvider chain={base}>
          <BaseMiniAppContext.Provider value={{}}>
            {children}
          </BaseMiniAppContext.Provider>
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export const useBaseMiniApp = () => {
  const context = useContext(BaseMiniAppContext);
  if (context === undefined) {
    throw new Error('useBaseMiniApp must be used within a BaseMiniAppProvider');
  }
  return context;
};
