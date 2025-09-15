import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Keypair, Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Header from './components/Header';
import AboutModal from './components/AboutModal';
import SuccessModal from './components/SuccessModal';
import ErrorBoundary from './components/ErrorBoundary';
import { Message, Contact, Conversation, Group } from './types';
// Removed NFT service import - using direct SOL transfers
import { MessageStorageService, StoredMessage } from './services/messageStorage';
import SecurityService from './services/securityService';
import EncryptionService from './services/encryptionService';
import ContactList from './components/ContactList';
import ConversationView from './components/ConversationView';
import NewMessageModal from './components/NewMessageModal';
import ContactTagModal from './components/ContactTagModal';
import CreateGroupModal from './components/CreateGroupModal';
import GroupMembersModal from './components/GroupMembersModal';
import CaptchaModal from './components/CaptchaModal';

function AppContent() {
  const { connected, publicKey, signTransaction } = useWallet();
  const { isDark } = useTheme();
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isNewMessageModalOpen, setIsNewMessageModalOpen] = useState(false);
  const [isContactTagModalOpen, setIsContactTagModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [successData, setSuccessData] = useState<{
    transactionSignature: string;
    recipientAddress: string;
    messageContent: string;
  } | null>(null);
  
  // Message composer state
  const [recipientAddress, setRecipientAddress] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [lastTransactionTime, setLastTransactionTime] = useState(0);
  
  // Contact-based state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [isGroupMembersModalOpen, setIsGroupMembersModalOpen] = useState(false);
  const [isCaptchaModalOpen, setIsCaptchaModalOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<{ content: string; recipient: string } | null>(null);

  // Load contacts and groups for the connected wallet
  const loadContacts = useCallback(async () => {
    if (!publicKey) {
      setContacts([]);
      setGroups([]);
      setCurrentConversation(null);
      setTotalUnreadCount(0);
      return;
    }

    setIsLoadingContacts(true);
    try {
      const walletAddress = publicKey.toString();
      const contactsList = MessageStorageService.getContacts(walletAddress);
      const groupsList = MessageStorageService.getGroupsForWallet(walletAddress);
      const unreadCount = MessageStorageService.getTotalUnreadCount(walletAddress);
      
      setContacts(contactsList);
      setGroups(groupsList);
      setTotalUnreadCount(unreadCount);
      
      // If there's a selected contact, reload the conversation
      if (selectedContact) {
        const conversation = MessageStorageService.getConversation(walletAddress, selectedContact.address);
        setCurrentConversation(conversation);
      }
      
      console.log(`Loaded ${contactsList.length} contacts and ${groupsList.length} groups with ${unreadCount} unread messages`);
    } catch (error) {
      console.error('Error loading contacts and groups:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  }, [publicKey, selectedContact]);

  // Load contacts when wallet connects/disconnects
  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  // Handle contact selection
  const handleContactSelect = useCallback((contact: Contact) => {
    if (!publicKey) return;
    
    setSelectedContact(contact);
    setSelectedGroup(null); // Clear group selection
    
    // Load conversation for the current wallet (either as sender or recipient)
    const conversation = MessageStorageService.getConversation(publicKey.toString(), contact.address);
    setCurrentConversation(conversation);
    
    // Mark conversation as read
    if (conversation) {
      MessageStorageService.markConversationAsRead(publicKey.toString(), contact.address);
      // Reload contacts to update unread counts
      loadContacts();
    }
  }, [publicKey, loadContacts]);

  // Handle group selection
  const handleGroupSelect = useCallback((group: Group) => {
    if (!publicKey) return;
    
    setSelectedGroup(group);
    setSelectedContact(null); // Clear contact selection
    
    // Load group conversation using the proper method
    const conversation = MessageStorageService.getGroupConversation(publicKey.toString(), group.id);
    setCurrentConversation(conversation);
    
    // Mark group conversation as read
    if (conversation) {
      MessageStorageService.markGroupConversationAsRead(publicKey.toString(), group.id);
      // Reload contacts to update unread counts
      loadContacts();
    }
  }, [publicKey, loadContacts]);

  // Handle creating a new group
  const handleCreateGroup = useCallback(async (groupData: { name: string; description: string; members: string[] }) => {
    if (!publicKey) return;
    
    setIsCreatingGroup(true);
    try {
      // Include the creator in the group members
      const allMembers = [publicKey.toString(), ...groupData.members];
      
      const group = MessageStorageService.storeGroup({
        ...groupData,
        members: allMembers,
        createdBy: publicKey.toString(),
      });
      
      // Reload groups
      await loadContacts();
      
      // Select the new group
      handleGroupSelect(group);
      
      console.log('Group created:', group);
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsCreatingGroup(false);
    }
  }, [publicKey, loadContacts, handleGroupSelect]);

  // Handle editing group
  const handleEditGroup = useCallback((group: Group) => {
    setEditingGroup(group);
    // TODO: Open group edit modal
  }, []);

  // Handle deleting group
  const handleDeleteGroup = useCallback(async (groupId: string) => {
    if (!publicKey) return;
    
    try {
      // Delete the group from storage
      MessageStorageService.deleteGroup(groupId);
      
      // Clear current conversation if it's the deleted group
      if (selectedGroup && selectedGroup.id === groupId) {
        setSelectedGroup(null);
        setCurrentConversation(null);
      }
      
      // Reload contacts and groups
      await loadContacts();
      
      console.log('Group deleted:', groupId);
    } catch (error) {
      console.error('Error deleting group:', error);
      alert('Failed to delete group. Please try again.');
    }
  }, [publicKey, selectedGroup, loadContacts]);

  // Handle opening group members modal
  const handleOpenGroupMembers = useCallback(() => {
    setIsGroupMembersModalOpen(true);
  }, []);

  // Handle closing group members modal
  const handleCloseGroupMembers = useCallback(() => {
    setIsGroupMembersModalOpen(false);
  }, []);

  // Handle sending message to current conversation (contact or group)
  const handleSendToConversation = useCallback(async (content: string) => {
    if (!publicKey) return;
    
    setIsSending(true);
    try {
      if (selectedContact) {
        // Send to individual contact
        await handleSendMessage(content, selectedContact.address);
        
        // Reload the conversation to show the new message
        const updatedConversation = MessageStorageService.getConversation(publicKey.toString(), selectedContact.address);
        setCurrentConversation(updatedConversation);
      } else if (selectedGroup) {
        // Send to group - create group message
        console.log('Sending group message to group wallet:', selectedGroup.groupWallet);
        
        // Do SOL transfer to group wallet
        const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
        const recipientPubkey = new PublicKey(selectedGroup.groupWallet);
        
        const transaction = new Transaction().add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: recipientPubkey,
            lamports: 1000000, // 0.001 SOL
          })
        );

        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = publicKey;

        const signedTransaction = await signTransaction!(transaction);
        const signature = await connection.sendRawTransaction(signedTransaction.serialize());
        
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');
        
        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${confirmation.value.err}`);
        }
        
        // Store the group message (sent to group wallet)
        MessageStorageService.storeMessage({
          sender: publicKey.toString(),
          recipient: selectedGroup.groupWallet,
          content: content,
          messageType: 'text',
          transactionSignature: signature,
        });
        
        // Reload the group conversation
        const updatedConversation = MessageStorageService.getGroupConversation(publicKey.toString(), selectedGroup.id);
        setCurrentConversation(updatedConversation);
      }
      
      // Reload contacts and groups to update last message and unread counts
      await loadContacts();
    } catch (error) {
      console.error('Error sending message to conversation:', error);
      alert(`Failed to send message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  }, [selectedContact, selectedGroup, publicKey]);

  // Removed unused NFT creation function - using direct SOL transfers instead

  // Removed unused message modal functions

  const handleOpenAboutModal = () => {
    setIsAboutModalOpen(true);
  };

  const handleCloseAboutModal = () => {
    setIsAboutModalOpen(false);
  };

  // Handle contact editing
  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setIsContactTagModalOpen(true);
  };

  const handleCloseContactTagModal = () => {
    setIsContactTagModalOpen(false);
    setEditingContact(null);
  };

  const handleSaveContactTag = (address: string, customTag: string) => {
    if (!publicKey) return;
    
    MessageStorageService.setContactTag(publicKey.toString(), address, customTag);
    // Reload contacts to show the updated tag
    loadContacts();
  };

  const handleRemoveContactTag = (address: string) => {
    if (!publicKey) return;
    
    MessageStorageService.removeContactTag(publicKey.toString(), address);
    // Reload contacts to show the updated tag
    loadContacts();
  };

  // Fetch wallet balance when connected
  React.useEffect(() => {
    const fetchBalance = async () => {
      if (connected && publicKey) {
        try {
          const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
          const balance = await connection.getBalance(publicKey);
          setWalletBalance(balance / 1000000000); // Convert to SOL
        } catch (error) {
          console.error('Failed to fetch balance:', error);
          setWalletBalance(null);
        }
      } else {
        setWalletBalance(null);
      }
    };

    fetchBalance();
  }, [connected, publicKey]);

  const handleSendMessage = async (content?: string, recipient?: string) => {
    console.log('handleSendMessage called with:', { content, recipient });
    const finalRecipient = recipient || recipientAddress;
    const finalContent = content || messageContent;
    console.log('Final values:', { finalRecipient, finalContent });
    
    if (!finalRecipient.trim() || !finalContent.trim()) {
      console.log('Missing recipient or content');
      alert('Please fill in both recipient address and message content.');
      return;
    }

    if (!connected || !publicKey) {
      console.log('Wallet not connected');
      alert('Please connect your wallet first to send messages.');
      return;
    }

    // Security validation
    const contentValidation = SecurityService.validateMessageContent(finalContent);
    if (!contentValidation.valid) {
      alert(contentValidation.reason);
      return;
    }

    // Check rate limiting
    const rateLimitCheck = SecurityService.canSendMessage(publicKey.toString());
    if (!rateLimitCheck.allowed) {
      alert(rateLimitCheck.reason);
      return;
    }

    // Check if address is flagged
    if (SecurityService.isAddressFlagged(finalRecipient)) {
      alert('This address has been flagged for suspicious activity');
      return;
    }

    // Simple address validation (basic check for Solana address length)
    if (finalRecipient.length < 32 || finalRecipient.length > 44) {
      console.log('Address length validation failed:', finalRecipient.length);
      alert('Please enter a valid Solana wallet address (must be between 32-44 characters).');
      return;
    }

    // Prevent duplicate submissions
    if (isSending) {
      console.log('Message already being sent, please wait...');
      return;
    }

    // Debounce: prevent rapid clicking (wait at least 2 seconds between transactions)
    const now = Date.now();
    if (now - lastTransactionTime < 2000) {
      console.log('Debounce check failed');
      alert('Please wait a moment before sending another message.');
      return;
    }

    // Show CAPTCHA for security
    setPendingMessage({ content: finalContent, recipient: finalRecipient });
    setIsCaptchaModalOpen(true);
  };

  const handleCaptchaVerify = async (success: boolean) => {
    if (!success || !pendingMessage || !publicKey || !signTransaction) {
      setPendingMessage(null);
      setIsCaptchaModalOpen(false);
      return;
    }

    const { content, recipient } = pendingMessage;
    setPendingMessage(null);
    setIsCaptchaModalOpen(false);

    console.log('Starting encrypted message send process...');
    setIsSending(true);
    setLastTransactionTime(Date.now());
    
    try {
      console.log('Checking wallet balance...');
      // Check wallet balance first
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const balance = await connection.getBalance(publicKey);
      const balanceInSOL = balance / 1000000000; // Convert lamports to SOL
      console.log('Wallet balance:', balanceInSOL, 'SOL');
      
      if (balance < 2000000) { // Need at least 0.002 SOL (for transaction + fees)
        console.log('Insufficient balance');
        alert(`Insufficient balance!\n\nYour balance: ${balanceInSOL.toFixed(6)} SOL\nRequired: 0.002 SOL\n\nPlease get more devnet SOL from: https://faucet.solana.com/`);
        return;
      }
      
      console.log('Validating recipient address:', recipient);
      // Validate recipient address
      try {
        new PublicKey(recipient);
        console.log('Address validation passed');
      } catch (error) {
        console.error('Address validation error:', error);
        console.error('Address being validated:', recipient);
        alert(`Invalid recipient address! Please check the address format.\n\nAddress: ${recipient}\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
      
      // Create a simple SOL transfer
      const recipientPubkey = new PublicKey(recipient);
      
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientPubkey,
          lamports: 1000000, // 0.001 SOL
        })
      );

      // Get fresh blockhash to prevent duplicate transactions
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign and send transaction
      const signedTransaction = await signTransaction!(transaction);
      const signature = await connection.sendRawTransaction(signedTransaction.serialize());
      
      // Wait for confirmation with timeout
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err}`);
      }

      // Store the encrypted message
      MessageStorageService.storeEncryptedMessage({
        sender: publicKey.toString(),
        recipient: recipient,
        content: content,
        messageType: 'text',
        transactionSignature: signature,
      }, publicKey.toString(), recipient);

      // Record the message attempt for rate limiting
      SecurityService.recordMessageAttempt(publicKey.toString());

      // Reload contacts to show the new sent message
      await loadContacts();

      // If we're in a conversation with this recipient, reload the conversation
      if (selectedContact && selectedContact.address === recipient) {
        const updatedConversation = MessageStorageService.getConversation(publicKey.toString(), recipient);
        setCurrentConversation(updatedConversation);
      }

      // Show success modal with transaction details
      setSuccessData({
        transactionSignature: signature,
        recipientAddress: recipient,
        messageContent: content
      });
      setIsSuccessModalOpen(true);
      
      // Clear the form
      setRecipientAddress('');
      setMessageContent('');
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Handle specific Solana errors
      if (error instanceof Error) {
        if (error.message.includes('already been processed') || error.message.includes('already processed')) {
          alert('Transaction already processed. Please wait a moment and try again.');
        } else if (error.message.includes('insufficient funds')) {
          alert('Insufficient SOL balance. Please add more SOL to your wallet.');
        } else if (error.message.includes('User rejected') || error.message.includes('rejected')) {
          alert('Transaction was cancelled by user.');
        } else if (error.message.includes('simulation failed')) {
          alert('Transaction simulation failed. Please check your wallet balance and try again.');
        } else {
          alert(`Failed to send message: ${error.message}`);
        }
      } else {
        alert('Failed to send message: Unknown error');
      }
    } finally {
      setIsSending(false);
    }
  };


  return (
    <ErrorBoundary>
      <div className={`h-screen flex flex-col overflow-hidden ${
        isDark 
          ? 'bg-gray-900' 
          : 'bg-gray-50'
      }`}>
        <Header 
          onOpenAbout={handleOpenAboutModal}
          unreadCount={totalUnreadCount}
          onNewMessage={() => setIsNewMessageModalOpen(true)}
        />
        
        <main className={`flex-1 flex max-w-7xl mx-auto w-full shadow-2xl rounded-t-3xl overflow-hidden ${
          isDark ? 'bg-gray-800' : 'bg-white'
        }`}>
          {/* Contact List - Hidden on mobile when conversation is selected */}
          <div className={`w-full lg:w-80 flex-shrink-0 ${
            currentConversation ? 'hidden lg:flex' : 'flex'
          }`}>
            <ContactList
              contacts={contacts}
              groups={groups}
              selectedContact={selectedContact}
              selectedGroup={selectedGroup}
              onContactSelect={handleContactSelect}
              onGroupSelect={handleGroupSelect}
              onEditContact={handleEditContact}
              onEditGroup={handleEditGroup}
              totalUnreadCount={totalUnreadCount}
              onCreateGroup={() => setIsCreateGroupModalOpen(true)}
            />
          </div>
          
          {/* Conversation View */}
          <div className="flex-1 flex flex-col min-w-0">
            <ConversationView
              conversation={currentConversation}
              onBack={() => {
                console.log('Back button clicked, setting selectedContact to null');
                setSelectedContact(null);
                setSelectedGroup(null);
                setCurrentConversation(null);
              }}
              onSendMessage={handleSendToConversation}
              isSending={isSending}
              currentWalletAddress={publicKey?.toString() || ''}
              onDeleteGroup={handleDeleteGroup}
              onOpenGroupMembers={handleOpenGroupMembers}
            />
          </div>
        </main>


        {isAboutModalOpen && (
          <AboutModal onClose={handleCloseAboutModal} />
        )}

        {/* New Message Modal */}
        <NewMessageModal
          isOpen={isNewMessageModalOpen}
          onClose={() => setIsNewMessageModalOpen(false)}
          onSend={handleSendMessage}
          isSending={isSending}
          walletBalance={walletBalance}
        />

        {/* Contact Tag Modal */}
        <ContactTagModal
          isOpen={isContactTagModalOpen}
          onClose={handleCloseContactTagModal}
          contact={editingContact}
          onSave={handleSaveContactTag}
          onRemove={handleRemoveContactTag}
        />

        {/* Create Group Modal */}
        <CreateGroupModal
          isOpen={isCreateGroupModalOpen}
          onClose={() => setIsCreateGroupModalOpen(false)}
          onCreateGroup={handleCreateGroup}
          isCreating={isCreatingGroup}
        />

        {/* Group Members Modal */}
        <GroupMembersModal
          isOpen={isGroupMembersModalOpen}
          onClose={handleCloseGroupMembers}
          group={selectedGroup}
          currentWalletAddress={publicKey?.toString() || ''}
        />

        {/* Success Modal */}
        {isSuccessModalOpen && successData && (
          <SuccessModal
            isOpen={isSuccessModalOpen}
            onClose={() => {
              console.log('Closing success modal');
              setIsSuccessModalOpen(false);
            }}
            transactionSignature={successData.transactionSignature}
            recipientAddress={successData.recipientAddress}
            messageContent={successData.messageContent}
            isRealMode={true}
          />
        )}

        {/* CAPTCHA Modal */}
        <CaptchaModal
          isOpen={isCaptchaModalOpen}
          onClose={() => {
            setIsCaptchaModalOpen(false);
            setPendingMessage(null);
          }}
          onVerify={handleCaptchaVerify}
        />
        
      </div>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
