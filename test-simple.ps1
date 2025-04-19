# Simple Test Script for AI Chatbot Backend
Write-Host "Running simple test for AI Chatbot Backend..."

# Check if .env file exists
if (-not (Test-Path -Path ".env")) {
    Write-Host ".env file not found. Please run quick-start.ps1 first."
    exit
}

# Get API key from .env
$apiKey = ""
$envContent = Get-Content -Path ".env" -Raw
if ($envContent -match "API_KEY=([^`r`n]+)") {
    $apiKey = $matches[1]
    Write-Host "API key found in .env file."
} else {
    Write-Host "API_KEY not found in .env file."
    exit
}

# Prepare test data
$testData = @{
    messages = @(
        @{
            role = "user"
            content = "Hello, can you tell me about the features of this chatbot?"
        }
    )
} | ConvertTo-Json

Write-Host "Sending test request to chatbot API..."

# Make API request
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/chat" `
                                  -Method Post `
                                  -Body $testData `
                                  -ContentType "application/json" `
                                  -Headers @{ "x-api-key" = $apiKey }
    
    Write-Host "API request successful!"
    Write-Host "Response:"
    Write-Host "---------------------------------"
    Write-Host $response.choices[0].message.content
    Write-Host "---------------------------------"
    
    Write-Host "Test completed successfully!"
}
catch {
    Write-Host "API request failed."
    Write-Host "Error: $_"
    Write-Host "Possible causes:"
    Write-Host "- The server is not running (start it with quick-start.ps1)"
    Write-Host "- There's an issue with the API key"
    Write-Host "- The API endpoint has changed or is not functioning correctly"
}

Write-Host "Test script completed." 