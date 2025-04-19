const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { getStoreByApiKey } = require("../services/storeService");
const { authMiddleware, roleMiddleware } = require("../utils/auth");
const { chatLimiter } = require("../middleware/rateLimiter");
const logger = require("../utils/logger");

/**
 * API key authentication middleware
 */
router.use(async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) {
    return res.status(401).json({ error: "API key is required" });
  }

  try {
    const store = await getStoreByApiKey(apiKey);
    if (!store) {
      return res.status(401).json({ error: "Invalid API key" });
    }

    req.store = store;
    logger.debug('Store identified by API key', { storeId: store.id });
    next();
  } catch (error) {
    logger.error("Store authentication error:", { error: error.message });
    res.status(500).json({ 
      error: "Authentication failed",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Apply rate limiting to chat endpoints
router.use(chatLimiter);

// Chat endpoints
router.post("/", chatController.handleChat);
router.post("/chat", chatController.handleChat); // Alternative route

// Product endpoints
router.get("/products/search", chatController.searchProducts);

// Order endpoints
router.post("/order", chatController.createOrder);
router.get("/order/:id", chatController.getOrderStatus);

// Session management - public access
router.delete("/history", chatController.clearHistory);
router.get("/history", chatController.getHistory);

// Admin endpoints - require authentication and admin/store_owner role
router.get(
  "/stats",
  authMiddleware(),
  roleMiddleware(['admin', 'store_owner']),
  chatController.getStats
);

module.exports = router;
