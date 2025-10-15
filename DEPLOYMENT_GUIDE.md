# Deployment Guide - P2P Messaging App

## 🚀 **Deploy to Vercel**

### **Step 1: Prepare for Deployment**

1. **Fix any remaining issues:**
   ```bash
   npm run build
   ```

2. **Test locally:**
   ```bash
   npm start
   ```

### **Step 2: Push to GitHub**

1. **Initialize Git (if not already done):**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Secure P2P messaging app"
   ```

2. **Create GitHub repository:**
   - Go to [GitHub](https://github.com)
   - Click "New repository"
   - Name: `p2p-messaging-app`
   - Make it public
   - Don't initialize with README

3. **Push to GitHub:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/p2p-messaging-app.git
   git branch -M main
   git push -u origin main
   ```

### **Step 3: Deploy to Vercel**

1. **Go to [Vercel](https://vercel.com)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Import your GitHub repository**
5. **Configure environment variables:**
   - `PINATA_API_KEY`: Your Pinata API key
   - `PINATA_SECRET_KEY`: Your Pinata secret key
   - `REACT_APP_BACKEND_URL`: `/api` (for Vercel API routes)

6. **Deploy!**

### **Step 4: Configure Environment Variables**

In Vercel dashboard, go to Settings → Environment Variables:

```
PINATA_API_KEY=4bd8fd505c84d0f6ee2c
PINATA_SECRET_KEY=12509d64fa0a5a5dc7769bbddabec2d106d56b676a266451b8be5ae471af7ef8
REACT_APP_BACKEND_URL=/api
```

### **Step 5: Test Deployment**

1. **Visit your Vercel URL**
2. **Open Developer Tools → Console**
3. **Look for:**
   ```
   ✅ IPFS: Secure backend API initialized successfully
   ✅ IPFS: Backend connection established
   ```

## 🔧 **Troubleshooting**

### **Build Errors:**
```bash
npm run build
```

### **Environment Variables:**
- Make sure all environment variables are set in Vercel
- Check that API keys are correct

### **API Routes:**
- Test: `https://your-app.vercel.app/api/health`
- Should return: `{"status":"healthy"}`

## 📱 **Features After Deployment**

- ✅ **Secure P2P Messaging**: End-to-end encrypted
- ✅ **IPFS Storage**: Decentralized message storage
- ✅ **WebSocket Relay**: Real-time messaging
- ✅ **Wallet Integration**: MetaMask, WalletConnect
- ✅ **Production Ready**: Enterprise-grade security

## 🌐 **Your App Will Be Available At:**

- **Frontend**: `https://your-app.vercel.app`
- **API Health**: `https://your-app.vercel.app/api/health`
- **IPFS Upload**: `https://your-app.vercel.app/api/ipfs/upload`
- **IPFS Retrieve**: `https://your-app.vercel.app/api/ipfs/retrieve/[cid]`

## 🎉 **Success!**

Your secure P2P messaging app is now live and ready for users!
