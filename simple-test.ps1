# AI Chatbot Backend Simple Test Script
# This script tests the basic functionality of the chatbot API

Write-Host "`n======================================="
Write-Host "  🧪 AI CHATBOT BACKEND TEST SCRIPT"
Write-Host "=======================================`n"

# Check if .env file exists and extract API key
$apiKey = ""
if (Test-Path -Path ".env") {
    Write-Host "✅ .env file found."
    $envContent = Get-Content ".env" -Raw
    if ($envContent -match "API_KEY=([^`r`n]+)") {
        $apiKey = $matches[1]
        if ($apiKey -eq "your_secure_api_key_here") {
            Write-Host "⚠️ Default API key detected. Please update your .env file with a secure key."
            exit 1
        }
    } else {
        Write-Host "❌ API_KEY not found in .env file."
        exit 1
    }
} else {
    Write-Host "❌ .env file not found. Please run quick-start.ps1 first."
    exit 1
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

Write-Host "`n🔄 Testing API endpoint with sample question..."
Write-Host "🔍 Request: 'Hello, can you tell me about the features of this chatbot?'"

# Make API request
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/api/chat" `
                                 -Method Post `
                                 -Body $testData `
                                 -ContentType "application/json" `
                                 -Headers @{ "x-api-key" = $apiKey }
    
    Write-Host "`n✅ API request successful!"
    Write-Host "`n📝 Response:"
    Write-Host "----------------------------------------"
    Write-Host $response.choices[0].message.content
    Write-Host "----------------------------------------"
    
    Write-Host "`n✨ Test completed successfully!"
}
catch {
    Write-Host "`n❌ API request failed."
    Write-Host "Error: $_"
    Write-Host "`nPossible causes:"
    Write-Host "- The server is not running (start it with quick-start.ps1)"
    Write-Host "- There's an issue with the API key"
    Write-Host "- The API endpoint has changed or is not functioning correctly"
}

Write-Host "`n======================================="
Write-Host "  🏁 TEST COMPLETED"
Write-Host "=======================================`n" 