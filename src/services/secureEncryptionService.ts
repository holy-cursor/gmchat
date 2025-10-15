/**
 * Secure Encryption Service with ECDH Key Exchange
 * Implements proper asymmetric encryption for P2P messaging
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

export class SecureEncryptionService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM
  private static readonly ECDH_CURVE = 'P-256';

  /**
   * Generate a new ECDH key pair for secure key exchange
   */
  static async generateKeyPair(): Promise<KeyPair> {
    try {
      // Generate ECDH key pair for key exchange
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'ECDH',
          namedCurve: this.ECDH_CURVE,
        },
        true,
        ['deriveKey']
      );

      // Export public key
      const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
      const publicKeyString = this.arrayBufferToBase64(publicKeyBuffer);

      // Export private key
      const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
      const privateKeyString = this.arrayBufferToBase64(privateKeyBuffer);

      const keyId = this.generateKeyId();

      return {
        publicKey: publicKeyString,
        privateKey: privateKeyString,
        keyId,
      };
    } catch (error) {
      console.error('Failed to generate ECDH key pair:', error);
      throw new Error('Key pair generation failed');
    }
  }

  /**
   * Derive a shared secret using ECDH
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
          namedCurve: this.ECDH_CURVE,
        },
        false,
        ['deriveKey']
      );

      const publicKeyObj = await crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'ECDH',
          namedCurve: this.ECDH_CURVE,
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
          name: this.ALGORITHM,
          length: this.KEY_LENGTH,
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
   * Encrypt a message with a shared secret
   */
  static async encryptMessage(
    plaintext: string,
    sharedSecret: CryptoKey
  ): Promise<EncryptionResult> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      const encryptedContentBuffer = await crypto.subtle.encrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        sharedSecret,
        new TextEncoder().encode(plaintext)
      );

      return {
        encryptedContent: this.arrayBufferToBase64(encryptedContentBuffer),
        nonce: this.arrayBufferToBase64(iv),
        publicKey: '', // Not needed for shared secret encryption
        keyId: '', // Not needed for shared secret encryption
      };
    } catch (error) {
      console.error('Failed to encrypt message:', error);
      throw new Error('Message encryption failed');
    }
  }

  /**
   * Decrypt a message with a shared secret
   */
  static async decryptMessage(
    encryptedContent: string,
    nonce: string,
    sharedSecret: CryptoKey
  ): Promise<string> {
    try {
      const iv = this.base64ToArrayBuffer(nonce);
      const encryptedContentBuffer = this.base64ToArrayBuffer(encryptedContent);

      const decryptedContentBuffer = await crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv: iv,
        },
        sharedSecret,
        encryptedContentBuffer
      );

      return new TextDecoder().decode(decryptedContentBuffer);
    } catch (error) {
      console.error('Failed to decrypt message:', error);
      throw new Error('Message decryption failed');
    }
  }

  /**
   * Sign a message with a private key
   */
  static async signMessage(message: P2PMessage, privateKey: string): Promise<string> {
    try {
      // Create a hash of the message content
      const messageContent = JSON.stringify({
        id: message.id,
        threadId: message.threadId,
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        timestamp: message.timestamp,
      });

      const messageBuffer = new TextEncoder().encode(messageContent);
      const hashBuffer = await crypto.subtle.digest('SHA-256', messageBuffer);

      // Import private key for signing
      const privateKeyBuffer = this.base64ToArrayBuffer(privateKey);
      const privateKeyObj = await crypto.subtle.importKey(
        'pkcs8',
        privateKeyBuffer,
        {
          name: 'ECDSA',
          namedCurve: this.ECDH_CURVE,
        },
        false,
        ['sign']
      );

      // Sign the hash
      const signatureBuffer = await crypto.subtle.sign(
        {
          name: 'ECDSA',
          hash: 'SHA-256',
        },
        privateKeyObj,
        hashBuffer
      );

      return this.arrayBufferToBase64(signatureBuffer);
    } catch (error) {
      console.error('Failed to sign message:', error);
      throw new Error('Message signing failed');
    }
  }

  /**
   * Verify a message signature with a public key
   */
  static async verifySignature(
    message: P2PMessage, 
    signature: string, 
    publicKey: string
  ): Promise<boolean> {
    try {
      // Create the same hash as when signing
      const messageContent = JSON.stringify({
        id: message.id,
        threadId: message.threadId,
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        timestamp: message.timestamp,
      });

      const messageBuffer = new TextEncoder().encode(messageContent);
      const hashBuffer = await crypto.subtle.digest('SHA-256', messageBuffer);

      // Import public key for verification
      const publicKeyBuffer = this.base64ToArrayBuffer(publicKey);
      const publicKeyObj = await crypto.subtle.importKey(
        'spki',
        publicKeyBuffer,
        {
          name: 'ECDSA',
          namedCurve: this.ECDH_CURVE,
        },
        false,
        ['verify']
      );

      // Verify the signature
      const signatureBuffer = this.base64ToArrayBuffer(signature);
      const isValid = await crypto.subtle.verify(
        {
          name: 'ECDSA',
          hash: 'SHA-256',
        },
        publicKeyObj,
        signatureBuffer,
        hashBuffer
      );

      return isValid;
    } catch (error) {
      console.error('Failed to verify signature:', error);
      return false;
    }
  }

  /**
   * Generate a unique key ID
   */
  private static generateKeyId(): string {
    return `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Convert ArrayBuffer to Base64 string
   */
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Convert Base64 string to ArrayBuffer
   */
  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export default SecureEncryptionService;
