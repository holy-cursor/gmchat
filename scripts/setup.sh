#!/bin/bash

# Solana NFT Messaging App Setup Script

echo "🚀 Setting up Solana NFT Messaging App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "⚠️  Solana CLI is not installed. Installing..."
    sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "⚠️  Anchor CLI is not installed. Installing..."
    npm install -g @coral-xyz/anchor-cli
fi

# Set up Solana for devnet
echo "🔧 Configuring Solana for devnet..."
solana config set --url devnet

# Check Solana balance
echo "💰 Checking Solana balance..."
BALANCE=$(solana balance)
echo "Current balance: $BALANCE"

# If balance is low, offer to airdrop
if [[ $BALANCE == *"0 SOL"* ]]; then
    echo "💸 Balance is low. Requesting airdrop..."
    solana airdrop 2
fi

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp env.example .env.local
    echo "✅ Created .env.local. Please update it with your configuration."
fi

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Run 'npm start' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "For Solana program development:"
echo "1. Run 'anchor build' to build the program"
echo "2. Run 'anchor deploy' to deploy to devnet"
echo ""
echo "Happy coding! 🎉"
