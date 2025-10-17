import { supabase, DatabaseMessage, DatabaseContact } from '../config/supabase';
import { Message, Contact } from '../types';
import SecureAuthService from './secureAuthService';
import EncryptionService from './encryptionService';
import AuditLogService from './auditLogService';

export class SecureDatabaseService {
  /**
   * Store a message securely with encryption and authentication
   */
  static async storeMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    try {
      // Check authentication
      const isAuthenticated = await SecureAuthService.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }

      const walletAddress = await SecureAuthService.getCurrentWalletAddress();
      if (!walletAddress) {
        throw new Error('No wallet address found');
      }

      // Set wallet address for RLS
      await this.setWalletAddressForRLS(walletAddress);

      // Encrypt message content
      const encryptionKey = EncryptionService.generateEncryptionKey();
      const encryptedContent = EncryptionService.encryptMessage(
        message.content,
        encryptionKey.key,
        encryptionKey.iv
      );

      // Create secure database message
      const dbMessage: Omit<DatabaseMessage, 'id' | 'created_at' | 'updated_at'> = {
        sender: message.sender,
        recipient: message.recipient,
        content: '[ENCRYPTED]', // Never store plain text
        message_type: message.messageType,
        timestamp: Date.now(),
        transaction_signature: message.transactionSignature,
        chain_type: 'evm' as const,
        chain_id: message.chainId || 8453,
        ipfs_hash: undefined, // Disabled for security
        is_encrypted: true, // Always encrypted
        encrypted_content: encryptedContent,
        nonce: encryptionKey.iv,
        public_key: encryptionKey.key // Store key for decryption
      };

      // Store in database
      const { data, error } = await supabase
        .from('messages')
        .insert([dbMessage])
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Log security event
      await this.logSecurityEvent('message_stored', walletAddress, {
        messageId: data.id,
        recipient: message.recipient,
        isEncrypted: true
      }, 'low');

      // Convert back to Message format
      const storedMessage: Message = {
        id: data.id,
        sender: data.sender,
        recipient: data.recipient,
        content: message.content, // Return original content
        messageType: data.message_type as 'text' | 'image' | 'file',
        timestamp: data.timestamp,
        transactionSignature: data.transaction_signature,
        chainType: data.chain_type as 'evm' | 'solana',
        chainId: data.chain_id,
        ipfsHash: data.ipfs_hash,
        isEncrypted: data.is_encrypted,
        encryptedContent: data.encrypted_content,
        nonce: data.nonce,
        publicKey: data.public_key
      };

