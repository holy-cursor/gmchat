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
  encryptionKey?: string;
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

export interface Group {
  id: string;
  name: string;
  description?: string;
  members: string[]; // Array of wallet addresses
  createdBy: string; // Creator's wallet address
  groupWallet: string; // Unique wallet address for this group
  createdAt: number;
  lastMessage?: Message;
  unreadCount: number;
  lastActivity: number;
  isOnline?: boolean;
}

export interface Conversation {
  contact?: Contact;
  group?: Group;
  messages: Message[];
  totalMessages: number;
}
