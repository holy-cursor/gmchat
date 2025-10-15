# 🔐 GMChat - Secure P2P Messaging App

GMChat is a decentralized, end-to-end encrypted messaging application built with React, WebSocket relay, and IPFS storage. Features enterprise-grade security with ECDH key exchange and zero-knowledge architecture.

## ✨ Features

- 🔐 **End-to-End Encryption**: AES-256-GCM with unique keys per conversation
- 🔑 **Secure Key Exchange**: ECDH P-256 for cryptographic key derivation
- 🌐 **Decentralized Storage**: IPFS for censorship-resistant message storage
- 📡 **P2P Messaging**: WebSocket relay for real-time communication
- 💼 **Wallet Integration**: MetaMask, WalletConnect, Coinbase Wallet
- 🛡️ **Enterprise Security**: API keys protected in backend, no client exposure
- 📱 **Responsive Design**: Works on desktop and mobile devices

## 🚀 Live Demo

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/p2p-messaging-app)

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │    │  Backend API    │    │   IPFS Network  │
│                 │    │                 │    │                 │
│ • ECDH Keys     │◄──►│ • API Protection│◄──►│ • Pinata Gateway│
│ • AES-256-GCM   │    │ • Environment   │    │ • Decentralized │
│ • WebSocket     │    │ • Rate Limiting │    │ • Permanent     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ WebSocket Relay │
│                 │
│ • Real-time     │
│ • P2P Messaging │
│ • Message Queue │
└─────────────────┘
```

## 🔧 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Vercel API Routes
- **Encryption**: Web Crypto API, ECDH, AES-GCM
- **Storage**: IPFS via Pinata
- **Messaging**: WebSocket relay server
- **Wallets**: Wagmi, RainbowKit
- **Deployment**: Vercel

## 🛡️ Security Features

### ✅ **Implemented Security Measures**

1. **API Key Protection**
   - Backend proxy prevents client-side exposure
   - Environment variables secured on server
   - No sensitive data in client code

2. **Cryptographic Security**
   - ECDH P-256 for key exchange
   - AES-256-GCM for message encryption
   - Unique keys per conversation
   - ECDSA signatures for message integrity

3. **Privacy Protection**
   - No metadata stored in IPFS
   - Encrypted content only
   - Sanitized logging
   - Zero-knowledge architecture

4. **Network Security**
   - WebSocket relay for P2P communication
   - CORS protection
   - Rate limiting ready
   - HTTPS enforcement

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+
- npm or yarn
- Git

### **1. Clone Repository**
```bash
git clone https://github.com/YOUR_USERNAME/p2p-messaging-app.git
cd p2p-messaging-app
```

### **2. Install Dependencies**
```bash
npm install
```

### **3. Configure Environment**
```bash
# Copy environment template
cp env.example .env

# Edit .env with your values
REACT_APP_BACKEND_URL=/api
```

### **4. Start Development**
```bash
# Start all services
npm run dev

# Or start individually
npm run backend  # Backend API
npm run relay    # WebSocket relay
npm start        # Frontend app
```

### **5. Open Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- WebSocket Relay: ws://localhost:9001

## 🌐 Deployment

### **Deploy to Vercel**

1. **Fork this repository**
2. **Connect to Vercel**
3. **Set environment variables:**
   ```
   PINATA_API_KEY=your_pinata_api_key
   PINATA_SECRET_KEY=your_pinata_secret_key
   REACT_APP_BACKEND_URL=/api
   ```
4. **Deploy!**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/p2p-messaging-app)

### **Manual Deployment**

```bash
# Build for production
npm run build

# Deploy to your preferred platform
# The build folder contains the static files
```

## 🔑 Environment Variables

### **Required for IPFS (Backend)**
```env
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key
```

### **Optional (Frontend)**
```env
REACT_APP_BACKEND_URL=/api
REACT_APP_ALCHEMY_API_KEY=your_alchemy_key
REACT_APP_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 📱 Usage

1. **Connect Wallet**: Use MetaMask, WalletConnect, or Coinbase Wallet
2. **Add Contacts**: Enter wallet addresses of people you want to message
3. **Send Messages**: Type and send encrypted messages
4. **Real-time**: Messages appear instantly via WebSocket relay
5. **Permanent Storage**: Messages stored on IPFS for offline access

## 🔒 Security Considerations

### **For Production Use:**
- ✅ Use HTTPS for all connections
- ✅ Implement rate limiting
- ✅ Add user authentication if needed
- ✅ Monitor for suspicious activity
- ✅ Regular security audits
- ✅ Key rotation policies

### **Current Security Level:**
- 🟢 **Production Ready**: Enterprise-grade security implemented
- 🟢 **API Protection**: Keys never exposed to client
- 🟢 **Encryption**: Military-grade AES-256-GCM
- 🟢 **Privacy**: Zero-knowledge architecture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [IPFS](https://ipfs.io/) for decentralized storage
- [Pinata](https://pinata.cloud/) for IPFS pinning service
- [Vercel](https://vercel.com/) for deployment platform
- [Wagmi](https://wagmi.sh/) for wallet integration
- [RainbowKit](https://rainbowkit.com/) for wallet UI

## 📞 Support

- 📧 Email: support@yourdomain.com
- 💬 Discord: [Join our community](https://discord.gg/your-server)
- 📖 Documentation: [Read the docs](https://docs.yourdomain.com)
- 🐛 Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/p2p-messaging-app/issues)

---

**Built with ❤️ for a decentralized future** 🌐