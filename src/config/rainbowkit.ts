import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'DotMsg',
  projectId: 'YOUR_PROJECT_ID', // You can get this from WalletConnect Cloud
  chains: [base, baseSepolia], // Focus on Base networks only
  ssr: false, // If your dApp uses server side rendering (SSR)
});

export const supportedChains = [base, baseSepolia];
