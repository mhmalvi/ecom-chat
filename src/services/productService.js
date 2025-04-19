const woo = require("../connectors/wooConnector");
const shopify = require("../connectors/shopifyConnector");
const staticConnector = require("../connectors/staticConnector");

/**
 * Gets the appropriate connector based on source
 * @param {string} source The source identifier (woo, shopify, or static)
 * @returns {Object} The connector instance
 */
function getConnector(source = "woo") {
  switch (source) {
    case "shopify": return shopify;
    case "static": return staticConnector;
    case "woo":
    default: return woo;
  }
}

/**
 * Fetches all products from a source
 * @param {string} source The source identifier
 * @param {Object} store Store configuration
 * @returns {Array} List of products
 */
async function fetchAllProducts(source, store) {
  return await getConnector(source).fetchProducts(store);
}

/**
 * Searches for products in a source
 * @param {string} query Search query
 * @param {string} source The source identifier
 * @param {Object} store Store configuration
 * @returns {Array} List of matching products
 */
async function searchProducts(query, source, store) {
  return await getConnector(source).searchProducts(query, store);
}

/**
 * Gets product details from a source
 * @param {string} productId Product ID
 * @param {string} source The source identifier
 * @param {Object} store Store configuration
 * @returns {Object} Product details
 */
async function getProductDetails(productId, source, store) {
  return await getConnector(source).getProductDetails(productId, store);
}

/**
 * Creates an order in a source
 * @param {Object} orderData Order information
 * @param {string} source The source identifier
 * @param {Object} store Store configuration
 * @returns {Object} Created order information
 */
async function createOrder(orderData, source, store) {
  return await getConnector(source).createOrder(orderData, store);
}

/**
 * Gets order status from a source
 * @param {string} orderId Order ID
 * @param {string} source The source identifier
 * @param {Object} store Store configuration
 * @returns {Object} Order status information
 */
async function getOrderStatus(orderId, source, store) {
  return await getConnector(source).getOrderStatus(orderId, store);
}

module.exports = {
  fetchAllProducts,
  searchProducts,
  getProductDetails,
  createOrder,
  getOrderStatus
};
