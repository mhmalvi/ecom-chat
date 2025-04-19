# AI Chatbot Backend Run and Test Script
Write-Host "======================================="
Write-Host "  AI CHATBOT BACKEND RUN & TEST"
Write-Host "======================================="

# Check if app.js file exists
if (-not (Test-Path -Path "app.js")) {
    Write-Host "app.js file not found. Looking for alternative server files..."
    $serverFiles = @("server.js", "index.js", "main.js")
    $serverFile = $null
    
    foreach ($file in $serverFiles) {
        if (Test-Path -Path $file) {
            $serverFile = $file
            Write-Host "Found alternative server file: $serverFile"
            break
        }
    }
    
    if (-not $serverFile) {
        Write-Host "No server files found. Exiting."
        exit 1
    }
} else {
    $serverFile = "app.js"
    Write-Host "app.js file found."
}

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
    Write-Host ".env file not found. Creating from .env.example..."
    if (Test-Path -Path ".env.example") {
        Copy-Item ".env.example" -Destination ".env"
        Write-Host ".env file created from example."
    } else {
        Write-Host ".env.example not found. Please create .env file manually."
        exit 1
    }
} else {
    Write-Host ".env file found."
}

# Get API key from .env
$apiKey = ""
$envContent = Get-Content -Path ".env" -Raw
if ($envContent -match "API_KEY=([^`r`n]+)") {
    $apiKey = $matches[1]
    Write-Host "API key found in .env file: $($apiKey.Substring(0, 4))****"
} else {
    Write-Host "API_KEY not found in .env file."
    exit 1
}

# Get port from .env
$port = 3000
if ($envContent -match "PORT=([0-9]+)") {
    $port = $matches[1]
    Write-Host "Port found in .env file: $port"
} else {
    Write-Host "Using default port: $port"
}

# Start the server in a new process
Write-Host "Starting server using $serverFile..."
Start-Process -FilePath "node" -ArgumentList $serverFile -NoNewWindow -PassThru -OutVariable nodeProcess

# Wait for server to start
Write-Host "Waiting for server to start..."
Start-Sleep -Seconds 5

# Check if server is running
$serverRunning = $false
try {
    $healthCheck = Invoke-RestMethod -Uri "http://localhost:$port" -Method Get -TimeoutSec 2
    Write-Host "Server is running: $($healthCheck.status)"
    $serverRunning = $true
} 
catch [System.Net.WebException] {
    Write-Host "Warning: Health check failed. Server might not be running correctly."
    Write-Host "Detailed error: $($_.Exception.Message)"
    
    # Try to see if the process is still running
    $isRunning = Get-Process -Id $nodeProcess.Id -ErrorAction SilentlyContinue
    if ($isRunning) {
        Write-Host "Node.js process is still running (PID: $($nodeProcess.Id))"
        $serverRunning = $true
    } else {
        Write-Host "Node.js process is not running."
    }
}

if ($serverRunning) {
    # Prepare test data
    $testData = @{
        message = "Hello, can you tell me about the features of this chatbot?"
        sessionId = "test-session-" + (Get-Random)
    } | ConvertTo-Json

    Write-Host "Testing API endpoint with sample question..."

    # Make API request
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:$port/api/chat" `
                                    -Method Post `
                                    -Body $testData `
                                    -ContentType "application/json" `
                                    -Headers @{ "x-api-key" = $apiKey }
        
        Write-Host "API request successful!"
        Write-Host "Response:"
        Write-Host "----------------------------------------"
        Write-Host $response.reply
        Write-Host "----------------------------------------"
        
        Write-Host "Test completed successfully!"
    }
    catch {
        Write-Host "API request failed."
        Write-Host "Error: $_"
        Write-Host "Possible causes:"
        Write-Host "- The server API endpoint is different than expected"
        Write-Host "- There's an issue with the API key"
        Write-Host "- The server is not fully initialized"
        
        Write-Host "Trying to access server directly to see if it's running..."
        try {
            $rootResponse = Invoke-RestMethod -Uri "http://localhost:$port" -Method Get -TimeoutSec 2
            Write-Host "Server root endpoint is accessible. Response: $rootResponse"
        } catch {
            Write-Host "Server root endpoint is not accessible."
        }
    }
} else {
    Write-Host "Server failed to start properly. Skipping API test."
}

# Clean up - stop the Node.js process
Write-Host "Cleaning up - stopping server..."
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

Write-Host "======================================="
Write-Host "  TEST COMPLETED"
Write-Host "=======================================" 