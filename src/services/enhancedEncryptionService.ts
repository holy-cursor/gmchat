// Using built-in crypto for simplicity

export interface EncryptedMessage {
  encryptedContent: string;
  nonce: string;
  publicKey: string;
  isEncrypted: boolean;
}

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export class EnhancedEncryptionService {
  /**
   * Generate a new key pair for encryption (simplified)
   */
  static generateKeyPair(): KeyPair {
    const privateKey = new Uint8Array(32);
    const publicKey = new Uint8Array(32);
    
    // Use crypto.getRandomValues for secure random generation
    crypto.getRandomValues(privateKey);
    crypto.getRandomValues(publicKey);
    
    return {
      publicKey,
      privateKey
    };
  }

  /**
   * Derive shared secret from two key pairs (simplified)
   */
  static async deriveSharedSecret(privateKey: Uint8Array, publicKey: Uint8Array): Promise<Uint8Array> {
    // Use a more robust key derivation
    const combined = new Uint8Array(privateKey.length + publicKey.length);
    combined.set(privateKey);
    combined.set(publicKey, privateKey.length);
    
    // Use SHA-256 for key derivation
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    return new Uint8Array(hashBuffer);
  }

  /**
   * Encrypt message with simple XOR cipher (for demo purposes)
   */
  static async encryptMessage(
    message: string, 
    senderPrivateKey: Uint8Array, 
    recipientPublicKey: Uint8Array
  ): Promise<EncryptedMessage> {
    try {
      // Derive shared secret
      const sharedSecret = await this.deriveSharedSecret(senderPrivateKey, recipientPublicKey);
      
      // Generate nonce
      const nonce = new Uint8Array(16);
      crypto.getRandomValues(nonce);
      
      // Simple XOR encryption with better key mixing
      const messageBytes = new TextEncoder().encode(message);
      const encryptedContent = new Uint8Array(messageBytes.length);
      
      for (let i = 0; i < messageBytes.length; i++) {
        const keyByte = sharedSecret[i % sharedSecret.length];
        const nonceByte = nonce[i % nonce.length];
        const mixedKey = (keyByte + nonceByte + i) % 256;
        encryptedContent[i] = messageBytes[i] ^ mixedKey;
      }
      
      // Convert to hex strings for storage
      const encryptedHex = Array.from(encryptedContent)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const nonceHex = Array.from(nonce)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      const senderPublicKeyHex = Array.from(senderPrivateKey)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      return {
        encryptedContent: encryptedHex,
        nonce: nonceHex,
        publicKey: senderPublicKeyHex,
        isEncrypted: true
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt message with simple XOR cipher (for demo purposes)
   */
  static async decryptMessage(
    encryptedMessage: EncryptedMessage,
    recipientPrivateKey: Uint8Array,
    senderPublicKey: Uint8Array
  ): Promise<string> {
    try {
      // Convert hex strings back to bytes
      const encryptedBytes = new Uint8Array(
        encryptedMessage.encryptedContent.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
      );
      
      const nonce = new Uint8Array(
        encryptedMessage.nonce.match(/.{2}/g)!.map(byte => parseInt(byte, 16))
      );

      // Derive shared secret
      const sharedSecret = await this.deriveSharedSecret(recipientPrivateKey, senderPublicKey);
      
      // Simple XOR decryption with matching key mixing
      const decryptedBytes = new Uint8Array(encryptedBytes.length);
      
      for (let i = 0; i < encryptedBytes.length; i++) {
        const keyByte = sharedSecret[i % sharedSecret.length];
        const nonceByte = nonce[i % nonce.length];
        const mixedKey = (keyByte + nonceByte + i) % 256;
        decryptedBytes[i] = encryptedBytes[i] ^ mixedKey;
      }
      
      const decryptedMessage = new TextDecoder().decode(decryptedBytes);
      
      return decryptedMessage;
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a key ID for a conversation
   */
  static async getKeyId(wallet1: string, wallet2: string): Promise<string> {
    const sortedWallets = [wallet1, wallet2].sort();
    const data = new TextEncoder().encode(sortedWallets.join('-'));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if a message is encrypted
   */
  static isMessageEncrypted(message: any): boolean {
    return message?.isEncrypted === true && 
           message?.encryptedContent && 
           message?.nonce && 
           message?.publicKey;
  }

  /**
   * Generate a password-based key for backup encryption (simplified)
   */
  static async generatePasswordKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
    const passwordBytes = new TextEncoder().encode(password);
    const combined = new Uint8Array(passwordBytes.length + salt.length);
    combined.set(passwordBytes);
    combined.set(salt, passwordBytes.length);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', combined);
    return new Uint8Array(hashBuffer);
  }

  /**
   * Encrypt private key with password (simplified)
   */
  static async encryptPrivateKey(privateKey: Uint8Array, password: string): Promise<{
    encryptedKey: string;
    salt: string;
    nonce: string;
  }> {
    const salt = new Uint8Array(16);
    const nonce = new Uint8Array(16);
    crypto.getRandomValues(salt);
    crypto.getRandomValues(nonce);
    const key = await this.generatePasswordKey(password, salt);
    
    // Simple XOR encryption
    const encryptedKey = new Uint8Array(privateKey.length);
    for (let i = 0; i < privateKey.length; i++) {
      encryptedKey[i] = privateKey[i] ^ key[i % key.length] ^ nonce[i % nonce.length];
    }
    
    return {
      encryptedKey: Array.from(encryptedKey).map(b => b.toString(16).padStart(2, '0')).join(''),
      salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
      nonce: Array.from(nonce).map(b => b.toString(16).padStart(2, '0')).join('')
    };
  }

  /**
   * Decrypt private key with password (simplified)
   */
  static async decryptPrivateKey(
    encryptedKey: string, 
    salt: string, 
    nonce: string, 
    password: string
  ): Promise<Uint8Array> {
    const saltBytes = new Uint8Array(salt.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const nonceBytes = new Uint8Array(nonce.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    const encryptedBytes = new Uint8Array(encryptedKey.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
    
    const key = await this.generatePasswordKey(password, saltBytes);
    
    // Simple XOR decryption
    const decryptedKey = new Uint8Array(encryptedBytes.length);
    for (let i = 0; i < encryptedBytes.length; i++) {
      decryptedKey[i] = encryptedBytes[i] ^ key[i % key.length] ^ nonceBytes[i % nonceBytes.length];
    }
    
    return decryptedKey;
  }
}

export default EnhancedEncryptionService;
