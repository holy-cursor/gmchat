export interface Message {
  id: string;
  sender: string;
  recipient: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  timestamp: number;
  transactionSignature: string;
  isRead?: boolean;
  groupId?: string; // For group messages
  isEncrypted?: boolean;
  encryptedContent?: string;
  nonce?: string;
  publicKey?: string;
  // EVM support
  chainType?: 'solana' | 'evm';
  chainId?: number; // For EVM messages
  // IPFS support
  ipfsHash?: string;
}

export interface MessageMetadata {
  name: string;
  description: string;
  image: string;
  attributes: Array<{
    trait_type: string;
    value: string;
  }>;
  properties: {
    sender: string;
    recipient: string;
    content: string;
    timestamp: number;
  };
}

export interface SendMessageParams {
  recipient: string;
  content: string;
  captchaToken?: string;
}

export interface WalletInfo {
  publicKey: string;
  connected: boolean;
  walletName?: string;
}

export interface Contact {
  address: string;
  displayName: string;
  customTag?: string; // User-defined tag/name for the wallet
  lastMessage?: Message;
  unreadCount: number;
  lastActivity: number;
  isOnline?: boolean;
}


export interface Conversation {
  contact?: Contact;
  messages: Message[];
  totalMessages: number;
}
