#!/bin/bash

# MIOS Payroll Frontend - Setup Script

echo "🚀 MIOS Payroll Frontend Setup"
echo "=============================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo "✅ npm version: $(npm -v)"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env created (default: http://localhost:8000/api/v1)"
fi

echo ""
echo "=============================="
echo "✅ Setup complete!"
echo ""
echo "To start development server:"
echo "  npm start"
echo ""
echo "To build for production:"
echo "  npm run build"
echo ""
echo "Frontend will run on: http://localhost:3000"
echo "=============================="
