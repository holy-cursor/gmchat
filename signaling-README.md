# GMChat Signaling Server

WebRTC signaling server for GMChat P2P messaging.

## Deploy to Railway

1. Connect this repository to Railway
2. Railway will automatically detect it's a Node.js app
3. Deploy!

## Environment Variables

Railway automatically sets:
- `PORT` - The port the server runs on

## Testing

Test the WebSocket connection:
```bash
wscat -c wss://your-railway-url.com/ws?room=test&peer=test-peer
```

## Usage

The signaling server handles WebRTC peer discovery and connection negotiation for GMChat's P2P messaging system.

### WebSocket Endpoint

```
wss://your-railway-url.com/ws?room=gmchat&peer=YOUR_PEER_ID
```

### Message Types

- `announce` - Announce peer information (wallet address, multiaddrs)
- `peer-discovered` - Notify about new peer
- `peers-updated` - Send updated peer list
- `peer-left` - Notify about peer disconnection
