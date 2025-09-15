import { PublicKey } from '@solana/web3.js';

/**
 * Format a Solana address for display
 */
export const formatAddress = (address: string, length: number = 6): string => {
  if (address.length <= length * 2) return address;
  return `${address.slice(0, length)}...${address.slice(-length)}`;
};

/**
 * Validate if a string is a valid Solana address
 */
export const isValidSolanaAddress = (address: string): boolean => {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
};

/**
 * Copy text to clipboard
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Format timestamp to relative time
 */
export const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

/**
 * Generate a random color for wallet avatars
 */
export const generateWalletColor = (address: string): string => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  // Use address to deterministically select a color
  const hash = address.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
};

/**
 * Get initials from an address
 */
export const getAddressInitials = (address: string): string => {
  return address.slice(0, 2).toUpperCase();
};

/**
 * Validate message content
 */
export const validateMessageContent = (content: string): { isValid: boolean; error?: string } => {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Message cannot be empty' };
  }
  
  if (content.length > 500) {
    return { isValid: false, error: 'Message is too long (max 500 characters)' };
  }
  
  return { isValid: true };
};

/**
 * Get explorer URL for a transaction
 */
export const getExplorerUrl = (signature: string, network: string = 'devnet'): string => {
  const baseUrl = 'https://explorer.solana.com';
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `${baseUrl}/tx/${signature}${cluster}`;
};

/**
 * Get explorer URL for an NFT
 */
export const getNFTExplorerUrl = (mint: string, network: string = 'devnet'): string => {
  const baseUrl = 'https://explorer.solana.com';
  const cluster = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `${baseUrl}/address/${mint}${cluster}`;
};
