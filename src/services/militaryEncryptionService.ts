export interface EncryptionConfig {
  algorithm: 'AES-256-GCM' | 'ChaCha20-Poly1305' | 'AES-256-CBC';
  keySize: 256 | 512;
  ivSize: 96 | 128; // bits
  tagSize: 128; // bits
  iterations: number; // for key derivation
  saltSize: 128 | 256; // bits
}

export interface EncryptedData {
  encryptedContent: string;
  iv: string;
  tag?: string; // for authenticated encryption
  salt: string;
  algorithm: string;
  keyDerivation: string;
  timestamp: number;
  nonce?: string; // for ChaCha20
}

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
  keyId: string;
  createdAt: number;
  expiresAt?: number;
}

class MilitaryEncryptionService {
  private static readonly STORAGE_KEY = 'parc3l_military_keys';
  
  // Encryption configurations
  private static readonly CONFIGS: Record<string, EncryptionConfig> = {
    standard: {
      algorithm: 'AES-256-CBC',
      keySize: 256,
      ivSize: 128,
      tagSize: 128,
      iterations: 100000,
      saltSize: 128
    },
    military: {
      algorithm: 'AES-256-GCM',
      keySize: 256,
      ivSize: 96,
      tagSize: 128,
      iterations: 1000000,
      saltSize: 128
    },
    quantum: {
      algorithm: 'ChaCha20-Poly1305',
      keySize: 256,
      ivSize: 96,
      tagSize: 128,
      iterations: 2000000,
      saltSize: 256
    }
  };

  /**
   * Generate a new key pair
   */
  static async generateKeyPair(level: 'standard' | 'military' | 'quantum' = 'military'): Promise<KeyPair> {
    try {
      const config = this.CONFIGS[level];
      const keySize = config.keySize / 8; // Convert bits to bytes
      
      // Generate private key
      const privateKey = new Uint8Array(keySize);
      crypto.getRandomValues(privateKey);
      
      // Generate public key (simplified - in real implementation, use proper key exchange)
      const publicKey = new Uint8Array(keySize);
      crypto.getRandomValues(publicKey);
      
      const keyId = await this.generateKeyId();
      
      return {
        publicKey,
        privateKey,
        keyId,
        createdAt: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      };
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      throw new Error('Key generation failed');
    }
  }

