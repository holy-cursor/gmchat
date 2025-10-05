import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { BaseMiniAppProvider } from './contexts/BaseMiniAppContext';
import { useAccount } from 'wagmi';
import { WalletType } from './components/BaseMiniAppWallet';
import BaseMiniAppHeader from './components/BaseMiniAppHeader';
import BaseMiniAppWallet from './components/BaseMiniAppWallet';
import AboutModal from './components/AboutModal';
import SuccessModal from './components/SuccessModal';
import ErrorBoundary from './components/ErrorBoundary';
import { Contact, Conversation } from './types';
import { MessageStorageService } from './services/messageStorage';
import HybridDatabaseService from './services/hybridDatabaseService';
import ContactList from './components/ContactList';
import BaseMiniAppConversationView from './components/BaseMiniAppConversationView';
import NewMessageModal from './components/NewMessageModal';
import AddContactModal from './components/AddContactModal';
import ContactTagModal from './components/ContactTagModal';
import CaptchaModal from './components/CaptchaModal';
import MiniAppModeIndicator from './components/MiniAppModeIndicator';
// import DatabaseTest from './components/DatabaseTest';
import './utils/ipfsTest'; // Load IPFS test utility
import { toast } from 'react-hot-toast';
import './App.css'; // Import modern iMessage-inspired styling

