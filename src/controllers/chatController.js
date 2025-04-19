/**
 * Chat Controller
 * Handles all chat and product-related requests
 */

const { getGPTResponse, clearConversationHistory } = require("../services/openaiService");
const productService = require("../services/productService");
const conversationService = require("../services/conversationService");
const validator = require("../utils/validator");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");

/**
 * Handle chat messages
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function handleChat(req, res) {
  try {
    const { message, sessionId = uuidv4(), source = "woo" } = req.body;
    
    // Validate required fields
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }
    
    // Sanitize input
    const sanitizedMessage = validator.sanitizeString(message);
    
    // Get store from middleware
    const store = req.store;
    
    // Get user ID if authenticated
    const userId = req.user?.id || null;
    
    logger.info("Processing chat request", { 
      sessionId, 
      userId, 
      storeId: store?.id 
    });
    
    // Get response from OpenAI
    const response = await getGPTResponse(
      sanitizedMessage,
      source,
      store,
      sessionId,
      userId
    );
    
    // Return response
    res.json({
      response,
      sessionId
    });
  } catch (error) {
    logger.error("Chat error:", { error: error.message });
    
    res.status(500).json({ 
      error: "Failed to process chat request",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

/**
 * Search products
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function searchProducts(req, res) {
  try {
    const { query, source = "woo" } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: "Search query is required" });
    }
    
    // Get store from middleware
    const store = req.store;
    
    logger.info("Searching products", { 
      query, 
      source, 
      storeId: store?.id 
    });
    
    // Search products
    const products = await productService.searchProducts(
      validator.sanitizeString(query),
      source,
      store
    );
    
    res.json({ products });
  } catch (error) {
    logger.error("Product search error:", { error: error.message });
    
    res.status(500).json({ 
      error: "Failed to search products",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

/**
 * Create an order
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function createOrder(req, res) {
  try {
    const { orderData, source = "woo" } = req.body;
    
    // Validate order data
    const validation = validator.validateOrderData(orderData);
    if (!validation.isValid) {
      return res.status(400).json({ 
        error: "Invalid order data", 
        details: validation.errors 
      });
    }
    
    // Get store from middleware
    const store = req.store;
    
    logger.info("Creating order", { 
      source, 
      storeId: store?.id,
      items: orderData.items.length
    });
    
    // Create order
    const order = await productService.createOrder(
      orderData,
      source,
      store
    );
    
    res.status(201).json({ order });
  } catch (error) {
    logger.error("Order creation error:", { error: error.message });
    
    res.status(500).json({ 
      error: "Failed to create order",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

/**
 * Get order status
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function getOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { source = "woo" } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: "Order ID is required" });
    }
    
    // Get store from middleware
    const store = req.store;
    
    logger.info("Getting order status", { 
      orderId: id, 
      source, 
      storeId: store?.id 
    });
    
    // Get order status
    const status = await productService.getOrderStatus(
      id,
      source,
      store
    );
    
    res.json({ status });
  } catch (error) {
    logger.error("Order status error:", { error: error.message });
    
    res.status(500).json({ 
      error: "Failed to get order status",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

/**
 * Clear chat history
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function clearHistory(req, res) {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }
    
    logger.info("Clearing chat history", { sessionId });
    
    // Clear history
    await clearConversationHistory(sessionId);
    
    res.json({ success: true });
  } catch (error) {
    logger.error("Clear history error:", { error: error.message });
    
    res.status(500).json({ 
      error: "Failed to clear chat history",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

/**
 * Get chat history
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function getHistory(req, res) {
  try {
    const { sessionId } = req.query;
    
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required" });
    }
    
    // Get store from middleware
    const store = req.store;
    
    logger.info("Getting chat history", { 
      sessionId, 
      storeId: store?.id 
    });
    
    // Get history
    const history = await conversationService.getConversationHistory(sessionId);
    
    res.json({ history });
  } catch (error) {
    logger.error("Get history error:", { error: error.message });
    
    res.status(500).json({ 
      error: "Failed to get chat history",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

/**
 * Get chat statistics for dashboard
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function getStats(req, res) {
  try {
    // Authenticated route - get store ID from user
    const storeId = req.user.storeId;
    
    if (!storeId) {
      return res.status(400).json({ error: "Store ID is required" });
    }
    
    logger.info("Getting chat stats", { storeId });
    
    // Get stats from conversation service
    const stats = await conversationService.getConversationStats(storeId);
    
    res.json({ stats });
  } catch (error) {
    logger.error("Get stats error:", { error: error.message });
    
    res.status(500).json({ 
      error: "Failed to get chat statistics",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

module.exports = {
  handleChat,
  searchProducts,
  createOrder,
  getOrderStatus,
  clearHistory,
  getHistory,
  getStats
};
