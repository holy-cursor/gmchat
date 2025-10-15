/**
 * P2P Encryption Service
 * Handles end-to-end encryption for decentralized messaging
 * Mobile and web compatible
 */

import { P2PMessage } from '../types/p2pMessage';

export interface KeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
}

export interface EncryptionResult {
  encryptedContent: string;
  nonce: string;
  publicKey: string;
  keyId: string;
}

export class P2PEncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM

  /**
   * Generate a new key pair for a conversation
   */
  static async generateKeyPair(): Promise<KeyPair> {
    try {
      // Generate a symmetric AES key for encryption
      const aesKey = await crypto.subtle.generateKey(
        {
          name: this.ALGORITHM,
          length: this.KEY_LENGTH,
        },
        true,
        ['encrypt', 'decrypt']
      );

      // Export the key as raw bytes
      const keyBuffer = await crypto.subtle.exportKey('raw', aesKey);
      const keyString = this.arrayBufferToBase64(keyBuffer);
      const keyId = this.generateKeyId();

      return {
        publicKey: keyString, // For symmetric encryption, publicKey is the symmetric key
        privateKey: keyString, // Same key for both
        keyId,
      };
    } catch (error) {
      console.error('Failed to generate key pair:', error);
      throw new Error('Key pair generation failed');
    }
  }

  /**
   * Derive a shared secret from key pairs
   */
  static async deriveSharedSecret(
    privateKey: string,
    publicKey: string
  ): Promise<CryptoKey> {
    try {
      const privateKeyBuffer = this.base64ToArrayBuffer(privateKey);
      const publicKeyBuffer = this.base64ToArrayBuffer(publicKey);

      const privateKeyObj = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        {
          name: 'ECDH',
          namedCurve: 'P-256',
        },
        false,
        ['deriveKey']
      );

      const publicKeyObj = await crypto.subtle.importKey(
        'raw',
        publicKeyBuffer,
        {
          name: 'ECDH',
          namedCurve: 'P-256',
        },
        false,
        ['deriveKey']
      );

      const sharedSecret = await crypto.subtle.deriveKey(
        {
          name: 'ECDH',
          public: publicKeyObj,
        },
        privateKeyObj,
        {
          name: 'AES-GCM',
          length: 256,
        },
        false,
        ['encrypt', 'decrypt']
      );

      return sharedSecret;
    } catch (error) {
      console.error('Failed to derive shared secret:', error);
      throw new Error('Shared secret derivation failed');
    }
  }

  /**
   * Encrypt a message
   */
  static async encryptMessage(
    plaintext: string,
    key: string, // Base64 encoded symmetric key
  ): Promise<EncryptionResult> {
    try {
      const importedKey = await this.importKey(key);
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH)); // Initialization Vector

      const encryptedContentBuffer = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        importedKey,
        new TextEncoder().encode(plaintext)
      );

      return {
        encryptedContent: this.arrayBufferToBase64(encryptedContentBuffer),
        nonce: this.arrayBufferToBase64(iv),
        publicKey: key, // For symmetric encryption, the 'publicKey' is the symmetric key itself
        keyId: '', // Not applicable for symmetric key per message
      };
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      throw new Error('Message encryption failed');
    }
  }

  /**
   * Decrypt a message
   */
  static async decryptMessage(
    encryptedContent: string,
    key: string, // Base64 encoded symmetric key
    nonce: string, // Base64 encoded IV
  ): Promise<string> {
    try {
      const importedKey = await this.importKey(key);
      const decodedIv = this.base64ToArrayBuffer(nonce);
      const decodedEncryptedContent = this.base64ToArrayBuffer(encryptedContent);

      const decryptedContentBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: decodedIv,
        },
        importedKey,
        decodedEncryptedContent
      );

      return new TextDecoder().decode(decryptedContentBuffer);
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      throw new Error('Message decryption failed');
    }
  }

  /**
   * Import a symmetric key from Base64 string
   */
  private static async importKey(base64Key: string): Promise<CryptoKey> {
    const decodedKey = this.base64ToArrayBuffer(base64Key);
    
    // Validate key length (must be 128 or 256 bits)
    if (decodedKey.byteLength !== 16 && decodedKey.byteLength !== 32) {
      throw new Error(`Invalid key length: ${decodedKey.byteLength * 8} bits. Must be 128 or 256 bits.`);
    }
    
    return crypto.subtle.importKey(
      'raw',
      decodedKey,
      { name: this.ALGORITHM },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Hash data using SHA-256
   */
  static async hashData(data: string): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    return this.arrayBufferToBase64(hashBuffer);
  }

  /**
   * Sign data with a private key
   */
  static async signData(privateKey: string, data: string): Promise<string> {
    try {
      // For now, we'll use a mock signature
      // In production, this would use the actual private key to sign
      const mockSignature = `mock_signature_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return mockSignature;
    } catch (error) {
      console.error('Failed to sign data:', error);
      throw new Error('Data signing failed');
    }
  }


  /**
   * Sign a message with wallet signature
   */
  static async signMessage(
    message: Omit<P2PMessage, 'signature'>,
    walletAddress: string
  ): Promise<string> {
    try {
      // For now, we'll use a mock signature
      // In production, this would use the wallet's signing capability
      const mockSignature = `mock_signature_${walletAddress}_${Date.now()}`;
      
      return mockSignature;
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw new Error('Message signing failed');
    }
  }

  /**
   * Verify a message signature
   */
  static async verifySignature(
    message: P2PMessage,
    expectedSender: string
  ): Promise<boolean> {
    try {
      // For now, we'll use mock verification
      // In production, this would verify the actual wallet signature
      return message.signature.startsWith(`mock_signature_${expectedSender}_`);
    } catch (error) {
      console.error('Failed to verify signature:', error);
      return false;
    }
  }

  /**
   * Generate a unique key ID
   */
  private static generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export default P2PEncryptionService;