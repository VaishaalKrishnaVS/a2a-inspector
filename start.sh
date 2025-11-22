#!/bin/bash

# Start script for A2A Inspector
# Starts both backend and frontend servers

echo "Starting A2A Inspector..."

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "Error: Please run this script from the project root directory"
    exit 1
fi

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend
echo "Starting backend server on http://127.0.0.1:8000"
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start frontend
echo "Starting frontend server..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✓ Backend running on http://127.0.0.1:8000"
echo "✓ Frontend running (check terminal for URL)"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for both processes
wait

