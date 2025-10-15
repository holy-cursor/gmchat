import CryptoJS from 'crypto-js';

export interface EncryptionKey {
  key: string;
  iv: string;
  timestamp: number;
}

export interface EncryptedMessage {
  content: string;
  encryptedContent: string;
  isEncrypted: boolean;
  encryptionKey: string;
  timestamp: number;
}

class EncryptionService {
  private static readonly STORAGE_KEY = 'gmchat_encryption_keys';
  private static readonly KEY_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Generate a shared encryption key for two wallet addresses
   */
  static generateSharedKey(wallet1: string, wallet2: string): string {
    // Create a deterministic key based on both wallet addresses
    const combined = [wallet1, wallet2].sort().join('');
    return CryptoJS.SHA256(combined).toString();
  }

  /**
   * Generate a random encryption key and IV
   */
  static generateEncryptionKey(): EncryptionKey {
    const key = CryptoJS.lib.WordArray.random(256/8).toString();
    const iv = CryptoJS.lib.WordArray.random(128/8).toString();
    
    return {
      key,
      iv,
      timestamp: Date.now()
    };
  }

  /**
   * Encrypt message content
   */
  static encryptMessage(content: string, key: string, iv: string): string {
    try {
      const encrypted = CryptoJS.AES.encrypt(content, key, {
        iv: CryptoJS.enc.Utf8.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return encrypted.toString();
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt message');
    }
  }

  /**
   * Decrypt message content
   */
  static decryptMessage(encryptedContent: string, key: string, iv: string): string {
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedContent, key, {
        iv: CryptoJS.enc.Utf8.parse(iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Get or create encryption key for a conversation
   */
  static getConversationKey(wallet1: string, wallet2: string): EncryptionKey {
    const keyId = this.getKeyId(wallet1, wallet2);
    const storedKeys = this.getStoredKeys();
    
    // Check if key exists and is not expired
    if (storedKeys[keyId] && this.isKeyValid(storedKeys[keyId])) {
      return storedKeys[keyId];
    }

    // Generate new key
    const newKey = this.generateEncryptionKey();
    storedKeys[keyId] = newKey;
    this.saveStoredKeys(storedKeys);
    
    return newKey;
  }

  /**
   * Get encryption key for a group conversation
   */
  static getGroupKey(groupId: string): EncryptionKey {
    const keyId = `group_${groupId}`;
    const storedKeys = this.getStoredKeys();
    
    if (storedKeys[keyId] && this.isKeyValid(storedKeys[keyId])) {
      return storedKeys[keyId];
    }

    const newKey = this.generateEncryptionKey();
    storedKeys[keyId] = newKey;
    this.saveStoredKeys(storedKeys);
    
    return newKey;
  }

  /**
   * Encrypt a message for a conversation
   */
  static encryptConversationMessage(content: string, wallet1: string, wallet2: string): EncryptedMessage {
    const keyData = this.getConversationKey(wallet1, wallet2);
    const encryptedContent = this.encryptMessage(content, keyData.key, keyData.iv);
    
    return {
      content: encryptedContent,
      encryptedContent,
      isEncrypted: true,
      encryptionKey: keyData.key,
      timestamp: Date.now()
    };
  }

  /**
   * Encrypt a message for a group
   */
  static encryptGroupMessage(content: string, groupId: string): EncryptedMessage {
    const keyData = this.getGroupKey(groupId);
    const encryptedContent = this.encryptMessage(content, keyData.key, keyData.iv);
    
    return {
      content: encryptedContent,
      encryptedContent,
      isEncrypted: true,
      encryptionKey: keyData.key,
      timestamp: Date.now()
    };
  }

  /**
   * Decrypt a message
   */
  static decryptMessageData(encryptedMessage: EncryptedMessage, wallet1: string, wallet2: string): string {
    if (!encryptedMessage.isEncrypted) {
      return encryptedMessage.content;
    }

    const keyData = this.getConversationKey(wallet1, wallet2);
    return this.decryptMessage(encryptedMessage.encryptedContent, keyData.key, keyData.iv);
  }

  /**
   * Decrypt a group message
   */
  static decryptGroupMessage(encryptedMessage: EncryptedMessage, groupId: string): string {
    if (!encryptedMessage.isEncrypted) {
      return encryptedMessage.content;
    }

    const keyData = this.getGroupKey(groupId);
    return this.decryptMessage(encryptedMessage.encryptedContent, keyData.key, keyData.iv);
  }

  /**
   * Check if a message is encrypted
   */
  static isMessageEncrypted(message: unknown): boolean {
    return (message as any).isEncrypted === true && (message as any).encryptedContent;
  }

  /**
   * Generate a key ID for a conversation
   */
  private static getKeyId(wallet1: string, wallet2: string): string {
    return [wallet1, wallet2].sort().join('_');
  }

  /**
   * Check if encryption key is still valid
   */
  private static isKeyValid(key: EncryptionKey): boolean {
    return Date.now() - key.timestamp < this.KEY_EXPIRY;
  }

  /**
   * Get stored encryption keys
   */
  private static getStoredKeys(): Record<string, EncryptionKey> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to load encryption keys:', error);
      return {};
    }
  }

  /**
   * Save encryption keys to storage
   */
  private static saveStoredKeys(keys: Record<string, EncryptionKey>): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(keys));
    } catch (error) {
      console.error('Failed to save encryption keys:', error);
    }
  }

  /**
   * Clear all encryption keys (for privacy)
   */
  static clearAllKeys(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Clear keys for a specific conversation
   */
  static clearConversationKeys(wallet1: string, wallet2: string): void {
    const keyId = this.getKeyId(wallet1, wallet2);
    const storedKeys = this.getStoredKeys();
    delete storedKeys[keyId];
    this.saveStoredKeys(storedKeys);
  }

  /**
   * Clear keys for a specific group
   */
  static clearGroupKeys(groupId: string): void {
    const keyId = `group_${groupId}`;
    const storedKeys = this.getStoredKeys();
    delete storedKeys[keyId];
    this.saveStoredKeys(storedKeys);
  }

  /**
   * Get encryption status for a conversation
   */
  static getEncryptionStatus(wallet1: string, wallet2: string): boolean {
    const keyId = this.getKeyId(wallet1, wallet2);
    const storedKeys = this.getStoredKeys();
    return !!(storedKeys[keyId] && this.isKeyValid(storedKeys[keyId]));
  }

  /**
   * Get encryption status for a group
   */
  static getGroupEncryptionStatus(groupId: string): boolean {
    const keyId = `group_${groupId}`;
    const storedKeys = this.getStoredKeys();
    return !!(storedKeys[keyId] && this.isKeyValid(storedKeys[keyId]));
  }
}

export default EncryptionService;
