/**
 * AI Chatbot API Test Script
 * 
 * This script tests the key endpoints of the AI chatbot backend.
 */

require('dotenv').config();
const fetch = require('node-fetch');
const readline = require('readline');
const { v4: uuidv4 } = require('uuid');

// Configure test settings
const API_KEY = process.env.API_KEY || 'your_secure_api_key_here';
const BASE_URL = `http://localhost:${process.env.PORT || 8000}`;
const SESSION_ID = uuidv4();

// Console interface for interactive testing
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Make a request to the API
 * @param {string} endpoint API endpoint
 * @param {string} method HTTP method
 * @param {Object} body Request body
 * @returns {Promise<Object>} Response data
 */
async function makeRequest(endpoint, method = 'GET', body = null) {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  };
  
  const options = {
    method,
    headers
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  try {
    console.log(`\n🚀 ${method} ${BASE_URL}${endpoint}`);
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${data.error || 'Unknown error'}`);
    }
    
    return { status: response.status, data };
  } catch (error) {
    console.error('\n❌ Request failed:', error.message);
    return { status: 'error', error: error.message };
  }
}

/**
 * Test the health endpoint
 */
async function testHealth() {
  try {
    console.log('\n📋 Testing health endpoint...');
    const { status, data } = await makeRequest('/debug/health');
    
    if (status === 'error') {
      console.error('❌ Health check failed');
      return;
    }
    
    console.log('\n✅ Health check successful:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('\n❌ Health check failed:', error.message);
  }
}

/**
 * Test the chat endpoint
 * @param {string} message User message
 */
async function testChat(message) {
  try {
    console.log(`\n📋 Testing chat endpoint with message: "${message}"`);
    const { status, data } = await makeRequest('/chat', 'POST', {
      message,
      sessionId: SESSION_ID
    });
    
    if (status === 'error') {
      console.error('❌ Chat test failed');
      return;
    }
    
    console.log('\n✅ Chat response:');
    console.log(`🤖 AI: ${data.response}`);
    console.log(`📝 Session ID: ${data.sessionId}`);
  } catch (error) {
    console.error('\n❌ Chat test failed:', error.message);
  }
}

/**
 * Test the product search endpoint
 * @param {string} query Search query
 */
async function testProductSearch(query) {
  try {
    console.log(`\n📋 Testing product search with query: "${query}"`);
    const { status, data } = await makeRequest(`/chat/products/search?query=${encodeURIComponent(query)}`);
    
    if (status === 'error') {
      console.error('❌ Product search test failed');
      return;
    }
    
    console.log('\n✅ Product search results:');
    if (data.products && data.products.length > 0) {
      data.products.forEach((product, index) => {
        console.log(`Product ${index + 1}: ${product.name} - ${product.price}`);
      });
    } else {
      console.log('No products found.');
    }
  } catch (error) {
    console.error('\n❌ Product search test failed:', error.message);
  }
}

/**
 * Interactive chat mode
 */
function startInteractiveChat() {
  console.log('\n🤖 Interactive chat mode started. Type "exit" to quit.');
  promptUser();
}

/**
 * Prompt user for input
 */
function promptUser() {
  rl.question('\n👤 You: ', async (input) => {
    if (input.toLowerCase() === 'exit') {
      console.log('\n👋 Goodbye!');
      rl.close();
      return;
    }
    
    // Send message to API
    const { status, data } = await makeRequest('/chat', 'POST', {
      message: input,
      sessionId: SESSION_ID
    });
    
    if (status === 'error') {
      console.error('❌ Error occurred');
    } else {
      console.log(`\n🤖 AI: ${data.response}`);
    }
    
    // Continue prompting
    promptUser();
  });
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('\n=================================');
  console.log('🧪 AI CHATBOT API TEST SCRIPT');
  console.log('=================================');
  console.log(`🔗 API URL: ${BASE_URL}`);
  console.log(`🔑 Using API Key: ${API_KEY.substring(0, 5)}...`);
  console.log(`📝 Session ID: ${SESSION_ID}`);
  
  // Test health endpoint
  await testHealth();
  
  // Ask the user if they want to run the chat tests
  rl.question('\n📋 Do you want to test the chat API? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      // Ask for a test message
      rl.question('\n👤 Enter a test message: ', async (message) => {
        await testChat(message);
        
        // Test product search
        rl.question('\n📋 Do you want to test product search? (y/n): ', async (searchAnswer) => {
          if (searchAnswer.toLowerCase() === 'y') {
            rl.question('\n🔍 Enter a search query: ', async (query) => {
              await testProductSearch(query);
              
              // Ask if the user wants to start interactive mode
              rl.question('\n📋 Start interactive chat mode? (y/n): ', (interactiveAnswer) => {
                if (interactiveAnswer.toLowerCase() === 'y') {
                  startInteractiveChat();
                } else {
                  console.log('\n✅ All tests completed!');
                  rl.close();
                }
              });
            });
          } else {
            // Ask if the user wants to start interactive mode
            rl.question('\n📋 Start interactive chat mode? (y/n): ', (interactiveAnswer) => {
              if (interactiveAnswer.toLowerCase() === 'y') {
                startInteractiveChat();
              } else {
                console.log('\n✅ All tests completed!');
                rl.close();
              }
            });
          }
        });
      });
    } else {
      console.log('\n✅ Tests completed!');
      rl.close();
    }
  });
}

// Start tests
runTests(); 