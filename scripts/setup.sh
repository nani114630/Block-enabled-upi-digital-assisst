#!/bin/bash

# UPI Digital Asset System - Setup Script

echo "========================================"
echo "UPI Digital Asset System - Setup"
echo "========================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js found: $(node -v)"

# Check MongoDB
echo ""
echo "📦 Setting up MongoDB..."
if command -v docker &> /dev/null; then
    docker run -d -p 27017:27017 --name upi-mongodb mongo:6.0
    echo "✅ MongoDB started"
else
    echo "⚠️  Docker not found. Please install MongoDB manually."
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install contracts dependencies
echo ""
echo "📦 Installing contracts dependencies..."
cd contracts
npm install
cd ..

echo ""
echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "NEXT STEPS:"
echo "1. Configure environment variables:"
echo "   - Copy .env.example to backend/.env"
echo "   - Copy .env.example to frontend/.env.local"
echo "   - Add your Razorpay test keys"
echo "   - Add your IPFS keys (optional)"
echo ""
echo "2. Start MongoDB:"
echo "   docker-compose up -d"
echo ""
echo "3. Start backend:"
echo "   cd backend && npm run dev"
echo ""
echo "4. Start frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "5. Deploy contract (optional):"
echo "   cd contracts && npm run deploy:mumbai"
echo ""