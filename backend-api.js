/**
 * Secure Backend API for IPFS Operations
 * Protects API keys from client-side exposure
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Environment variables (set these in your .env file)
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_SECRET_KEY = process.env.PINATA_SECRET_KEY;

if (!PINATA_API_KEY || !PINATA_SECRET_KEY) {
  console.error('❌ Missing Pinata API credentials in environment variables');
  process.exit(1);
}

/**
 * Upload message to IPFS via Pinata
 */
app.post('/api/ipfs/upload', async (req, res) => {
  try {
    const { messageData, metadata } = req.body;
    
    if (!messageData) {
      return res.status(400).json({ error: 'Message data is required' });
    }

    console.log('📤 Uploading to IPFS via Pinata...');
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY
      },
      body: JSON.stringify({
        pinataContent: messageData,
        pinataMetadata: {
          name: `message_${Date.now()}`,
          keyvalues: {
            // Only store non-sensitive metadata
            timestamp: new Date().toISOString(),
            version: '1.0'
          }
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    
    console.log('✅ Message uploaded to IPFS:', result.IpfsHash);
    
    res.json({
      success: true,
      cid: result.IpfsHash,
      size: JSON.stringify(messageData).length,
      pinned: true
    });

  } catch (error) {
    console.error('❌ IPFS upload failed:', error);
    res.status(500).json({ 
      error: 'Failed to upload to IPFS',
      details: error.message 
    });
  }
});

/**
 * Retrieve message from IPFS
 */
app.get('/api/ipfs/retrieve/:cid', async (req, res) => {
  try {
    const { cid } = req.params;
    
    if (!cid) {
      return res.status(400).json({ error: 'CID is required' });
    }

    console.log('📥 Retrieving from IPFS:', cid);
    
    // Use Pinata gateway for retrieval
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    const response = await fetch(gatewayUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to retrieve from IPFS: ${response.status}`);
    }
    
    const messageData = await response.text();
    const message = JSON.parse(messageData);
    
    console.log('✅ Message retrieved from IPFS');
    
    res.json({
      success: true,
      message,
      cid,
      size: messageData.length
    });

  } catch (error) {
    console.error('❌ IPFS retrieval failed:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve from IPFS',
      details: error.message 
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'IPFS Backend API'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Secure Backend API running on port ${PORT}`);
  console.log(`📡 IPFS endpoints available at http://localhost:${PORT}/api/ipfs/`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
