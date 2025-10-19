# P2P Messaging Setup Guide

## 🚀 **WebRTC Signaling Server for Peer Discovery**

To enable P2P messaging between browsers, you need to run a local signaling server that helps browsers discover each other.

### **Step 1: Start the Signaling Server**

Open a terminal and run:

```bash
npm run signaling
```

This will start the WebRTC signaling server on `ws://localhost:9002`

### **Step 2: Start the Application**

In another terminal, run:

```bash
npm start
```

### **Step 3: Test P2P Messaging**

1. **Open two browser windows/tabs** to the same URL
2. **Connect your wallet** in both windows
3. **Add a contact** in one window using the other window's wallet address
4. **Send messages** - they should now appear in both windows via P2P!

## 🔧 **How It Works**

### **IPFS + GossipSub + WebRTC Signaling**

1. **Signaling Server**: Helps browsers discover each other
2. **WebRTC**: Direct browser-to-browser connections
3. **GossipSub**: Decentralized message broadcasting
4. **IPFS**: Message persistence and storage

### **Architecture**

```
Browser 1 ←→ Signaling Server ←→ Browser 2
    ↓                              ↓
WebRTC Connection (Direct P2P)
    ↓
GossipSub (Message Broadcasting)
    ↓
IPFS (Message Storage)
```

## 🛠️ **Development Commands**

```bash
# Start signaling server only
npm run signaling

# Start all services (backend + relay + signaling + frontend)
npm run dev

# Start individual services
npm run backend    # Backend API
npm run relay      # WebSocket relay
npm run signaling  # WebRTC signaling server
npm start         # React frontend
```

## 🔍 **Troubleshooting**

### **P2P Not Working?**

1. **Check signaling server**: Make sure `npm run signaling` is running
2. **Check browser console**: Look for connection errors
3. **Check network**: Ensure both browsers can reach `localhost:9002`
4. **Check wallet connection**: Both browsers need connected wallets

### **Common Issues**

- **"Signaling service not available"**: Signaling server not running
- **"Failed to connect to peer"**: Network/firewall issues
- **"No peers discovered"**: Signaling server connection failed

## 🌐 **Production Deployment**

For production, you'll need to:

1. **Deploy signaling server** to a public WebSocket server
2. **Update signaling URL** in `src/services/p2pIntegrationService.ts`
3. **Configure STUN/TURN servers** for NAT traversal

## 📡 **Signaling Server Details**

- **Port**: 9002
- **Protocol**: WebSocket
- **Endpoint**: `ws://localhost:9002/ws`
- **Room**: `gmchat` (all peers join the same room)
- **Features**: Peer discovery, WebRTC signaling, room management

## 🎯 **Next Steps**

1. **Test locally** with multiple browser windows
2. **Deploy signaling server** to production
3. **Configure STUN/TURN servers** for better connectivity
4. **Add mDNS discovery** for local network peers
5. **Implement DHT discovery** for global peer discovery
