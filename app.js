const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const OpenAI = require('openai');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

// Apply rate limiting to API endpoints
app.use('/api/', apiLimiter);

// API Key validation middleware
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  
  next();
};

// Store conversation history
const sessions = new Map();

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'API is running' });
});

// Chat endpoint
app.post('/api/chat', validateApiKey, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    
    // Validate required fields
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Initialize conversation history if it doesn't exist
    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, [
        { role: 'system', content: 'You are a helpful customer support assistant for an eCommerce store. Provide friendly, concise responses. If you don\'t know the answer, politely say so.' }
      ]);
    }
    
    // Get current conversation history
    const conversationHistory = sessions.get(sessionId);
    
    // Add user message to conversation history
    conversationHistory.push({ role: 'user', content: message });
    
    // Limit conversation history to last 10 messages to prevent token limit issues
    const limitedHistory = conversationHistory.slice(-10);
    
    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: limitedHistory,
      max_tokens: 300,
      temperature: 0.7,
    });
    
    // Extract the response
    const aiResponse = completion.choices[0].message.content;
    
    // Add AI response to conversation history
    conversationHistory.push({ role: 'assistant', content: aiResponse });
    
    // Update the session
    sessions.set(sessionId, conversationHistory);
    
    // Send response back to client
    res.json({ 
      reply: aiResponse,
      sessionId
    });
    
  } catch (error) {
    console.error('Error processing chat:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request',
      details: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app; // For testing purposes 