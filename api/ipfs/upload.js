/**
 * Vercel API Route for IPFS Upload
 * Secure backend for IPFS operations
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messageData, metadata } = req.body;
    
    if (!messageData) {
      return res.status(400).json({ error: 'Message data is required' });
    }

    // Get Pinata credentials from environment
    const apiKey = process.env.PINATA_API_KEY;
    const secretKey = process.env.PINATA_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return res.status(500).json({ error: 'IPFS service not configured' });
    }

    console.log('📤 Uploading to IPFS via Pinata...');
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': apiKey,
        'pinata_secret_api_key': secretKey
      },
      body: JSON.stringify({
        pinataContent: messageData,
        pinataMetadata: {
          name: `message_${Date.now()}`,
          keyvalues: {
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
}
