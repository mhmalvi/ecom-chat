# AI Chatbot Backend Run and Test Script
Write-Host "`n======================================="
Write-Host "  🤖 AI CHATBOT BACKEND RUN & TEST"
Write-Host "=======================================`n"

# Kill any existing Node.js processes
Write-Host "Checking for existing Node.js processes..."
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "Stopping existing Node.js processes..."
    Stop-Process -Name "node" -Force
    Start-Sleep -Seconds 2
}

# Check if .env file exists
if (-not (Test-Path -Path ".env")) {
    Write-Host "`n🔑 .env file not found. Creating from .env.example..."
    if (Test-Path -Path ".env.example") {
        Copy-Item ".env.example" -Destination ".env"
        Write-Host "✅ .env file created from example."
    } else {
        Write-Host "❌ .env.example not found. Please create .env file manually."
        exit 1
    }
} else {
    Write-Host "`n✅ .env file found."
}

# Get API key from .env
$apiKey = ""
$envContent = Get-Content -Path ".env" -Raw
if ($envContent -match "API_KEY=([^`r`n]+)") {
    $apiKey = $matches[1]
    Write-Host "API key found in .env file."
} else {
    Write-Host "API_KEY not found in .env file."
    exit 1
}

# Start the server in a new process
Write-Host "`n🚀 Starting server using app.js..."
Start-Process -FilePath "node" -ArgumentList "app.js" -NoNewWindow

# Wait for server to start
Write-Host "Waiting for server to start..."
Start-Sleep -Seconds 5

# Prepare test data
$testData = @{
    message = "Hello, can you tell me about the features of this chatbot?"
    sessionId = "test-session-" + (Get-Random)
} | ConvertTo-Json

Write-Host "`n🔄 Testing API endpoint with sample question..."
Write-Host "🔍 Request: 'Hello, can you tell me about the features of this chatbot?'"

# Make API request
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/chat" `
                                  -Method Post `
                                  -Body $testData `
                                  -ContentType "application/json" `
                                  -Headers @{ "x-api-key" = $apiKey }
    
    Write-Host "`n✅ API request successful!"
    Write-Host "`n📝 Response:"
    Write-Host "----------------------------------------"
    Write-Host $response.reply
    Write-Host "----------------------------------------"
    
    Write-Host "`n✨ Test completed successfully!"
}
catch {
    Write-Host "`n❌ API request failed."
    Write-Host "Error: $_"
    Write-Host "`nPossible causes:"
    Write-Host "- The server failed to start"
    Write-Host "- There's an issue with the API key"
    Write-Host "- The API endpoint has changed or is not functioning correctly"
}

# Clean up - stop the Node.js process
Write-Host "`n🧹 Cleaning up - stopping server..."
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

Write-Host "`n======================================="
Write-Host "  🏁 TEST COMPLETED"
Write-Host "=======================================`n" 