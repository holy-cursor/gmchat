@echo off
echo 🚀 Starting Solana NFT Messaging App in development mode...

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo 📝 Creating .env.local from template...
    copy env.example .env.local
    echo ⚠️  Please update .env.local with your configuration before continuing.
    echo    Required: REACT_APP_RECAPTCHA_SITE_KEY
    pause
)

REM Start the development server
echo 🌐 Starting development server...
echo    The app will be available at: http://localhost:3000
echo    Press Ctrl+C to stop the server
echo.

npm start
