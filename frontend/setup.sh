#!/bin/bash

MODE=${1:-local}  # default to 'local' if not provided
echo "🚀 Running setup in '$MODE' mode"

# Move to project root (optional)
cd "$(dirname "$0")" || exit 1

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required."
    exit 1
fi
echo "✅ Node.js $(node -v) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# ENV handling
if [ "$MODE" = "production" ]; then
    echo "🔧 Checking .env.production..."
    if [ ! -f .env.production ]; then
        cp env.production.example .env.production
        echo "⚠️ Please update .env.production with your credentials"
        exit 1
    fi
else
    echo "🔧 Checking .env.local..."
    if [ ! -f .env.local ]; then
        cp env.example .env.local
        echo "⚠️ Please update .env.local with your local credentials"
        exit 1
    fi
fi

# Build or dev
if [ "$MODE" = "production" ]; then
    echo "🏗️ Building production frontend..."
    npm run build
    echo "🔁 Restarting with PM2..."
    pm2 reload next-frontend
    echo "✅ Production setup complete"
else
    echo "💻 Starting dev server..."
    npm run dev
    echo "✅ Dev setup complete"
fi
