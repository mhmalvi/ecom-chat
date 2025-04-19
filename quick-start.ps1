# AI Chatbot Backend Quick Start
# This script starts the server in development mode

Write-Host "`n======================================="
Write-Host "  🤖 AI CHATBOT BACKEND QUICK START"
Write-Host "=======================================`n"

# Check if .env file exists
if (-not (Test-Path -Path ".env")) {
    Write-Host "🔑 .env file not found. Creating from .env.example..."
    if (Test-Path -Path ".env.example") {
        Copy-Item ".env.example" -Destination ".env"
        Write-Host "✅ .env file created from example."
    } else {
        Write-Host "❌ .env.example not found. Please create .env file manually."
        exit 1
    }
} else {
    Write-Host "✅ .env file found."
}

# Check if node_modules exists
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "`n📦 Node modules not found. Installing dependencies..."
    npm install
} else {
    Write-Host "`n✅ Node modules found."
}

# Start server
Write-Host "`n🚀 Starting server in development mode..."
Write-Host "📝 The server is now running at http://localhost:8000"
Write-Host "💻 To test the chatbot widget, visit http://localhost:8000/test.html"
Write-Host "🔍 For the API health check, visit http://localhost:8000/debug/health"
Write-Host "`n⏱️  Press Ctrl+C to stop the server when you're done.`n"

npm run dev 