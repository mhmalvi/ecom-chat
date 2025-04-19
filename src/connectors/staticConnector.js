const path = require('path');
const fs = require('fs').promises;

// Path to static data files
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
let cachedProducts = null;
let cachedOrders = {};

/**
 * Load products from JSON file
 * @returns {Promise<Array>} Product data
 */
async function loadProducts() {
  if (cachedProducts) return cachedProducts;
  
  try {
    const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
    cachedProducts = JSON.parse(data);
    return cachedProducts;
  } catch (error) {
    console.error('Error loading products from static file:', error.message);
    return [];
  }
}

/**
 * Fetches products from static data
 * @returns {Array} Product data
 */
async function fetchProducts() {
  try {
    const products = await loadProducts();
    return products;
  } catch (error) {
    console.error('Error fetching static products:', error.message);
    throw new Error(`Static products fetch failed: ${error.message}`);
  }
}

/**
 * Searches products in static data
 * @param {string} query Search query
 * @returns {Array} Matching products
 */
async function searchProducts(query) {
  try {
    const products = await loadProducts();
    const searchTerms = query.toLowerCase().split(' ');
    
    return products.filter(product => {
      const searchable = `${product.name} ${product.description} ${product.category}`.toLowerCase();
      return searchTerms.every(term => searchable.includes(term));
    });
  } catch (error) {
    console.error('Error searching static products:', error.message);
    throw new Error(`Static product search failed: ${error.message}`);
  }
}

/**
 * Gets product details from static data
 * @param {string} productId Product ID
 * @returns {Object} Product details
 */
async function getProductDetails(productId) {
  try {
    const products = await loadProducts();
    const product = products.find(p => p.id === productId);
    
    if (!product) {
      throw new Error(`Product with ID ${productId} not found`);
    }
    
    return product;
  } catch (error) {
    console.error('Error fetching static product details:', error.message);
    throw new Error(`Static product details fetch failed: ${error.message}`);
  }
}

/**
 * Creates an order in static data
 * @param {Object} orderData Order information
 * @returns {Object} Created order information
 */
async function createOrder(orderData) {
  try {
    const orderId = `static-${Date.now()}`;
    const order = {
      id: orderId,
      status: 'processing',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: orderData.items,
      customer: orderData.customer,
      total: orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)
    };
    
    // Store in memory cache
    cachedOrders[orderId] = order;
    
    return {
      id: order.id,
      status: order.status,
      total: `$${order.total}`,
      items: order.items.length
    };
  } catch (error) {
    console.error('Error creating static order:', error.message);
    throw new Error(`Static order creation failed: ${error.message}`);
  }
}

/**
 * Gets order status from static data
 * @param {string} orderId Order ID
 * @returns {Object} Order status information
 */
async function getOrderStatus(orderId) {
  try {
    const order = cachedOrders[orderId];
    
    if (!order) {
      throw new Error(`Order with ID ${orderId} not found`);
    }
    
    return {
      id: order.id,
      status: order.status,
      fulfillment_status: 'pending',
      created_at: order.created_at,
      updated_at: order.updated_at,
      total: `$${order.total}`
    };
  } catch (error) {
    console.error('Error fetching static order status:', error.message);
    throw new Error(`Static order status fetch failed: ${error.message}`);
  }
}

module.exports = {
  fetchProducts,
  searchProducts,
  getProductDetails,
  createOrder,
  getOrderStatus
}; 