function AppContent() {
  const { isDark } = useTheme();
  const { address: evmAddress, isConnected: evmConnected, chainId: evmChainId } = useAccount();
  const [selectedWalletType, setSelectedWalletType] = useState<WalletType>('base');
  
  // Debug EVM wallet state
  React.useEffect(() => {
    console.log('EVM Wallet State Changed:', {
      evmAddress,
      evmConnected,
      evmChainId,
      selectedWalletType
    });
  }, [evmAddress, evmConnected, evmChainId, selectedWalletType]);

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [useHybridMode, setUseHybridMode] = useState(true); // Enable hybrid mode by default for cross-device sync
  const [ultraLowCostMode, setUltraLowCostMode] = useState(false); // Database-only mode (no blockchain)
  
  // Modal state
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isContactTagModalOpen, setIsContactTagModalOpen] = useState(false);
  const [contactToTag, setContactToTag] = useState<Contact | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isCaptchaModalOpen, setIsCaptchaModalOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<{ content: string; recipient: string } | null>(null);
  // const [showDatabaseTest, setShowDatabaseTest] = useState(false);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Load contacts for the connected wallet
  const loadContacts = useCallback(async (): Promise<void> => {
    const walletAddress = evmAddress;
      
    if (!walletAddress) {
      setContacts([]);
      setCurrentConversation(null);
      setTotalUnreadCount(0);
      return;
    }

    try {
      let storedContacts: Contact[];
      
      if (useHybridMode) {
        // Use hybrid database for real-time sync
        console.log('Loading contacts from hybrid database...');
        try {
          storedContacts = await HybridDatabaseService.getContacts(walletAddress);
          console.log('Loaded contacts from database:', storedContacts.length);
        } catch (dbError) {
          console.warn('Failed to load from database, falling back to local storage:', dbError);
          storedContacts = MessageStorageService.getContacts(walletAddress, 'evm');
        }
        
        // Also sync with local storage for offline support
        const localContacts = MessageStorageService.getContacts(walletAddress, 'evm');
        
        // Merge contacts (database takes priority)
        const contactMap = new Map<string, Contact>();
        localContacts.forEach(contact => contactMap.set(contact.address, contact));
        storedContacts.forEach(contact => contactMap.set(contact.address, contact));
        
        storedContacts = Array.from(contactMap.values());
        console.log('Final merged contacts:', storedContacts.length);
      } else {
        // Use local storage only
        storedContacts = MessageStorageService.getContacts(walletAddress, 'evm');
      }
      
      setContacts(storedContacts);

      const unread = storedContacts.reduce((sum, contact) => sum + (contact.unreadCount || 0), 0);
      setTotalUnreadCount(unread);

      // Refresh current conversation if a contact is selected
      if (selectedContact) {
        let updatedConversation = MessageStorageService.getConversation(walletAddress, selectedContact.address);
        
        // If using hybrid mode, also fetch messages from database
        if (useHybridMode) {
          try {
            const dbMessages = await HybridDatabaseService.getMessages(walletAddress, selectedContact.address);
            console.log('Fetched messages from database:', dbMessages.length);
            
            // Merge with local messages
            const localMessages = MessageStorageService.getConversation(walletAddress, selectedContact.address)?.messages || [];
            const allMessages = [...localMessages, ...dbMessages];
            
            // Remove duplicates and sort by timestamp
            const uniqueMessages = allMessages.filter((message, index, self) => 
              index === self.findIndex(m => 
                m.id === message.id || 
                (m.transactionSignature === message.transactionSignature && m.transactionSignature)
              )
            ).sort((a, b) => a.timestamp - b.timestamp);
            
            // Update local storage with merged messages
            uniqueMessages.forEach(msg => MessageStorageService.storeMessage(msg));
            
            // Get updated conversation
            updatedConversation = MessageStorageService.getConversation(walletAddress, selectedContact.address);
          } catch (dbError) {
            console.warn('Failed to fetch messages from database:', dbError);
          }
        }
        
        setCurrentConversation(updatedConversation);
      }
    } catch (error) {
      console.error('Failed to load contacts:', error);
      // Fallback to local storage
      const storedContacts = MessageStorageService.getContacts(walletAddress, 'evm');
      setContacts(storedContacts);
      const unread = storedContacts.reduce((sum, contact) => sum + (contact.unreadCount || 0), 0);
      setTotalUnreadCount(unread);
    }
  }, [evmAddress, selectedContact, useHybridMode]);

  // Real-time sync with hybrid database
  useEffect(() => {
    if (!evmAddress || !useHybridMode) return;

    console.log('Setting up real-time sync for wallet:', evmAddress);
    
    const subscription = HybridDatabaseService.subscribeToMessages(evmAddress, (message) => {
      console.log('Real-time message received:', message);
      
      // Store message locally
      MessageStorageService.storeMessage(message);
      
      // Reload contacts to update UI
      loadContacts();
      
      // Update current conversation if we're viewing the sender
      if (selectedContact && 
          (message.sender === selectedContact.address || message.recipient === selectedContact.address)) {
        const updatedConversation = MessageStorageService.getConversation(evmAddress, selectedContact.address);
        setCurrentConversation(updatedConversation);
      }
      
      toast.success('New message received!');
    });

    // Fallback: Periodic sync every 30 seconds to catch any missed messages
    const periodicSync = setInterval(async () => {
      try {
        console.log('Performing periodic sync...');
        await loadContacts();
      } catch (error) {
        console.warn('Periodic sync failed:', error);
      }
    }, 30000); // 30 seconds

    return () => {
      console.log('Cleaning up real-time subscription and periodic sync');
      subscription.unsubscribe();
      clearInterval(periodicSync);
    };
  }, [evmAddress, useHybridMode, selectedContact, loadContacts]);

  // Clean up duplicate messages in localStorage
  const cleanupDuplicateMessages = useCallback((): void => {
    try {
      const messages = MessageStorageService.getAllMessages();
      
      // Remove duplicates
      const uniqueMessages = messages.filter((message, index, self) => 
        index === self.findIndex(m => 
          m.id === message.id || 
          (m.transactionSignature === message.transactionSignature && m.transactionSignature)
        )
      );
      
      // Clean up messages with empty content or raw encrypted data as content
      const cleanedMessages = uniqueMessages.map(message => {
        // Only fix messages that have problematic content (raw encrypted data as content)
        if (message.content && message.content.includes('{"encryptedContent"')) {
          // For messages with raw encrypted data as content, show a proper fallback
          if (message.isEncrypted) {
            return {
              ...message,
              content: '[Encrypted Message]'
            };
          } else {
            return {
              ...message,
              content: 'Message content unavailable'
            };
          }
        }
        // Don't modify messages that already have proper content
        return message;
      });
      
      if (cleanedMessages.length !== messages.length || cleanedMessages.some((msg, i) => msg !== uniqueMessages[i])) {
        console.log(`Cleaned up ${messages.length - cleanedMessages.length} duplicate/problematic messages`);
        MessageStorageService.setMessages(cleanedMessages);
        loadContacts(); // Reload to update UI
      }
    } catch (error) {
      console.error('Failed to cleanup duplicate messages:', error);
    }
  }, [loadContacts]);

  useEffect(() => {
    // Clean up any duplicate messages first
    cleanupDuplicateMessages();
    loadContacts();
    
    // Initialize Feather icons
    if (typeof window !== 'undefined' && (window as any).feather) {
      (window as any).feather.replace();
    }
  }, [loadContacts, selectedWalletType, evmAddress, cleanupDuplicateMessages]);

  // Handle wallet type change
  const handleWalletTypeChange = (type: WalletType): void => {
    setSelectedWalletType(type);
  };

  // EVM message sending handler
  const handleEVMMessage = useCallback(async (recipient: string, content: string, chainId: number): Promise<void> => {
    console.log('📨 handleEVMMessage called with:', { recipient, content, chainId, ultraLowCostMode });
    console.log('🔗 EVM Wallet state check:', {
      evmConnected,
      evmAddress,
      evmChainId,
      selectedWalletType
    });

    if (!evmAddress) {
      console.error('❌ EVM wallet not connected:', { evmConnected, evmAddress });
      toast.error('Please connect your Base wallet first');
      return;
    }

    try {
      console.log('EVM Wallet state confirmed:', {
        isConnected: evmConnected,
        address: evmAddress,
        chainId: evmChainId
      });

      // Import services
      const IPFSService = await import('./services/ipfsService');
      const EnhancedEncryptionService = await import('./services/enhancedEncryptionService');

      // Generate or get encryption keys for this conversation
      const keyId = await EnhancedEncryptionService.default.getKeyId(evmAddress!, recipient);
      let senderKeyPair = await getOrCreateKeyPair(keyId, 'sender');
      let recipientKeyPair = await getOrCreateKeyPair(keyId, 'recipient');

      // Encrypt the message
      const encryptedMessage = await EnhancedEncryptionService.default.encryptMessage(
        content,
        senderKeyPair.privateKey,
        recipientKeyPair.publicKey
      );

      console.log('Message encrypted successfully');

      // Upload encrypted content to IPFS first
      let ipfsHash: string | undefined;
      try {
        const encryptedData = JSON.stringify(encryptedMessage);
        const ipfsResult = await IPFSService.default.uploadContent(encryptedData);
        ipfsHash = ipfsResult.hash;
        console.log('Encrypted content uploaded to IPFS:', ipfsResult);
      } catch (error) {
        console.warn('IPFS upload failed, continuing without IPFS:', error);
      }

      let transactionHash: string;

      if (ultraLowCostMode) {
        // Ultra-low-cost mode: Database-only, no blockchain transaction
        console.log('🚀 Using ultra-low-cost mode (database-only)');
        transactionHash = `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        console.log('Database-only message created:', transactionHash);
      } else {
        // Standard mode: Send blockchain transaction
        const { minikitConfig } = await import('./config/minikit');
        const { sendTransaction, estimateGas } = await import('wagmi/actions');
        
        // Send minimal transaction with compressed data (reduces gas cost)
        const messageId = `msg_${Date.now()}`;
        const data = `0x${Array.from(new TextEncoder().encode(messageId))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')}`;

        // Try gas estimation first, fallback to lower default if it fails
        let gasEstimate;
        try {
          gasEstimate = await estimateGas(minikitConfig, {
            to: recipient as `0x${string}`,
            value: BigInt(0), // No ETH value transfer - saves ~$0.00003
            data: data as `0x${string}`,
          });
          console.log('Gas estimate:', gasEstimate);
          // Add 10% buffer to gas estimate (reduced from 20%)
          gasEstimate = gasEstimate + (gasEstimate * BigInt(10)) / BigInt(100);
        } catch (gasError) {
          console.warn('Gas estimation failed, using lower default:', gasError);
          gasEstimate = BigInt(21000); // Much lower fallback - just basic transaction
        }

        transactionHash = await sendTransaction(minikitConfig, {
          to: recipient as `0x${string}`,
          value: BigInt(0), // No ETH value transfer - saves ~$0.00003
          data: data as `0x${string}`,
          gas: gasEstimate,
        });

        console.log('EVM message sent successfully:', transactionHash);
      }

      // Store the encrypted message
      const messageToStore = {
        sender: evmAddress!,
        recipient: recipient,
        content: content, // Store plain text for display
        messageType: 'text' as const,
        transactionSignature: transactionHash,
        chainType: 'evm' as const,
        chainId: chainId,
        ipfsHash: ipfsHash,
        isEncrypted: true,
        encryptedContent: encryptedMessage.encryptedContent,
        nonce: encryptedMessage.nonce,
        publicKey: encryptedMessage.publicKey
      };

      if (useHybridMode) {
        // Store in hybrid database for real-time sync
        try {
          await HybridDatabaseService.storeMessage(messageToStore);
          console.log('Message stored in hybrid database');
        } catch (error) {
          console.warn('Failed to store in hybrid database, falling back to local storage:', error);
          MessageStorageService.storeMessage(messageToStore);
        }
      } else {
        // Store locally only
        MessageStorageService.storeMessage(messageToStore);
      }

      console.log('Message sent and stored successfully:', content);

      // Reload contacts to show the new message
      await loadContacts();

      // Update current conversation if we're viewing the recipient
      if (selectedContact && selectedContact.address === recipient) {
        const updatedConversation = MessageStorageService.getConversation(evmAddress!, recipient);
        console.log('EVM Message - Updated conversation:', updatedConversation);
        console.log('EVM Message - Messages in conversation:', updatedConversation?.messages);
        setCurrentConversation(updatedConversation);
      }

      // Show success message
      toast.success(`Message sent! Transaction: ${transactionHash.slice(0, 10)}...`);
      
    } catch (error) {
      console.error('Failed to send EVM message:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      toast.error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error; // Re-throw to be caught by handleCaptchaVerify
    }
  }, [evmConnected, evmAddress, evmChainId, selectedWalletType, loadContacts, selectedContact, useHybridMode, ultraLowCostMode]);

  const handleSendMessage = useCallback(async (content?: string, recipient?: string): Promise<void> => {
    const currentWalletAddress = evmAddress;

    if (!currentWalletAddress) {
      toast.error('Please connect your wallet first.');
      return;
    }

    const finalRecipient = recipient || selectedContact?.address;
    const finalContent = content;

    if (!finalRecipient || !finalContent) {
      toast.error('Recipient or content missing.');
      return;
    }

    // Basic security check: prevent sending to self
    if (finalRecipient === currentWalletAddress) {
      toast.error("Cannot send message to yourself directly.");
      return;
    }

    setPendingMessage({ content: finalContent, recipient: finalRecipient });
    setIsCaptchaModalOpen(true);
  }, [evmAddress, selectedContact]);

  const handleCaptchaVerify = async (success: boolean): Promise<void> => {
    console.log('🔐 Captcha verify called with success:', success);
    console.log('📝 Pending message:', pendingMessage);
    console.log('🔗 EVM state:', { evmConnected, evmAddress, evmChainId });
    
    if (!success || !pendingMessage) {
      console.log('❌ Captcha failed or no pending message');
      setPendingMessage(null);
      setIsCaptchaModalOpen(false);
      return;
    }

    // Check Base wallet connection
    if (!evmConnected || !evmAddress) {
      console.log('❌ EVM wallet not connected');
      toast.error('Please connect your Base wallet first');
      setPendingMessage(null);
      setIsCaptchaModalOpen(false);
      return;
    }

    const { content, recipient } = pendingMessage;
    setPendingMessage(null);
    setIsCaptchaModalOpen(false);

    console.log('🚀 Starting message send process...', { content, recipient, chainId: evmChainId || 8453 });
    setIsSending(true);

    // Send Base message
    try {
      console.log('📤 Calling handleEVMMessage...');
      await handleEVMMessage(recipient, content, evmChainId || 8453);
      console.log('✅ Message sent successfully');
      setIsSending(false);
      toast.success('Message sent successfully!');
      return;
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      console.error('🔍 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      toast.error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsSending(false);
      return;
    }
  };

  // Key management for encryption
  const getOrCreateKeyPair = async (keyId: string, role: 'sender' | 'recipient'): Promise<any> => {
    const storageKey = `encryption_key_${keyId}_${role}`;
    let keyPair = localStorage.getItem(storageKey);
    
    if (keyPair) {
      return JSON.parse(keyPair);
    }
    
    // Generate new key pair
    const EnhancedEncryptionService = await import('./services/enhancedEncryptionService');
    const newKeyPair = EnhancedEncryptionService.default.generateKeyPair();
    
    // Store key pair
    localStorage.setItem(storageKey, JSON.stringify({
      publicKey: Array.from(newKeyPair.publicKey),
      privateKey: Array.from(newKeyPair.privateKey)
    }));
    
    return newKeyPair;
  };

  // Inspect raw localStorage data (for debugging)
  const inspectLocalStorage = useCallback((): void => {
    try {
      const rawData = localStorage.getItem('dotmsg_messages');
      console.log('Raw localStorage data:', rawData);
      
      if (rawData) {
        const messages = JSON.parse(rawData);
        console.log('Parsed messages:', messages);
        
        // Filter messages for current wallet
        const walletMessages = messages.filter((msg: any) => 
          msg.sender === evmAddress || msg.recipient === evmAddress
        );
        console.log(`Messages for wallet ${evmAddress}:`, walletMessages);
        console.log(`Total messages found: ${walletMessages.length}`);
        
        messages.forEach((msg: any, index: number) => {
          console.log(`Message ${index}:`, {
            id: msg.id,
            sender: msg.sender,
            recipient: msg.recipient,
            content: msg.content,
            isEncrypted: msg.isEncrypted,
            hasEncryptedContent: !!msg.encryptedContent,
            transactionSignature: msg.transactionSignature
          });
        });
      }
      
      toast.success('Check console for detailed localStorage data');
    } catch (error) {
      console.error('Failed to inspect localStorage:', error);
      toast.error('Failed to inspect localStorage');
    }
  }, [evmAddress]);

  // Clear all messages and reload (for debugging)
  const clearAllMessages = useCallback((): void => {
    try {
      localStorage.removeItem('dotmsg_messages');
      console.log('Cleared all messages from localStorage');
      loadContacts(); // Reload to update UI
    } catch (error) {
      console.error('Failed to clear messages:', error);
    }
  }, [loadContacts]);

  // Debug function to test message sending without captcha
  const handleDebugSendMessage = useCallback(async (): Promise<void> => {
    if (!evmAddress || !selectedContact) {
      toast.error('Please connect wallet and select a contact first');
      return;
    }

    const testMessage = 'Debug test message';
    const recipient = selectedContact.address;
    
    console.log('🧪 Debug sending message:', { testMessage, recipient });
    
    try {
      setIsSending(true);
      await handleEVMMessage(recipient, testMessage, evmChainId || 8453);
      toast.success('Debug message sent!');
    } catch (error) {
      console.error('Debug send failed:', error);
      toast.error(`Debug send failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  }, [evmAddress, selectedContact, evmChainId, handleEVMMessage]);

  // Manual message recovery from transaction data
  const handleManualRecovery = useCallback(async (): Promise<void> => {
    if (!evmAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      toast.loading('Scanning for messages in recent transactions...', { id: 'recovery' });
      
      console.log('Manual recovery for address:', evmAddress);
      
      // For now, let's create a simple message that simulates a recovered message
      // This is a temporary solution until we fix the API issue
      const recoveredMessage = {
        id: `recovered_${Date.now()}`,
        sender: evmAddress,
        recipient: '0x0000000000000000000000000000000000000000', // Placeholder
        content: 'This is a test recovered message. The recovery feature is being updated.',
        messageType: 'text' as const,
        transactionSignature: 'recovery_test',
        chainType: 'evm' as const,
        chainId: 8453,
        timestamp: Date.now(),
        isEncrypted: false
      };
      
      // Store the test message
      MessageStorageService.storeMessage(recoveredMessage);
      await loadContacts();
      
      toast.success('Test recovery message added. Recovery feature is being updated.', { id: 'recovery' });
    } catch (error) {
      console.error('Manual recovery failed:', error);
      toast.error(`Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'recovery' });
    }
  }, [evmAddress, loadContacts]);

  const handleOpenAboutModal = (): void => setIsAboutModalOpen(true);
  const handleCloseAboutModal = (): void => setIsAboutModalOpen(false);

  // Handle database test
  // const handleTestDatabase = useCallback((): void => {
  //   setShowDatabaseTest(true);
  // }, []);

  // Handle adding a new contact
  const handleAddContact = useCallback(async (address: string, displayName?: string): Promise<void> => {
    if (!evmAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!address || address.trim() === '') {
      toast.error('Please enter a valid address');
      return;
    }

    // Validate address format (basic check)
    if (!address.startsWith('0x') || address.length !== 42) {
      toast.error('Please enter a valid Base address (0x...)');
      return;
    }

    // Check if contact already exists
    const existingContact = contacts.find(contact => 
      contact.address.toLowerCase() === address.toLowerCase()
    );

    if (existingContact) {
      toast.error('Contact already exists');
      return;
    }

    try {
      // Create new contact
      const newContact: Contact = {
        address: address,
        displayName: displayName || `Contact ${address.slice(0, 6)}...${address.slice(-4)}`,
        customTag: displayName || undefined,
        lastActivity: Date.now(),
        unreadCount: 0,
        isOnline: false
      };

      // Store contact by creating a placeholder message
      if (newContact.customTag) {
        MessageStorageService.setContactTag(evmAddress, newContact.address, newContact.customTag);
      }
      
      // Create a placeholder message to establish the contact relationship
      const placeholderMessage = {
        sender: evmAddress,
        recipient: newContact.address,
        content: 'Contact added',
        messageType: 'text' as const,
        transactionSignature: 'contact_placeholder',
        chainType: 'evm' as const,
        chainId: 8453,
        isRead: true,
        isEncrypted: false
      };
      
      MessageStorageService.storeMessage(placeholderMessage);
      
      // Reload contacts
      await loadContacts();
      
      toast.success('Contact added successfully!');
      setIsAddContactModalOpen(false);
    } catch (error) {
      console.error('Failed to add contact:', error);
      toast.error('Failed to add contact');
    }
  }, [evmAddress, contacts, loadContacts]);


  // Handle cross-device message sync
  const handleSyncMessages = async (): Promise<void> => {
    if (!evmAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    try {
      toast.loading('Syncing messages from IPFS...', { id: 'sync' });
      
      console.log('Starting cross-device sync for address:', evmAddress);
      
      const MessageRecoveryService = await import('./services/messageRecoveryService');
      await MessageRecoveryService.default.performCrossDeviceSync(evmAddress);
      
      console.log('Sync completed');
      
      // Clean up any duplicate messages
      cleanupDuplicateMessages();
      
      // Reload contacts to show synced messages
      await loadContacts();
      
      // Count messages after sync
      const allMessages = MessageStorageService.getAllMessages();
      const walletMessages = allMessages.filter((msg: any) => 
        msg.sender === evmAddress || msg.recipient === evmAddress
      );
      
      console.log(`Total messages after sync: ${walletMessages.length}`);
      toast.success(`Sync completed! Found ${walletMessages.length} messages total.`, { id: 'sync' });
    } catch (error) {
      console.error('Failed to sync messages:', error);
      toast.error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { id: 'sync' });
    }
  };
  const handleCloseSuccessModal = (): void => setIsSuccessModalOpen(false);
  const handleCloseNewMessageModal = (): void => setIsNewMessageModalOpen(false);
  const handleCloseContactTagModal = (): void => {
    setIsContactTagModalOpen(false);
    setContactToTag(null);
  };

  // Handle contact selection
  const handleContactSelect = useCallback((contact: Contact): void => {
    const currentWalletAddress = evmAddress;

    if (!currentWalletAddress) return;

    setSelectedContact(contact);

    const conversation = MessageStorageService.getConversation(currentWalletAddress, contact.address);
    setCurrentConversation(conversation);

    if (conversation) {
      MessageStorageService.markConversationAsRead(currentWalletAddress, contact.address);
      loadContacts();
    }
  }, [evmAddress, loadContacts]);




  // Handle saving contact tag
  const handleSaveContactTag = (address: string, customTag: string): void => {
    const currentWalletAddress = evmAddress;

    if (!currentWalletAddress) return;

    MessageStorageService.setContactTag(currentWalletAddress, address, customTag);
    loadContacts();
    toast.success('Contact tag saved!');
  };

  // Handle removing contact tag
  const handleRemoveContactTag = (address: string): void => {
    const currentWalletAddress = evmAddress;

    if (!currentWalletAddress) return;

    MessageStorageService.removeContactTag(currentWalletAddress, address);
    loadContacts();
    toast.success('Contact tag removed!');
  };

  // Handle sending message to current conversation
  const handleSendToConversation = useCallback(async (content: string): Promise<void> => {
    const currentWalletAddress = evmAddress;

    if (!currentWalletAddress) {
      toast.error('Please connect your wallet to send messages.');
      return;
    }

    setIsSending(true);
    try {
      if (selectedContact) {
        await handleSendMessage(content, selectedContact.address);

        const updatedConversation = MessageStorageService.getConversation(currentWalletAddress, selectedContact.address);
        setCurrentConversation(updatedConversation);
      }

      await loadContacts();
    } catch (error) {
      console.error('Error sending message to conversation:', error);
      toast.error(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, evmAddress, loadContacts, handleSendMessage]);


  return (
    <ErrorBoundary>
      <div className={`h-screen flex flex-col overflow-hidden ${
        isDark 
          ? 'bg-gray-900' 
          : 'bg-gray-50'
      }`}>
             <BaseMiniAppHeader
               onOpenAbout={handleOpenAboutModal}
               unreadCount={totalUnreadCount}
               onNewMessage={() => setIsNewMessageModalOpen(true)}
               onAddContact={() => setIsAddContactModalOpen(true)}
               onSyncMessages={handleSyncMessages}
               onCleanupMessages={cleanupDuplicateMessages}
               onClearAllMessages={clearAllMessages}
               onInspectStorage={inspectLocalStorage}
               onManualRecovery={handleManualRecovery}
               onDebugSendMessage={handleDebugSendMessage}
               selectedWalletType={selectedWalletType}
               onWalletTypeChange={handleWalletTypeChange}
               walletButton={<BaseMiniAppWallet onWalletTypeChange={handleWalletTypeChange} />}
               useHybridMode={useHybridMode}
               onToggleHybridMode={() => setUseHybridMode(!useHybridMode)}
               onTestDatabase={() => {}}
               ultraLowCostMode={ultraLowCostMode}
               onToggleUltraLowCostMode={() => setUltraLowCostMode(!ultraLowCostMode)}
             />
        
        {/* Mode Indicators */}
        <div className="px-2 sm:px-4 py-1 sm:py-2 space-y-1 sm:space-y-2">
          <MiniAppModeIndicator onModeChange={() => {}} />
          {/* Cost Mode Indicator */}
          {ultraLowCostMode && (
            <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium ${
              isDark
                ? 'bg-green-900/30 text-green-300'
                : 'bg-green-100 text-green-700'
            }`}>
              <span className="text-green-500">💰</span>
              <span>Ultra-Low-Cost Mode: $0.00 per message (Database-only)</span>
            </div>
          )}
        </div>
        
        <main className="flex flex-1 overflow-hidden">
          {/* Contact List - Hidden on mobile when conversation is selected */}
          <div className={`${selectedContact ? 'hidden lg:block' : 'block'} w-full lg:w-80`}>
            <ContactList
              contacts={contacts}
              onSelectContact={handleContactSelect}
              selectedContact={selectedContact}
              currentWalletAddress={evmAddress || ''}
              onEditContact={(contact: Contact) => {
                setContactToTag(contact);
                setIsContactTagModalOpen(true);
              }}
              onOpenContactTagModal={(contact: Contact) => {
                setContactToTag(contact);
                setIsContactTagModalOpen(true);
              }}
              totalUnreadCount={totalUnreadCount}
            />
          </div>
          
          {/* Conversation View */}
          <div className={`${selectedContact ? 'block' : 'hidden lg:block'} flex-1 flex flex-col min-w-0`}>
                <BaseMiniAppConversationView
                  conversation={currentConversation}
                  onBack={() => {
                    console.log('Back button clicked, setting selectedContact to null');
                    setSelectedContact(null);
                    setCurrentConversation(null);
                  }}
                  onSendMessage={handleSendToConversation}
                  isSending={isSending}
                  currentWalletAddress={evmAddress || ''}
                />
              
          </div>
        </main>

        <AboutModal isOpen={isAboutModalOpen} onClose={handleCloseAboutModal} />
        <SuccessModal
          isOpen={isSuccessModalOpen}
          onClose={handleCloseSuccessModal}
          message="Message sent successfully!"
          transactionSignature=""
        />
        <NewMessageModal
          isOpen={isNewMessageModalOpen}
          onClose={handleCloseNewMessageModal}
          onSendMessage={handleSendMessage}
          contacts={contacts}
          currentWalletAddress={evmAddress || ''}
        />
        <AddContactModal
          isOpen={isAddContactModalOpen}
          onClose={() => setIsAddContactModalOpen(false)}
          onAddContact={handleAddContact}
        />
        {contactToTag && (
          <ContactTagModal
            isOpen={isContactTagModalOpen}
            onClose={handleCloseContactTagModal}
            contact={contactToTag}
            onSaveTag={handleSaveContactTag}
            onRemoveTag={handleRemoveContactTag}
          />
        )}
        <CaptchaModal
          isOpen={isCaptchaModalOpen}
          onClose={() => setIsCaptchaModalOpen(false)}
          onVerify={handleCaptchaVerify}
        />
      </div>
    </ErrorBoundary>
  );
}

function App() {
  // Global error handler
  React.useEffect(() => {
    const handleError = (event: ErrorEvent): void => {
      console.error('Global error:', event.error);
      event.preventDefault();
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent): void => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ThemeProvider>
      <BaseMiniAppProvider>
        <AppContent />
      </BaseMiniAppProvider>
    </ThemeProvider>
  );
}

export default App;
