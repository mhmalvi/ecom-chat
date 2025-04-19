require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');
const { Configuration, OpenAIApi } = require('openai');

// Import routes
const chatRoutes = require("./src/routes/chatRoutes");
const debugRoutes = require("./src/routes/debugRoutes");
const webhookRoutes = require("./src/routes/webhookRoutes");
const authRoutes = require("./src/routes/authRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");

// Import middleware
const { apiLimiter, chatLimiter } = require("./src/middleware/rateLimiter");
const { notFoundHandler, errorHandler } = require("./src/middleware/errorHandler");

// Create Express app
const app = express();
const port = process.env.PORT || 8000;

// Set environment
app.set('env', process.env.NODE_ENV || 'development');

// Configure OpenAI
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Session storage (in-memory for demonstration)
// In production, use a database
const sessions = {};

// Middleware
app.use(helmet()); // Security headers
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:3000'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

// Body parsing middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Static assets
app.use(express.static(path.join(__dirname, "public")));

// Apply rate limiting to routes
app.use("/chat", chatLimiter);
app.use("/api", apiLimiter);
app.use("/debug", apiLimiter);
app.use("/webhooks", apiLimiter);

// API Key Authentication Middleware
const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API key' });
  }
  
  next();
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Routes
app.use("/chat", chatRoutes);           // Chat logic
app.use("/debug", debugRoutes);         // Supabase debug
app.use("/webhooks", webhookRoutes);    // Webhooks (optional)
app.use("/auth", authRoutes);           // User authentication
app.use("/dashboard", dashboardRoutes); // Dashboard functionality

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "🚀 AI Chatbot Backend Running",
    environment: app.get('env'),
    version: "1.0.0"
  });
});

// Chat endpoint
app.post('/api/chat', authenticateApiKey, async (req, res) => {
  try {
    const { message, sessionId = uuidv4() } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Get or create session
    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        messages: [
          { role: 'system', content: 'You are a helpful assistant for an e-commerce store.' }
        ],
        createdAt: new Date()
      };
    }
    
    // Add user message to conversation history
    sessions[sessionId].messages.push({ role: 'user', content: message });
    
    // Call OpenAI API
    const completion = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: sessions[sessionId].messages,
      max_tokens: 500,
      temperature: 0.7,
    });
    
    const aiResponse = completion.data.choices[0].message;
    
    // Add AI response to conversation history
    sessions[sessionId].messages.push(aiResponse);
    
    // Clean up old sessions (session expires after 2 hours)
    const now = new Date();
    Object.keys(sessions).forEach(key => {
      const sessionAge = now - new Date(sessions[key].createdAt);
      if (sessionAge > 2 * 60 * 60 * 1000) {
        delete sessions[key];
      }
    });
    
    res.json({
      response: aiResponse.content,
      sessionId
    });
  } catch (error) {
    console.error('Chat API error:', error.response ? error.response.data : error);
    res.status(500).json({ 
      error: 'Failed to process your request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
  console.log(`Environment: ${app.get('env')}`);
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
