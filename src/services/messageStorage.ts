import { Message, Contact, Conversation, Group } from '../types';
import EncryptionService from './encryptionService';

export interface StoredMessage extends Message {
  // StoredMessage is the same as Message, no additional fields needed
}

export interface StoredGroup extends Group {
  id: string;
}

export class MessageStorageService {
  private static readonly STORAGE_KEY = 'dotmsg_messages';
  private static readonly GROUPS_KEY = 'dotmsg_groups';

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

    console.log('Message stored:', storedMessage);
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
        encryptionKey: encryptedData.encryptionKey
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
  static storeEncryptedGroupMessage(message: Omit<StoredMessage, 'id' | 'timestamp'>, groupId: string): StoredMessage {
    try {
      // Encrypt the message content for group
      const encryptedData = EncryptionService.encryptGroupMessage(
        message.content,
        groupId
      );

      // Create encrypted message
      const encryptedMessage: Omit<StoredMessage, 'id' | 'timestamp'> = {
        ...message,
        content: encryptedData.content,
        encryptedContent: encryptedData.encryptedContent,
        isEncrypted: true,
        encryptionKey: encryptedData.encryptionKey
      };

      return this.storeMessage(encryptedMessage);
    } catch (error) {
      console.error('Failed to encrypt group message:', error);
      // Fallback to storing unencrypted message
      return this.storeMessage(message);
    }
  }


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
   * Get all messages from storage
   */
  private static getAllMessages(): StoredMessage[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading messages from storage:', error);
      return [];
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

    // Get all group wallet addresses to exclude them from contacts
    const allGroups = this.getAllGroups();
    const groupWallets = allGroups.map(group => group.groupWallet);

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

      // Skip group wallet addresses - they shouldn't appear as contacts
      if (groupWallets.includes(contactAddress)) {
        return;
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

    // Decrypt messages if they are encrypted
    const decryptedMessages = conversationMessages.map(message => {
      if (message.isEncrypted && message.encryptedContent) {
        try {
          const decryptedContent = EncryptionService.decryptMessageData(
            message as any,
            walletAddress,
            contactAddress
          );
          return {
            ...message,
            content: decryptedContent
          };
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          return message; // Return original message if decryption fails
        }
      }
      return message;
    });

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
   * Get conversation for a specific group
   */
  static getGroupConversation(walletAddress: string, groupId: string): Conversation | null {
    const group = this.getGroupById(groupId);
    if (!group) return null;

    // Get all messages for this group by filtering messages sent to the group wallet
    const allMessages = this.getAllMessages();
    
    const conversationMessages = allMessages
      .filter(message => {
        // Include messages sent to the group wallet
        return message.recipient === group.groupWallet;
      })
      .sort((a, b) => a.timestamp - b.timestamp);

    return {
      group,
      messages: conversationMessages,
      totalMessages: conversationMessages.length,
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
   * Mark group messages as read for a specific group
   */
  static markGroupConversationAsRead(walletAddress: string, groupId: string): void {
    const group = this.getGroupById(groupId);
    if (!group) return;
    
    const allMessages = this.getAllMessages();
    const updatedMessages = allMessages.map(message => {
      if (message.recipient === group.groupWallet && 
          message.sender !== walletAddress && 
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
    const groups = this.getGroupsForWallet(walletAddress);
    const groupUnreadCount = groups.reduce((total, group) => total + group.unreadCount, 0);
    
    return directUnreadCount + groupUnreadCount;
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

  // ===== GROUP MANAGEMENT METHODS =====

  /**
   * Get all groups from localStorage
   */
  static getAllGroups(): StoredGroup[] {
    try {
      const groups = localStorage.getItem(this.GROUPS_KEY);
      return groups ? JSON.parse(groups) : [];
    } catch (error) {
      console.error('Error loading groups:', error);
      return [];
    }
  }

  /**
   * Store a new group
   */
  static storeGroup(groupData: { name: string; description: string; members: string[]; createdBy: string }): StoredGroup {
    const group: StoredGroup = {
      id: this.generateGroupId(),
      name: groupData.name,
      description: groupData.description,
      members: groupData.members,
      createdBy: groupData.createdBy,
      groupWallet: this.generateGroupWalletAddress(),
      createdAt: Date.now(),
      unreadCount: 0,
      lastActivity: Date.now(),
    };

    const groups = this.getAllGroups();
    groups.push(group);
    localStorage.setItem(this.GROUPS_KEY, JSON.stringify(groups));

    console.log('Group stored:', group);
    return group;
  }

  /**
   * Get groups for a specific wallet address (where user is a member)
   */
  static getGroupsForWallet(walletAddress: string): StoredGroup[] {
    const allGroups = this.getAllGroups();
    const userGroups = allGroups.filter(group => group.members.includes(walletAddress));
    
    // Calculate unread counts and last message for each group
    return userGroups.map(group => {
      const allMessages = this.getAllMessages();
      
      // Get all messages sent to this group's wallet
      const groupMessages = allMessages
        .filter(message => message.recipient === group.groupWallet)
        .sort((a, b) => a.timestamp - b.timestamp);
      
      // Calculate unread count (messages not sent by current user and not read)
      const unreadCount = groupMessages.filter(message => 
        message.sender !== walletAddress && !message.isRead
      ).length;
      
      // Get last message
      const lastMessage = groupMessages.length > 0 ? groupMessages[groupMessages.length - 1] : undefined;
      
      // Calculate last activity
      const lastActivity = groupMessages.length > 0 
        ? Math.max(...groupMessages.map(m => m.timestamp))
        : group.createdAt;
      
      return {
        ...group,
        unreadCount,
        lastMessage,
        lastActivity,
      };
    }).sort((a, b) => b.lastActivity - a.lastActivity); // Most recent first
  }

  /**
   * Get a specific group by ID
   */
  static getGroupById(groupId: string): StoredGroup | null {
    const groups = this.getAllGroups();
    return groups.find(group => group.id === groupId) || null;
  }

  /**
   * Update group data
   */
  static updateGroup(groupId: string, updates: Partial<StoredGroup>): void {
    const groups = this.getAllGroups();
    const groupIndex = groups.findIndex(group => group.id === groupId);
    
    if (groupIndex !== -1) {
      groups[groupIndex] = { ...groups[groupIndex], ...updates };
      localStorage.setItem(this.GROUPS_KEY, JSON.stringify(groups));
    }
  }

  /**
   * Delete a group
   */
  static deleteGroup(groupId: string): void {
    const groups = this.getAllGroups();
    const filteredGroups = groups.filter(group => group.id !== groupId);
    localStorage.setItem(this.GROUPS_KEY, JSON.stringify(filteredGroups));
  }

  /**
   * Generate unique group ID
   */
  private static generateGroupId(): string {
    return `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate a unique wallet address for a group
   */
  private static generateGroupWalletAddress(): string {
    // Generate a mock wallet address for the group (44 characters like real Solana addresses)
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
