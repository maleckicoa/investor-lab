#!/bin/bash

# Run FastAPI server using Poetry
echo "🚀 Starting Stock Service API server..."
echo "📍 Server will be available at: http://localhost:8000"
echo "📚 API documentation at: http://localhost:8000/docs"
echo ""

# Run the server using Poetry
poetry run uvicorn src.main:app --host 0.0.0.0 --port 8000 --reload
