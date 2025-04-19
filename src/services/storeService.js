/**
 * Store service for managing store configurations
 */

const supabase = require('../lib/supabase');
const logger = require('../utils/logger');
const crypto = require('crypto');

/**
 * Find store by API key
 * @param {string} apiKey Store API key
 * @returns {Object|null} Store object or null if not found
 */
async function getStoreByApiKey(apiKey) {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('api_key', apiKey)
      .single();

    if (error) {
      logger.error('Error finding store by API key', { error: error.message });
      return null;
    }
    
    return data;
  } catch (error) {
    logger.error('Unexpected error finding store by API key', { error: error.message });
    return null;
  }
}

/**
 * Find store by ID
 * @param {string} id Store ID
 * @returns {Object|null} Store object or null if not found
 */
async function getStoreById(id) {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.error('Error finding store by ID', { error: error.message });
      return null;
    }
    
    return data;
  } catch (error) {
    logger.error('Unexpected error finding store by ID', { error: error.message });
    return null;
  }
}

/**
 * Find store by domain
 * @param {string} domain Store domain
 * @returns {Object|null} Store object or null if not found
 */
async function findStoreByDomain(domain) {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .eq('domain', domain)
      .single();

    if (error) {
      logger.error('Error finding store by domain', { error: error.message, domain });
      return null;
    }
    
    return data;
  } catch (error) {
    logger.error('Unexpected error finding store by domain', { error: error.message });
    return null;
  }
}

/**
 * Find store by identifier (could be ID, domain, or other identifier)
 * @param {string} identifier Store identifier
 * @returns {Object|null} Store object or null if not found
 */
async function findStoreByIdentifier(identifier) {
  // Try to find by ID first
  let store = await getStoreById(identifier);
  
  // If not found, try by domain
  if (!store) {
    store = await findStoreByDomain(identifier);
  }
  
  // If still not found, try by API key
  if (!store) {
    store = await getStoreByApiKey(identifier);
  }
  
  return store;
}

/**
 * Create a new store
 * @param {Object} storeData Store data
 * @returns {Object} Created store object
 */
async function createStore(storeData) {
  try {
    // Generate a secure API key if not provided
    if (!storeData.api_key) {
      storeData.api_key = generateApiKey();
    }
    
    const { data, error } = await supabase
      .from('stores')
      .insert([{
        name: storeData.name,
        domain: storeData.domain,
        api_key: storeData.api_key,
        platform_type: storeData.platformType || 'woo',
        woo_key: storeData.wooKey,
        woo_secret: storeData.wooSecret,
        shopify_token: storeData.shopifyToken,
        bot_name: storeData.botName || 'AI Assistant',
        welcome_message: storeData.welcomeMessage || 'How can I help you today?',
        bot_tone: storeData.botTone || 'friendly',
        bot_language: storeData.botLanguage || 'en',
        primary_color: storeData.primaryColor || '#4F46E5',
        logo_url: storeData.logoUrl
      }])
      .select()
      .single();
    
    if (error) {
      logger.error('Error creating store', { error: error.message });
      throw new Error(`Failed to create store: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    logger.error('Store creation failed', { error: error.message });
    throw error;
  }
}

/**
 * Update store settings
 * @param {string} id Store ID
 * @param {Object} storeData Updated store data
 * @returns {Object} Updated store object
 */
async function updateStore(id, storeData) {
  try {
    // Remove undefined fields to prevent overwriting with null
    Object.keys(storeData).forEach(key => 
      storeData[key] === undefined && delete storeData[key]
    );
    
    const { data, error } = await supabase
      .from('stores')
      .update({
        name: storeData.name,
        domain: storeData.domain,
        platform_type: storeData.platformType,
        woo_key: storeData.wooKey,
        woo_secret: storeData.wooSecret,
        shopify_token: storeData.shopifyToken,
        bot_name: storeData.botName,
        welcome_message: storeData.welcomeMessage,
        bot_tone: storeData.botTone,
        bot_language: storeData.botLanguage,
        bot_active: storeData.botActive,
        primary_color: storeData.primaryColor,
        logo_url: storeData.logoUrl,
        theme: storeData.theme,
        timezone: storeData.timezone,
        platform_connected: storeData.platformConnected,
        plan: storeData.plan,
        max_messages: storeData.maxMessages
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating store', { error: error.message });
      throw new Error(`Failed to update store: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    logger.error('Store update failed', { error: error.message });
    throw error;
  }
}

/**
 * Generate a secure random API key
 * @returns {string} Secure random API key
 */
function generateApiKey() {
  const bytes = crypto.randomBytes(32);
  return bytes.toString('hex');
}

/**
 * Get all stores (admin function)
 * @param {number} limit Maximum number of stores to return
 * @param {number} offset Pagination offset
 * @returns {Array} List of stores
 */
async function getStores(limit = 100, offset = 0) {
  try {
    const { data, error } = await supabase
      .from('stores')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      logger.error('Error fetching stores', { error: error.message });
      throw new Error(`Failed to fetch stores: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    logger.error('Error in getStores', { error: error.message });
    throw error;
  }
}

module.exports = {
  getStoreByApiKey,
  getStoreById,
  findStoreByDomain,
  findStoreByIdentifier,
  createStore,
  updateStore,
  getStores
};
