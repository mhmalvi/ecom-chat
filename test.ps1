# AI Chatbot Backend Test Script
# This script starts the server and runs the test suite

# Print ASCII art header
Write-Host "`n======================================="
Write-Host "  🤖 AI CHATBOT BACKEND TEST RUNNER"
Write-Host "======================================="
Write-Host "`nThis script will:"
Write-Host "1. Install dependencies (if needed)"
Write-Host "2. Start the server"
Write-Host "3. Run the test script"
Write-Host "4. (Optional) Open the test page in the browser"

# Check if node_modules exists
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "`n📦 Node modules not found. Installing dependencies..."
    npm install
} else {
    Write-Host "`n✅ Node modules found. Skipping installation."
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
if (Test-Path -Path ".env") {
    $envContent = Get-Content -Path ".env" -Raw
    if ($envContent -match "API_KEY=([^`r`n]*)") {
        $apiKey = $matches[1]
        if ($apiKey -eq "your_secure_api_key_here") {
            $randomKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
            Write-Host "`n⚠️ Default API key detected. Generating random key..."
            $envContent = $envContent -replace "API_KEY=your_secure_api_key_here", "API_KEY=$randomKey"
            Set-Content -Path ".env" -Value $envContent
            $apiKey = $randomKey
        }
    }
} else {
    Write-Host "`n❌ Could not read .env file."
    exit 1
}

# Check if servers are already running on the port
$port = 8000
if ($envContent -match "PORT=([0-9]+)") {
    $port = $matches[1]
}

$processesUsingPort = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Where-Object State -eq Listen
if ($processesUsingPort) {
    Write-Host "`n⚠️ Port $port is already in use. Please stop any running servers first."
    $response = Read-Host "Would you like to stop the processes using port $port? (y/n)"
    if ($response -eq "y") {
        foreach ($proc in $processesUsingPort) {
            $process = Get-Process -Id (Get-NetTCPConnection -LocalPort $port | Where-Object State -eq Listen).OwningProcess
            Write-Host "Stopping process: $($process.ProcessName) (PID: $($process.Id))"
            Stop-Process -Id $process.Id -Force
        }
        Write-Host "✅ Processes stopped."
    } else {
        Write-Host "❌ Cannot start server without freeing the port."
        exit 1
    }
}

# Ask if user wants to use test page or console test
$testMode = Read-Host "`nHow would you like to test?`n1. Browser test page`n2. Console test script`nEnter choice (1 or 2)"

if ($testMode -eq "1") {
    # Start server
    Write-Host "`n🚀 Starting server..."
    Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow
    
    # Wait for server to start
    Write-Host "`n⏳ Waiting for server to start..."
    Start-Sleep -Seconds 5
    
    # Open browser to test page
    Write-Host "`n🌐 Opening test page in browser..."
    Start-Process "http://localhost:$port/test.html"
    
    Write-Host "`n✅ Server started and test page opened. Press Ctrl+C when you're done testing."
    
    try {
        # Keep the script running
        while ($true) {
            Start-Sleep -Seconds 1
        }
    } finally {
        # Stop the server gracefully
        Write-Host "`n🛑 Stopping server..."
        Get-Process -Name "node" | Where-Object { $_.CommandLine -match "server.js" } | Stop-Process -Force
    }
} elseif ($testMode -eq "2") {
    # Start server in background
    Write-Host "`n🚀 Starting server in background..."
    $serverProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru
    
    # Wait for server to start
    Write-Host "`n⏳ Waiting for server to start..."
    Start-Sleep -Seconds 5
    
    # Run test script
    Write-Host "`n🧪 Running test script..."
    node test-api.js
    
    # Stop the server
    Write-Host "`n🛑 Stopping server..."
    Stop-Process -Id $serverProcess.Id -Force
} else {
    Write-Host "`n❌ Invalid choice."
    exit 1
}

Write-Host "`n✅ Test completed." 