/**
 * Dashboard Controller
 * Handles admin/dashboard functionality
 */

const userService = require('../services/userService');
const storeService = require('../services/storeService');
const conversationService = require('../services/conversationService');
const logger = require('../utils/logger');

/**
 * Get dashboard statistics
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function getDashboardStats(req, res) {
  try {
    // Get store ID from authenticated user
    const storeId = req.user.storeId;
    
    if (!storeId) {
      return res.status(400).json({ error: "Store ID is required" });
    }
    
    // Get conversation stats
    const conversationStats = await conversationService.getConversationStats(storeId);
    
    // Get store information
    const store = await storeService.getStoreById(storeId);
    
    // Get user count
    const users = await userService.getUsers(1000, 0, storeId);
    const userCount = users.length;
    
    // Get current date for display
    const now = new Date();
    
    res.json({
      conversationStats,
      storeInfo: {
        name: store?.name || 'Unknown Store',
        plan: store?.plan || 'free',
        domain: store?.domain,
        platformType: store?.platform_type
      },
      userCount,
      timestamp: now.toISOString(),
      timeframe: {
        start: new Date(now.setDate(now.getDate() - 30)).toISOString(),
        end: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error("Dashboard stats error:", { error: error.message });
    
    res.status(500).json({ 
      error: "Failed to get dashboard statistics",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

/**
 * Get users associated with a store
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function getUsers(req, res) {
  try {
    const storeId = req.user.storeId;
    
    // Pagination parameters
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const users = await userService.getUsers(limit, offset, storeId);
    
    res.json({ users });
  } catch (error) {
    logger.error("Get users error:", { error: error.message });
    
    res.status(500).json({ 
      error: "Failed to get users",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

/**
 * Get store settings
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function getSettings(req, res) {
  try {
    const storeId = req.user.storeId;
    
    if (!storeId) {
      return res.status(400).json({ error: "Store ID is required" });
    }
    
    const store = await storeService.getStoreById(storeId);
    
    if (!store) {
      return res.status(404).json({ error: "Store not found" });
    }
    
    // Format settings for frontend
    const settings = {
      id: store.id,
      name: store.name,
      domain: store.domain,
      apiKey: store.api_key,
      platformType: store.platform_type,
      platformConnected: store.platform_connected,
      botSettings: {
        botName: store.bot_name,
        welcomeMessage: store.welcome_message,
        botTone: store.bot_tone,
        botLanguage: store.bot_language,
        botActive: store.bot_active
      },
      appearance: {
        primaryColor: store.primary_color,
        logoUrl: store.logo_url,
        theme: store.theme
      },
      // Don't expose sensitive credentials in the response
      credentials: {
        hasWooCredentials: !!store.woo_key && !!store.woo_secret,
        hasShopifyCredentials: !!store.shopify_token
      },
      plan: store.plan,
      maxMessages: store.max_messages,
      timezone: store.timezone
    };
    
    res.json({ settings });
  } catch (error) {
    logger.error("Get settings error:", { error: error.message });
    
    res.status(500).json({ 
      error: "Failed to get store settings",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

/**
 * Update store settings
 * @param {Object} req Express request
 * @param {Object} res Express response
 */
async function updateSettings(req, res) {
  try {
    const storeId = req.user.storeId;
    
    if (!storeId) {
      return res.status(400).json({ error: "Store ID is required" });
    }
    
    // Get current store to check permissions
    const currentStore = await storeService.getStoreById(storeId);
    
    if (!currentStore) {
      return res.status(404).json({ error: "Store not found" });
    }
    
    // Extract store data from request body
    const {
      name, domain, platformType,
      wooKey, wooSecret, shopifyToken,
      botName, welcomeMessage, botTone, botLanguage, botActive,
      primaryColor, logoUrl, theme,
      maxMessages, timezone
    } = req.body;
    
    // Update store
    const updatedStore = await storeService.updateStore(storeId, {
      name,
      domain,
      platformType,
      wooKey,
      wooSecret,
      shopifyToken,
      botName, 
      welcomeMessage,
      botTone,
      botLanguage,
      botActive,
      primaryColor,
      logoUrl,
      theme,
      // Determine if platform is connected based on credentials
      platformConnected: platformType === 'woo' 
        ? !!wooKey && !!wooSecret
        : platformType === 'shopify'
          ? !!shopifyToken
          : false,
      maxMessages,
      timezone
    });
    
    // Format response (don't expose sensitive credentials)
    const settings = {
      id: updatedStore.id,
      name: updatedStore.name,
      domain: updatedStore.domain,
      apiKey: updatedStore.api_key,
      platformType: updatedStore.platform_type,
      platformConnected: updatedStore.platform_connected,
      botSettings: {
        botName: updatedStore.bot_name,
        welcomeMessage: updatedStore.welcome_message,
        botTone: updatedStore.bot_tone,
        botLanguage: updatedStore.bot_language,
        botActive: updatedStore.bot_active
      },
      appearance: {
        primaryColor: updatedStore.primary_color,
        logoUrl: updatedStore.logo_url,
        theme: updatedStore.theme
      },
      credentials: {
        hasWooCredentials: !!updatedStore.woo_key && !!updatedStore.woo_secret,
        hasShopifyCredentials: !!updatedStore.shopify_token
      },
      plan: updatedStore.plan,
      maxMessages: updatedStore.max_messages,
      timezone: updatedStore.timezone
    };
    
    res.json({ 
      settings,
      message: "Settings updated successfully" 
    });
  } catch (error) {
    logger.error("Update settings error:", { error: error.message });
    
    res.status(500).json({ 
      error: "Failed to update store settings",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
}

module.exports = {
  getDashboardStats,
  getUsers,
  getSettings,
  updateSettings
}; 