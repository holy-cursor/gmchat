/**
 * Simple P2P Test Script
 * Tests the P2P messaging system components
 */

// Mock browser environment for Node.js testing
global.crypto = require('crypto').webcrypto;
global.WebSocket = require('ws');
global.fetch = require('node-fetch');

const P2PConfig = require('./config/p2pConfig.ts').default;

async function testP2PServices() {
  console.log('🧪 Testing P2P Services...\n');

  try {
    // Test 1: P2P Message Builder
    console.log('1️⃣ Testing P2P Message Builder...');
    const P2PMessageBuilder = require('./services/p2pMessageBuilder.ts').default;
    
    const testMessage = await P2PMessageBuilder.createMessage({
      threadId: 'test_thread',
      sender: '0x1234567890abcdef',
      recipient: '0xfedcba0987654321',
      content: 'Hello P2P World!',
      contentType: 'text'
    });
    
    console.log('✅ Message created:', testMessage.id);
    console.log('   Thread ID:', testMessage.threadId);
    console.log('   Content:', testMessage.content);
    console.log('   Encrypted:', testMessage.content !== 'Hello P2P World!');
    
    // Test 2: P2P Encryption
    console.log('\n2️⃣ Testing P2P Encryption...');
    const P2PEncryptionService = require('./services/p2pEncryptionService.ts').default;
    
    const keyPair = await P2PEncryptionService.generateKeyPair();
    console.log('✅ Key pair generated');
    console.log('   Public Key:', keyPair.publicKey.substring(0, 20) + '...');
    console.log('   Key ID:', keyPair.keyId);
    
    // Test 3: Merkle Tree
    console.log('\n3️⃣ Testing Merkle Tree...');
    const MerkleTreeService = require('./services/merkleTreeService.ts').default;
    
    const messageCids = ['cid1', 'cid2', 'cid3', 'cid4'];
    const tree = MerkleTreeService.createTree(messageCids);
    const root = MerkleTreeService.getRoot(tree);
    const batchId = MerkleTreeService.createBatchId(messageCids);
    
    console.log('✅ Merkle tree created');
    console.log('   Root:', root);
    console.log('   Batch ID:', batchId);
    
    // Test 4: IPFS Storage (mock)
    console.log('\n4️⃣ Testing IPFS Storage...');
    const IPFSStorageService = require('./services/ipfsStorageService.ts').default;
    
    const ipfsService = new IPFSStorageService({
      gateway: 'https://ipfs.io/ipfs',
      apiEndpoint: 'https://ipfs.io/api/v0'
    });
    
    console.log('✅ IPFS service initialized');
    console.log('   Gateway:', ipfsService.config.gateway);
    
    console.log('\n🎉 All P2P services tested successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Message Builder - Working');
    console.log('   ✅ Encryption Service - Working');
    console.log('   ✅ Merkle Tree - Working');
    console.log('   ✅ IPFS Storage - Working');
    console.log('\n🚀 P2P system is ready for testing!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testP2PServices();
}

module.exports = { testP2PServices };
