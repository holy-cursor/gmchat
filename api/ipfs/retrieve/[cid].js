/**
 * Vercel API Route for IPFS Retrieval
 * Secure backend for IPFS operations
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cid } = req.query;
    
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
}
