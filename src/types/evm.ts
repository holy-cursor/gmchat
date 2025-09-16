// EVM-specific types for Parc3l

export interface EVMChain {
  id: number;
  name: string;
  rpcUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  blockExplorerUrl: string;
  iconUrl?: string;
}

export interface EVMTransaction {
  hash: string;
  from: string;
  to: string;
  value: string; // in wei
  gasUsed: string;
  gasPrice: string;
  timestamp: number;
  blockNumber: number;
  status: 'pending' | 'confirmed' | 'failed';
}

export interface EVMMessage {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  timestamp: number;
  transactionHash: string;
  chainId: number;
  isRead?: boolean;
  isEncrypted?: boolean;
  encryptedContent?: string;
  encryptionKey?: string;
}

export interface EVMContact {
  address: string;
  displayName: string;
  customTag?: string;
  lastMessage?: EVMMessage;
  unreadCount: number;
  lastActivity: number;
  isOnline?: boolean;
  chains: number[]; // Array of chain IDs this contact is active on
}

export interface EVMGroup {
  id: string;
  name: string;
  description?: string;
  members: string[];
  createdBy: string;
  groupWallet: string;
  chainId: number; // EVM groups are tied to a specific chain
  createdAt: number;
  lastMessage?: EVMMessage;
  unreadCount: number;
  lastActivity: number;
  isOnline?: boolean;
}

export interface EVMConversation {
  contact?: EVMContact;
  group?: EVMGroup;
  messages: EVMMessage[];
  totalMessages: number;
  chainId: number;
}

export interface EVMWalletInfo {
  address: string;
  connected: boolean;
  chainId: number;
  walletName?: string;
  balance?: string; // in wei
}

export interface EVMSendMessageParams {
  recipient: string;
  content: string;
  chainId: number;
  captchaToken?: string;
}

// Supported EVM chains
export const SUPPORTED_EVM_CHAINS: EVMChain[] = [
  {
    id: 1,
    name: 'Ethereum',
    rpcUrl: 'https://eth.llamarpc.com',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://etherscan.io',
    iconUrl: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    id: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon.llamarpc.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorerUrl: 'https://polygonscan.com',
    iconUrl: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  },
  {
    id: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arbitrum.llamarpc.com',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://arbiscan.io',
    iconUrl: 'https://cryptologos.cc/logos/arbitrum-arb-logo.png',
  },
  {
    id: 10,
    name: 'Optimism',
    rpcUrl: 'https://optimism.llamarpc.com',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    iconUrl: 'https://cryptologos.cc/logos/optimism-op-logo.png',
  },
  {
    id: 8453,
    name: 'Base',
    rpcUrl: 'https://base.llamarpc.com',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://basescan.org',
    iconUrl: 'https://cryptologos.cc/logos/base-logo.png',
  },
  {
    id: 56,
    name: 'BNB Smart Chain',
    rpcUrl: 'https://bsc.llamarpc.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    blockExplorerUrl: 'https://bscscan.com',
    iconUrl: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
  },
];

// Testnet chains for development
export const TESTNET_EVM_CHAINS: EVMChain[] = [
  {
    id: 11155111,
    name: 'Sepolia',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    blockExplorerUrl: 'https://sepolia.etherscan.io',
  },
  {
    id: 80001,
    name: 'Mumbai',
    rpcUrl: 'https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
    },
    blockExplorerUrl: 'https://mumbai.polygonscan.com',
  },
];
