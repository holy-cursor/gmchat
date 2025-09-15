#!/bin/bash

# Development startup script for Solana NFT Messaging App

echo "🚀 Starting Solana NFT Messaging App in development mode..."

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from template..."
    cp env.example .env.local
    echo "⚠️  Please update .env.local with your configuration before continuing."
    echo "   Required: REACT_APP_RECAPTCHA_SITE_KEY"
    read -p "Press Enter to continue after updating .env.local..."
fi

# Start the development server
echo "🌐 Starting development server..."
echo "   The app will be available at: http://localhost:3000"
echo "   Press Ctrl+C to stop the server"
echo ""

npm start
