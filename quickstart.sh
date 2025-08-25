#!/bin/bash

echo "🚀 Telegram Contact Management Bot - Quick Start"
echo "================================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16+ is required. Current version: $(node -v)"
    echo "   Please upgrade Node.js first."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if .env file exists
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file from template..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ .env file created from env.example"
        echo "⚠️  Please edit .env file with your actual credentials before running the bot"
    else
        echo "❌ env.example file not found. Please create .env file manually."
        exit 1
    fi
else
    echo "✅ .env file already exists"
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo ""
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Dependencies installed successfully"
    else
        echo "❌ Failed to install dependencies"
        exit 1
    fi
else
    echo "✅ Dependencies already installed"
fi

# Run tests
echo ""
echo "🧪 Running tests..."
node test.js
if [ $? -eq 0 ]; then
    echo "✅ All tests passed!"
else
    echo "❌ Some tests failed. Please check the output above."
    exit 1
fi

echo ""
echo "🎉 Quick start completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your Telegram bot token and Google Sheets credentials"
echo "2. Run the bot with: npm start"
echo "3. Test with /start command in Telegram"
echo ""
echo "📖 For detailed setup instructions, see SETUP.md"
echo "🚀 For the SIMPLEST setup (Google Apps Script), see GOOGLE_APPS_SCRIPT_SETUP.md"
echo "🆘 For help, check the troubleshooting section in SETUP.md"
