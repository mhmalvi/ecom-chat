#!/bin/bash

# AI Chatbot Backend Test Script
# This script starts the server and runs the test suite

# Print ASCII art header
echo -e "\n======================================="
echo "  🤖 AI CHATBOT BACKEND TEST RUNNER"
echo "======================================="
echo -e "\nThis script will:"
echo "1. Install dependencies (if needed)"
echo "2. Start the server"
echo "3. Run the test script"
echo "4. (Optional) Open the test page in the browser"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "\n📦 Node modules not found. Installing dependencies..."
    npm install
else
    echo -e "\n✅ Node modules found. Skipping installation."
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "\n🔑 .env file not found. Creating from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env file created from example."
    else
        echo "❌ .env.example not found. Please create .env file manually."
        exit 1
    fi
else
    echo -e "\n✅ .env file found."
fi

# Get API key from .env
API_KEY=""
if [ -f ".env" ]; then
    API_KEY=$(grep "API_KEY=" .env | cut -d '=' -f2)
    if [ "$API_KEY" = "your_secure_api_key_here" ]; then
        RANDOM_KEY=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        echo -e "\n⚠️ Default API key detected. Generating random key..."
        sed -i "s/API_KEY=your_secure_api_key_here/API_KEY=$RANDOM_KEY/" .env
        API_KEY=$RANDOM_KEY
    fi
else
    echo -e "\n❌ Could not read .env file."
    exit 1
fi

# Get port from .env or use default
PORT=8000
PORT_ENV=$(grep "PORT=" .env | cut -d '=' -f2)
if [ ! -z "$PORT_ENV" ]; then
    PORT=$PORT_ENV
fi

# Check if servers are already running on the port
PORT_IN_USE=$(lsof -i:$PORT -t)
if [ ! -z "$PORT_IN_USE" ]; then
    echo -e "\n⚠️ Port $PORT is already in use. Please stop any running servers first."
    read -p "Would you like to stop the processes using port $PORT? (y/n) " RESPONSE
    if [ "$RESPONSE" = "y" ]; then
        echo "Stopping processes using port $PORT..."
        kill -9 $PORT_IN_USE
        echo "✅ Processes stopped."
    else
        echo "❌ Cannot start server without freeing the port."
        exit 1
    fi
fi

# Ask if user wants to use test page or console test
echo -e "\nHow would you like to test?"
echo "1. Browser test page"
echo "2. Console test script"
read -p "Enter choice (1 or 2): " TEST_MODE

cleanup() {
    echo -e "\n🛑 Stopping server..."
    pkill -f "node.*server.js" || true
    exit 0
}

# Set up cleanup on script exit
trap cleanup EXIT

if [ "$TEST_MODE" = "1" ]; then
    # Start server
    echo -e "\n🚀 Starting server..."
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to start
    echo -e "\n⏳ Waiting for server to start..."
    sleep 5
    
    # Open browser to test page
    echo -e "\n🌐 Opening test page in browser..."
    if [ "$(uname)" = "Darwin" ]; then
        # macOS
        open "http://localhost:$PORT/test.html"
    elif [ "$(uname)" = "Linux" ]; then
        # Linux
        if command -v xdg-open > /dev/null; then
            xdg-open "http://localhost:$PORT/test.html"
        elif command -v gnome-open > /dev/null; then
            gnome-open "http://localhost:$PORT/test.html"
        else
            echo "⚠️ Could not open browser automatically. Please visit http://localhost:$PORT/test.html"
        fi
    fi
    
    echo -e "\n✅ Server started and test page opened. Press Ctrl+C when you're done testing."
    
    # Wait for server to finish (or Ctrl+C)
    wait $SERVER_PID
    
elif [ "$TEST_MODE" = "2" ]; then
    # Start server in background
    echo -e "\n🚀 Starting server in background..."
    npm run dev &
    SERVER_PID=$!
    
    # Wait for server to start
    echo -e "\n⏳ Waiting for server to start..."
    sleep 5
    
    # Run test script
    echo -e "\n🧪 Running test script..."
    node test-api.js
else
    echo -e "\n❌ Invalid choice."
    exit 1
fi

echo -e "\n✅ Test completed." 