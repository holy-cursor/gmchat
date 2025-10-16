import { supabase, DatabaseMessage, DatabaseContact } from '../config/supabase';
import { Message, Contact } from '../types';
import IPFSService from './ipfsService';

export class HybridDatabaseService {
  /**
   * Store a message in the database and get blockchain proof
   */
  static async storeMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<Message> {
    try {
      // 1. Upload to IPFS for backup
      let ipfsHash: string | undefined;
      try {
        const messageData = JSON.stringify({
          content: message.content,
          sender: message.sender,
          recipient: message.recipient,
          timestamp: Date.now()
        });
        const ipfsResult = await IPFSService.uploadContent(messageData);
        ipfsHash = ipfsResult.hash;
        console.log('Message uploaded to IPFS:', ipfsHash);
      } catch (error) {
        console.warn('IPFS upload failed:', error);
      }

      // 2. Store in database
      const dbMessage: Omit<DatabaseMessage, 'id' | 'created_at' | 'updated_at'> = {
        sender: message.sender,
        recipient: message.recipient,
        content: message.content,
        message_type: message.messageType,
        timestamp: Date.now(),
        transaction_signature: message.transactionSignature,
        chain_type: 'evm' as const,
        chain_id: message.chainId || 8453,
        ipfs_hash: ipfsHash,
        is_encrypted: message.isEncrypted || false,
        encrypted_content: message.encryptedContent,
        nonce: message.nonce,
        public_key: message.publicKey
      };

      if (!supabase) {
        console.warn('⚠️ Supabase not available, using local storage only');
        // Create a simple message with ID and timestamp for local storage
        const localMessage: Message = {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...message,
          timestamp: Date.now()
        };
        
        // Store in localStorage
        const existingMessages = JSON.parse(localStorage.getItem('gmchat_messages') || '[]');
        existingMessages.push(localMessage);
        localStorage.setItem('gmchat_messages', JSON.stringify(existingMessages));
        
        return localMessage;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([dbMessage])
        .select()
        .single();

      if (error) {
        console.warn('⚠️ Supabase storage failed, using local storage only:', error.message);
        // Create a simple message with ID and timestamp for local storage
        const localMessage: Message = {
          id: `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...message,
          timestamp: Date.now()
        };
        
        // Store in localStorage
        const existingMessages = JSON.parse(localStorage.getItem('gmchat_messages') || '[]');
        existingMessages.push(localMessage);
        localStorage.setItem('gmchat_messages', JSON.stringify(existingMessages));
        
        return localMessage;
      }

      // 3. Convert back to Message format
      const storedMessage: Message = {
        id: data.id,
        sender: data.sender,
        recipient: data.recipient,
        content: data.content,
        messageType: data.message_type,
        timestamp: data.timestamp,
        transactionSignature: data.transaction_signature,
        chainType: data.chain_type,
        chainId: data.chain_id,
        ipfsHash: data.ipfs_hash,
        isEncrypted: data.is_encrypted,
        encryptedContent: data.encrypted_content,
        nonce: data.nonce,
        publicKey: data.public_key
      };

      console.log('Message stored in database:', storedMessage);
      return storedMessage;

    } catch (error) {
      console.error('Failed to store message:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   */
  static async getMessages(walletAddress: string, contactAddress: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender.eq.${walletAddress},recipient.eq.${contactAddress}),and(sender.eq.${contactAddress},recipient.eq.${walletAddress})`)
        .order('timestamp', { ascending: true });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Convert to Message format
      const messages: Message[] = data.map((dbMessage: DatabaseMessage) => ({
        id: dbMessage.id,
        sender: dbMessage.sender,
        recipient: dbMessage.recipient,
        content: dbMessage.content,
        messageType: dbMessage.message_type,
        timestamp: dbMessage.timestamp,
        transactionSignature: dbMessage.transaction_signature || '',
        chainType: dbMessage.chain_type as 'evm',
        chainId: dbMessage.chain_id,
        ipfsHash: dbMessage.ipfs_hash,
        isEncrypted: dbMessage.is_encrypted,
        encryptedContent: dbMessage.encrypted_content,
        nonce: dbMessage.nonce,
        publicKey: dbMessage.public_key
      }));

      console.log(`Retrieved ${messages.length} messages from database`);
      return messages;

    } catch (error) {
      console.error('Failed to get messages:', error);
      throw error;
    }
  }

  /**
   * Get all contacts for a wallet
   */
  static async getContacts(walletAddress: string): Promise<Contact[]> {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('wallet_address', walletAddress)
        .order('last_activity', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Convert to Contact format
      const contacts: Contact[] = data.map((dbContact: DatabaseContact) => ({
        address: dbContact.contact_address,
        displayName: dbContact.display_name,
        customTag: dbContact.custom_tag,
        lastActivity: dbContact.last_activity,
        unreadCount: dbContact.unread_count,
        isOnline: dbContact.is_online
      }));

      console.log(`Retrieved ${contacts.length} contacts from database`);
      return contacts;

    } catch (error) {
      console.error('Failed to get contacts:', error);
      throw error;
    }
  }

  /**
   * Store a contact
   */
  static async storeContact(contact: Contact, walletAddress: string): Promise<void> {
    try {
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

      console.log('Contact stored in database:', contact);

    } catch (error) {
      console.error('Failed to store contact:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time message updates
   */
  static subscribeToMessages(walletAddress: string, onMessage: (message: Message) => void) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(sender.eq.${walletAddress},recipient.eq.${walletAddress})`
        },
        (payload) => {
          const dbMessage = payload.new as DatabaseMessage;
          const message: Message = {
            id: dbMessage.id,
            sender: dbMessage.sender,
            recipient: dbMessage.recipient,
            content: dbMessage.content,
            messageType: dbMessage.message_type,
            timestamp: dbMessage.timestamp,
            transactionSignature: dbMessage.transaction_signature || '',
            chainType: dbMessage.chain_type,
            chainId: dbMessage.chain_id,
            ipfsHash: dbMessage.ipfs_hash,
            isEncrypted: dbMessage.is_encrypted,
            encryptedContent: dbMessage.encrypted_content,
            nonce: dbMessage.nonce,
            publicKey: dbMessage.public_key
          };
          onMessage(message);
        }
      )
      .subscribe();
  }

  /**
   * Get blockchain proof for a message (store hash on-chain)
   */
  static async storeBlockchainProof(messageId: string, ipfsHash: string): Promise<string> {
    try {
      // This would store a hash of the message on-chain
      // For now, we'll return a placeholder
      console.log(`Storing blockchain proof for message ${messageId} with IPFS hash ${ipfsHash}`);
      
      // In a real implementation, you would:
      // 1. Create a smart contract transaction
      // 2. Store the message hash and IPFS hash
      // 3. Return the transaction hash
      
      return `blockchain_proof_${messageId}`;
    } catch (error) {
      console.error('Failed to store blockchain proof:', error);
      throw error;
    }
  }
}

export default HybridDatabaseService;
