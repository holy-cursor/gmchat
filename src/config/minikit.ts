import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

export const minikitConfig = getDefaultConfig({
  appName: 'DotMsg',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID',
  chains: [base, baseSepolia], // Put mainnet first for real ETH
  ssr: false,
});

export default minikitConfig;