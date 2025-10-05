export const SOLANA_NETWORKS = {
  DEVNET: 'devnet',
  MAINNET: 'mainnet-beta',
  TESTNET: 'testnet',
} as const;

export const MESSAGE_LIMITS = {
  MAX_CONTENT_LENGTH: 500,
  MIN_CONTENT_LENGTH: 1,
} as const;

export const EXPLORER_URLS = {
  DEVNET: 'https://sepolia.basescan.org',
  MAINNET: 'https://basescan.org',
  TESTNET: 'https://sepolia.basescan.org',
} as const;

export const BUNDLR_CONFIG = {
  DEVNET_ADDRESS: 'https://devnet.bundlr.network',
  MAINNET_ADDRESS: 'https://node1.bundlr.network',
} as const;

export const APP_CONFIG = {
  NAME: 'OnChain Messages',
  VERSION: '1.0.0',
  DESCRIPTION: 'Send and receive messages as NFTs on Solana',
} as const;
