#!/bin/bash

echo "🚀 Starting Investor Lab Application..."
echo ""

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $FASTAPI_PID $NEXTJS_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start FastAPI server
echo "📡 Starting FastAPI server..."
cd stock-service
poetry run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload &
FASTAPI_PID=$!
cd ..

# Wait a moment for FastAPI to start
sleep 3

# Start Next.js frontend
echo "🌐 Starting Next.js frontend..."
cd frontend
npm run dev &
NEXTJS_PID=$!
cd ..

echo ""
echo "✅ Services started successfully!"
echo "📍 FastAPI Server: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for background processes
wait