      return storedMessage;

    } catch (error) {
      console.error('Failed to store message securely:', error);
      throw error;
    }
  }

  /**
   * Get messages securely with decryption
   */
  static async getMessages(walletAddress: string): Promise<Message[]> {
    try {
      // Check authentication
      const isAuthenticated = await SecureAuthService.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }

      // Set wallet address for RLS
      await this.setWalletAddressForRLS(walletAddress);

      // Get messages using secure view
      const { data, error } = await supabase
        .from('secure_messages')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Decrypt messages
      const decryptedMessages: Message[] = [];
      for (const dbMessage of data || []) {
        try {
          let content = dbMessage.content;
          
          // Decrypt if encrypted
          if (dbMessage.is_encrypted && dbMessage.encrypted_content) {
            content = EncryptionService.decryptMessage(
              dbMessage.encrypted_content,
              dbMessage.public_key,
              dbMessage.nonce
            );
          }

          const message: Message = {
            id: dbMessage.id,
            sender: dbMessage.sender,
            recipient: dbMessage.recipient,
            content,
            messageType: dbMessage.message_type as 'text' | 'image' | 'file',
            timestamp: dbMessage.timestamp,
            transactionSignature: dbMessage.transaction_signature,
            chainType: dbMessage.chain_type as 'evm' | 'solana',
            chainId: dbMessage.chain_id,
            ipfsHash: dbMessage.ipfs_hash,
            isEncrypted: dbMessage.is_encrypted,
            encryptedContent: dbMessage.encrypted_content,
            nonce: dbMessage.nonce,
            publicKey: dbMessage.public_key
          };

          decryptedMessages.push(message);
        } catch (decryptError) {
          console.error('Failed to decrypt message:', decryptError);
          // Skip corrupted messages
        }
      }

      // Log security event
      await this.logSecurityEvent('messages_retrieved', walletAddress, {
        messageCount: decryptedMessages.length
      }, 'low');

      return decryptedMessages;

    } catch (error) {
      console.error('Failed to get messages securely:', error);
      throw error;
    }
  }

  /**
   * Store a contact securely
   */
  static async storeContact(contact: Contact, walletAddress: string): Promise<void> {
    try {
      // Check authentication
      const isAuthenticated = await SecureAuthService.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }

      // Set wallet address for RLS
      await this.setWalletAddressForRLS(walletAddress);

      // Create secure database contact
      const dbContact: Omit<DatabaseContact, 'id' | 'created_at' | 'updated_at'> = {
        wallet_address: walletAddress,
        contact_address: contact.address,
        display_name: contact.displayName,
        custom_tag: contact.customTag,
        last_activity: contact.lastActivity,
        unread_count: contact.unreadCount,
        is_online: contact.isOnline || false
      };

      const { error } = await supabase
        .from('contacts')
        .upsert([dbContact], { 
          onConflict: 'wallet_address,contact_address' 
        });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Log security event
      await this.logSecurityEvent('contact_stored', walletAddress, {
        contactAddress: contact.address,
        displayName: contact.displayName
      }, 'low');

    } catch (error) {
      console.error('Failed to store contact securely:', error);
      throw error;
    }
  }

  /**
   * Get contacts securely
   */
  static async getContacts(walletAddress: string): Promise<Contact[]> {
    try {
      // Check authentication
      const isAuthenticated = await SecureAuthService.isAuthenticated();
      if (!isAuthenticated) {
        throw new Error('User not authenticated');
      }

      // Set wallet address for RLS
      await this.setWalletAddressForRLS(walletAddress);

      // Get contacts using secure view
      const { data, error } = await supabase
        .from('secure_contacts')
        .select('*')
        .order('last_activity', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const contacts: Contact[] = (data || []).map((dbContact: any) => ({
        address: dbContact.contact_address,
        displayName: dbContact.display_name,
        customTag: dbContact.custom_tag,
        unreadCount: dbContact.unread_count,
        lastActivity: dbContact.last_activity,
        isOnline: dbContact.is_online
      }));

      // Log security event
      await this.logSecurityEvent('contacts_retrieved', walletAddress, {
        contactCount: contacts.length
      }, 'low');

      return contacts;

    } catch (error) {
      console.error('Failed to get contacts securely:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time message updates securely
   */
  static subscribeToMessages(walletAddress: string, onMessage: (message: Message) => void) {
    try {
      // Set wallet address for RLS
      this.setWalletAddressForRLS(walletAddress);

      // Subscribe to secure messages view
      const subscription = supabase
        .channel('secure_messages')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'secure_messages' 
          }, 
          async (payload: any) => {
            try {
              const dbMessage = payload.new as any;
              
              // Decrypt message
              let content = dbMessage.content;
              if (dbMessage.is_encrypted && dbMessage.encrypted_content) {
                content = EncryptionService.decryptMessage(
                  dbMessage.encrypted_content,
                  dbMessage.public_key,
                  dbMessage.nonce
                );
              }

              const message: Message = {
                id: dbMessage.id,
                sender: dbMessage.sender,
                recipient: dbMessage.recipient,
                content,
                messageType: dbMessage.message_type,
                timestamp: dbMessage.timestamp,
                transactionSignature: dbMessage.transaction_signature,
                chainType: dbMessage.chain_type,
                chainId: dbMessage.chain_id,
                ipfsHash: dbMessage.ipfs_hash,
                isEncrypted: dbMessage.is_encrypted,
                encryptedContent: dbMessage.encrypted_content,
                nonce: dbMessage.nonce,
                publicKey: dbMessage.public_key
              };

              onMessage(message);
            } catch (error) {
              console.error('Failed to process real-time message:', error);
            }
          }
        )
        .subscribe();

      return subscription;

    } catch (error) {
      console.error('Failed to subscribe to messages securely:', error);
      throw error;
    }
  }

  /**
   * Set wallet address for Row Level Security
   */
  private static async setWalletAddressForRLS(walletAddress: string): Promise<void> {
    try {
      await supabase.rpc('set_current_wallet_address', { wallet_address: walletAddress });
    } catch (error) {
      console.error('Failed to set wallet address for RLS:', error);
      throw error;
    }
  }

  /**
   * Log security event
   */
  private static async logSecurityEvent(
    eventType: string,
    walletAddress: string,
    details: Record<string, any>,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    try {
      // Log to audit service
      AuditLogService.logEvent(
        eventType as any,
        walletAddress,
        details,
        severity
      );

      // Log to database
      await supabase
        .from('security_events')
        .insert([{
          event_type: eventType,
          wallet_address: walletAddress,
          details,
          severity,
          ip_address: undefined,
          user_agent: navigator.userAgent
        }]);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Test database connection securely
   */
  static async testConnection(): Promise<boolean> {
    try {
      const isAuthenticated = await SecureAuthService.isAuthenticated();
      if (!isAuthenticated) {
        return false;
      }

      const walletAddress = await SecureAuthService.getCurrentWalletAddress();
      if (!walletAddress) {
        return false;
      }

      await this.setWalletAddressForRLS(walletAddress);

      // Test with a simple query
      const { error } = await supabase
        .from('secure_messages')
        .select('id')
        .limit(1);

      return !error;

    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

export default SecureDatabaseService;
