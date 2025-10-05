import { Message, Contact, Conversation } from '../types';
import EncryptionService from './encryptionService';

export interface StoredMessage extends Message {
  // StoredMessage is the same as Message, no additional fields needed
}


export class MessageStorageService {
  private static readonly STORAGE_KEY = 'dotmsg_messages';

  /**
   * Store a new message
   */
  static storeMessage(message: Omit<StoredMessage, 'id' | 'timestamp'>): StoredMessage {
    const storedMessage: StoredMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: Date.now(),
    };

    const messages = this.getAllMessages();
    messages.push(storedMessage);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));

    return storedMessage;
  }

  /**
   * Store an encrypted message for a conversation
   */
  static storeEncryptedMessage(message: Omit<StoredMessage, 'id' | 'timestamp'>, senderWallet: string, recipientWallet: string): StoredMessage {
    try {
      // Encrypt the message content
      const encryptedData = EncryptionService.encryptConversationMessage(
        message.content,
        senderWallet,
        recipientWallet
      );

      // Create encrypted message
      const encryptedMessage: Omit<StoredMessage, 'id' | 'timestamp'> = {
        ...message,
        content: encryptedData.content,
        encryptedContent: encryptedData.encryptedContent,
        isEncrypted: true,
      };

      return this.storeMessage(encryptedMessage);
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      // Fallback to storing unencrypted message
      return this.storeMessage(message);
    }
  }

  /**
   * Store an encrypted message for a group
   */


  /**
   * Get all messages for a specific wallet address
   */
  static getMessagesForWallet(walletAddress: string): StoredMessage[] {
    const allMessages = this.getAllMessages();
    return allMessages.filter(
      message => 
        message.sender === walletAddress || 
        message.recipient === walletAddress
    );
  }

  /**
   * Get received messages for a wallet
   */
  static getReceivedMessages(walletAddress: string): StoredMessage[] {
    const allMessages = this.getAllMessages();
    return allMessages
      .filter(message => message.recipient === walletAddress)
      .sort((a, b) => b.timestamp - a.timestamp); // Newest first
  }

  /**
   * Get sent messages for a wallet
   */
  static getSentMessages(walletAddress: string): StoredMessage[] {
    const allMessages = this.getAllMessages();
    return allMessages
      .filter(message => message.sender === walletAddress)
      .sort((a, b) => b.timestamp - a.timestamp); // Newest first
  }

  /**
   * Get all messages from storage (public access)
   */
  static getAllMessages(): StoredMessage[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading messages from storage:', error);
      return [];
    }
  }

  /**
   * Set all messages in storage
   */
  static setMessages(messages: StoredMessage[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(messages));
    } catch (error) {
      console.error('Error setting messages in storage:', error);
    }
  }

  /**
   * Generate a unique message ID
   */
  private static generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all messages (for testing)
   */
  static clearAllMessages(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('All messages cleared');
  }

  /**
   * Get message by ID
   */
  static getMessageById(id: string): StoredMessage | null {
    const messages = this.getAllMessages();
    return messages.find(message => message.id === id) || null;
  }

  /**
   * Delete a message
   */
  static deleteMessage(id: string): boolean {
    const messages = this.getAllMessages();
    const filteredMessages = messages.filter(message => message.id !== id);
    
    if (filteredMessages.length === messages.length) {
      return false; // Message not found
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredMessages));
    return true;
  }

  /**
   * Get message statistics
   */
  static getMessageStats(walletAddress: string): {
    totalReceived: number;
    totalSent: number;
    totalMessages: number;
  } {
    const received = this.getReceivedMessages(walletAddress).length;
    const sent = this.getSentMessages(walletAddress).length;
    
    return {
      totalReceived: received,
      totalSent: sent,
      totalMessages: received + sent,
    };
  }

  /**
   * Get all contacts for a wallet (people they've messaged with)
   */
  static getContacts(walletAddress: string, chainType?: 'solana' | 'evm'): Contact[] {
    const allMessages = this.getAllMessages();
    const contactMap = new Map<string, Contact>();


    allMessages.forEach(message => {
      // Filter by chain type if specified
      if (chainType && message.chainType && message.chainType !== chainType) {
        return;
      }

      let contactAddress: string;
      let isReceived = false;

      if (message.sender === walletAddress) {
        contactAddress = message.recipient;
      } else if (message.recipient === walletAddress) {
        contactAddress = message.sender;
        isReceived = true;
      } else {
        return; // Skip messages not involving this wallet
      }


      if (!contactMap.has(contactAddress)) {
        contactMap.set(contactAddress, {
          address: contactAddress,
          displayName: this.getContactDisplayName(walletAddress, contactAddress),
          customTag: this.getContactTag(walletAddress, contactAddress) || undefined,
          unreadCount: 0,
          lastActivity: 0,
        });
      }

      const contact = contactMap.get(contactAddress)!;
      
      // Update last activity and last message
      if (message.timestamp > contact.lastActivity) {
        contact.lastActivity = message.timestamp;
        contact.lastMessage = message;
      }

      // Count unread messages (only received messages that are unread)
      if (isReceived && !message.isRead) {
        contact.unreadCount++;
      }
    });

    // After processing all messages, ensure each contact has the correct last message
    // by getting the most recent message in each conversation
    contactMap.forEach((contact, contactAddress) => {
      const conversationMessages = allMessages.filter(message => 
        (message.sender === walletAddress && message.recipient === contactAddress) ||
        (message.sender === contactAddress && message.recipient === walletAddress)
      ).sort((a, b) => b.timestamp - a.timestamp); // Most recent first

      if (conversationMessages.length > 0) {
        const lastMessage = conversationMessages[0];
        
        // Decrypt the message content if it's encrypted
        if (lastMessage.isEncrypted && lastMessage.encryptedContent) {
          try {
            const decryptedContent = EncryptionService.decryptMessageData(
              lastMessage as any,
              walletAddress,
              contactAddress
            );
            // Create a copy of the message with decrypted content
            contact.lastMessage = {
              ...lastMessage,
              content: decryptedContent
            };
          } catch (error) {
            console.error('Failed to decrypt last message for contact:', error);
            contact.lastMessage = lastMessage; // Use original message if decryption fails
          }
        } else {
          contact.lastMessage = lastMessage;
        }
        
        contact.lastActivity = lastMessage.timestamp;
      }
    });

    return Array.from(contactMap.values())
      .sort((a, b) => b.lastActivity - a.lastActivity); // Most recent first
  }

  /**
   * Get conversation with a specific contact
   */
  static getConversation(walletAddress: string, contactAddress: string): Conversation | null {
    const allMessages = this.getAllMessages();
    const conversationMessages = allMessages.filter(message => 
      (message.sender === walletAddress && message.recipient === contactAddress) ||
      (message.sender === contactAddress && message.recipient === walletAddress)
    ).sort((a, b) => a.timestamp - b.timestamp); // Chronological order

    if (conversationMessages.length === 0) {
      return null;
    }

    // For now, just return the messages as-is since we store both plain text and encrypted content
    // The content field already contains the plain text for display
    const decryptedMessages = conversationMessages;

    const contact: Contact = {
      address: contactAddress,
      displayName: this.formatAddress(contactAddress),
      lastMessage: decryptedMessages[decryptedMessages.length - 1],
      unreadCount: decryptedMessages.filter(m => 
        m.recipient === walletAddress && !m.isRead
      ).length,
      lastActivity: Math.max(...decryptedMessages.map(m => m.timestamp)),
    };

    return {
      contact,
      messages: decryptedMessages,
      totalMessages: decryptedMessages.length,
    };
  }


  /**
   * Mark messages as read for a specific contact
   */
  static markConversationAsRead(walletAddress: string, contactAddress: string): void {
    const allMessages = this.getAllMessages();
    const updatedMessages = allMessages.map(message => {
      if (message.recipient === walletAddress && 
          message.sender === contactAddress && 
          !message.isRead) {
        return { ...message, isRead: true };
      }
      return message;
    });

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedMessages));
  }


  /**
   * Get unread count for a specific contact
   */
  static getUnreadCount(walletAddress: string, contactAddress: string): number {
    const allMessages = this.getAllMessages();
    return allMessages.filter(message => 
      message.recipient === walletAddress && 
      message.sender === contactAddress && 
      !message.isRead
    ).length;
  }

  /**
   * Get total unread count for wallet (including group messages)
   */
  static getTotalUnreadCount(walletAddress: string): number {
    const allMessages = this.getAllMessages();
    
    // Count direct messages to the wallet
    const directUnreadCount = allMessages.filter(message => 
      message.recipient === walletAddress && !message.isRead
    ).length;
    
    // Count group messages where user is a member
    return directUnreadCount;
  }

  /**
   * Format address for display
   */
  private static formatAddress(address: string): string {
    if (address.length <= 12) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  /**
   * Set custom tag for a contact
   */
  static setContactTag(walletAddress: string, contactAddress: string, customTag: string): void {
    const tagKey = `contact_tag_${walletAddress}_${contactAddress}`;
    localStorage.setItem(tagKey, customTag);
  }

  /**
   * Get custom tag for a contact
   */
  static getContactTag(walletAddress: string, contactAddress: string): string | null {
    const tagKey = `contact_tag_${walletAddress}_${contactAddress}`;
    return localStorage.getItem(tagKey);
  }

  /**
   * Remove custom tag for a contact
   */
  static removeContactTag(walletAddress: string, contactAddress: string): void {
    const tagKey = `contact_tag_${walletAddress}_${contactAddress}`;
    localStorage.removeItem(tagKey);
  }

  /**
   * Get display name for a contact (custom tag or formatted address)
   */
  static getContactDisplayName(walletAddress: string, contactAddress: string): string {
    const customTag = this.getContactTag(walletAddress, contactAddress);
    return customTag || this.formatAddress(contactAddress);
  }


}
