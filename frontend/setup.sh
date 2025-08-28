#!/bin/bash

echo "🚀 Setting up Index Advisor Frontend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create .env.local from example if it doesn't exist
if [ ! -f .env.local ]; then
    echo "🔧 Creating .env.local from template..."
    cp env.example .env.local
    echo "⚠️  Please update .env.local with your database credentials"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env.local with your database credentials"
echo "2. Ensure your PostgreSQL database is running"
echo "3. Ensure your ETL service has populated the raw.etl_summary table"
echo "4. Run 'npm run dev' to start the development server"
echo "5. Open http://localhost:3000 in your browser"
echo ""
echo "Happy coding! 🚀" 