  /**
   * Derive encryption key from password and salt
   */
  static async deriveKey(
    password: string, 
    salt: Uint8Array, 
    level: 'standard' | 'military' | 'quantum' = 'military'
  ): Promise<Uint8Array> {
    try {
      const config = this.CONFIGS[level];
      const passwordBuffer = new TextEncoder().encode(password);
      
      // Use PBKDF2 for key derivation
      const key = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
      );
      
      const derivedBits = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: config.iterations,
          hash: 'SHA-256'
        },
        key,
        config.keySize
      );
      
      return new Uint8Array(derivedBits);
    } catch (error) {
      console.error('Failed to derive key:', error);
      throw new Error('Key derivation failed');
    }
  }

  /**
   * Encrypt data with military-grade encryption
   */
  static async encrypt(
    data: string, 
    key: Uint8Array, 
    level: 'standard' | 'military' | 'quantum' = 'military'
  ): Promise<EncryptedData> {
    try {
      const config = this.CONFIGS[level];
      const dataBuffer = new TextEncoder().encode(data);
      
      // Generate salt
      const salt = new Uint8Array(config.saltSize / 8);
      crypto.getRandomValues(salt);
      
      // Generate IV/Nonce
      const iv = new Uint8Array(config.ivSize / 8);
      crypto.getRandomValues(iv);
      
      let encryptedContent: Uint8Array;
      let tag: Uint8Array | undefined;
      
      if (config.algorithm === 'AES-256-GCM') {
        // AES-256-GCM encryption
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          key,
          'AES-GCM',
          false,
          ['encrypt']
        );
        
        const encrypted = await crypto.subtle.encrypt(
          {
            name: 'AES-GCM',
            iv: iv,
            tagLength: config.tagSize
          },
          cryptoKey,
          dataBuffer
        );
        
        const encryptedArray = new Uint8Array(encrypted);
        const tagLength = config.tagSize / 8;
        tag = encryptedArray.slice(-tagLength);
        encryptedContent = encryptedArray.slice(0, -tagLength);
        
      } else if (config.algorithm === 'ChaCha20-Poly1305') {
        // ChaCha20-Poly1305 encryption (simplified implementation)
        const nonce = new Uint8Array(12);
        crypto.getRandomValues(nonce);
        
        // For demo purposes, using a simplified ChaCha20 implementation
        encryptedContent = await this.chacha20Encrypt(dataBuffer, key, nonce);
        tag = await this.poly1305Mac(encryptedContent, key, nonce);
        
      } else {
        // AES-256-CBC encryption
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          key,
          'AES-CBC',
          false,
          ['encrypt']
        );
        
        const encrypted = await crypto.subtle.encrypt(
          {
            name: 'AES-CBC',
            iv: iv
          },
          cryptoKey,
          dataBuffer
        );
        
        encryptedContent = new Uint8Array(encrypted);
      }
      
      return {
        encryptedContent: this.arrayToHex(encryptedContent),
        iv: this.arrayToHex(iv),
        tag: tag ? this.arrayToHex(tag) : undefined,
        salt: this.arrayToHex(salt),
        algorithm: config.algorithm,
        keyDerivation: 'PBKDF2',
        timestamp: Date.now(),
        nonce: config.algorithm === 'ChaCha20-Poly1305' ? this.arrayToHex(iv) : undefined
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt data with military-grade decryption
   */
  static async decrypt(
    encryptedData: EncryptedData, 
    key: Uint8Array
  ): Promise<string> {
    try {
      const config = this.CONFIGS[encryptedData.algorithm as keyof typeof this.CONFIGS] || this.CONFIGS.military;
      
      const encryptedContent = this.hexToArray(encryptedData.encryptedContent);
      const iv = this.hexToArray(encryptedData.iv);
      const tag = encryptedData.tag ? this.hexToArray(encryptedData.tag) : undefined;
      
      let decryptedBuffer: Uint8Array;
      
      if (encryptedData.algorithm === 'AES-256-GCM') {
        // AES-256-GCM decryption
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          key,
          'AES-GCM',
          false,
          ['decrypt']
        );
        
        // Combine encrypted content and tag
        const combined = new Uint8Array(encryptedContent.length + (tag?.length || 0));
        combined.set(encryptedContent);
        if (tag) {
          combined.set(tag, encryptedContent.length);
        }
        
        const decrypted = await crypto.subtle.decrypt(
          {
            name: 'AES-GCM',
            iv: iv,
            tagLength: config.tagSize
          },
          cryptoKey,
          combined
        );
        
        decryptedBuffer = new Uint8Array(decrypted);
        
      } else if (encryptedData.algorithm === 'ChaCha20-Poly1305') {
        // ChaCha20-Poly1305 decryption (simplified implementation)
        const nonce = encryptedData.nonce ? this.hexToArray(encryptedData.nonce) : iv;
        
        // Verify tag
        if (tag) {
          const expectedTag = await this.poly1305Mac(encryptedContent, key, nonce);
          if (!this.constantTimeCompare(tag, expectedTag)) {
            throw new Error('Authentication failed');
          }
        }
        
        decryptedBuffer = await this.chacha20Decrypt(encryptedContent, key, nonce);
        
      } else {
        // AES-256-CBC decryption
        const cryptoKey = await crypto.subtle.importKey(
          'raw',
          key,
          'AES-CBC',
          false,
          ['decrypt']
        );
        
        const decrypted = await crypto.subtle.decrypt(
          {
            name: 'AES-CBC',
            iv: iv
          },
          cryptoKey,
          encryptedContent
        );
        
        decryptedBuffer = new Uint8Array(decrypted);
      }
      
      return new TextDecoder().decode(decryptedBuffer);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Generate a unique key ID
   */
  private static async generateKeyId(): Promise<string> {
    const randomBytes = new Uint8Array(16);
    crypto.getRandomValues(randomBytes);
    const hashBuffer = await crypto.subtle.digest('SHA-256', randomBytes);
    const hashArray = new Uint8Array(hashBuffer);
    return Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Convert Uint8Array to hex string
   */
  private static arrayToHex(array: Uint8Array): string {
    return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Convert hex string to Uint8Array
   */
  private static hexToArray(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Simplified ChaCha20 encryption (for demo purposes)
   */
  private static async chacha20Encrypt(data: Uint8Array, key: Uint8Array, nonce: Uint8Array): Promise<Uint8Array> {
    // This is a simplified implementation for demo purposes
    // In production, use a proper ChaCha20 implementation
    const encrypted = new Uint8Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const keyByte = key[i % key.length];
      const nonceByte = nonce[i % nonce.length];
      encrypted[i] = data[i] ^ keyByte ^ nonceByte;
    }
    return encrypted;
  }

  /**
   * Simplified ChaCha20 decryption (for demo purposes)
   */
  private static async chacha20Decrypt(data: Uint8Array, key: Uint8Array, nonce: Uint8Array): Promise<Uint8Array> {
    // ChaCha20 is symmetric, so decryption is the same as encryption
    return this.chacha20Encrypt(data, key, nonce);
  }

  /**
   * Simplified Poly1305 MAC (for demo purposes)
   */
  private static async poly1305Mac(data: Uint8Array, key: Uint8Array, nonce: Uint8Array): Promise<Uint8Array> {
    // This is a simplified implementation for demo purposes
    // In production, use a proper Poly1305 implementation
    const mac = new Uint8Array(16);
    for (let i = 0; i < 16; i++) {
      mac[i] = (data[i % data.length] + key[i % key.length] + nonce[i % nonce.length]) % 256;
    }
    return mac;
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  private static constantTimeCompare(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    return result === 0;
  }

  /**
   * Get encryption configuration
   */
  static getEncryptionConfig(level: 'standard' | 'military' | 'quantum'): EncryptionConfig {
    return this.CONFIGS[level];
  }

  /**
   * Get all available encryption levels
   */
  static getAvailableLevels(): string[] {
    return Object.keys(this.CONFIGS);
  }
}

export default MilitaryEncryptionService;
