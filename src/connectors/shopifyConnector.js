const axios = require("axios");

/**
 * Builds a Shopify API client for a specific store
 * @param {Object} store Store configuration with Shopify credentials
 * @returns {Object} Configured axios instance for Shopify API
 */
function buildShopifyClient(store) {
  return axios.create({
    baseURL: `https://${store.domain}/admin/api/2023-10`,
    headers: {
      'X-Shopify-Access-Token': store.shopifyToken,
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Fetches products from Shopify store
 * @param {Object} store Store configuration
 * @returns {Array} Normalized product data
 */
async function fetchProducts(store) {
  try {
    const client = buildShopifyClient(store);
    const response = await client.get('/products.json');
    
    // Normalize the data to a consistent format
    return response.data.products.map(product => ({
      id: product.id.toString(),
      name: product.title,
      price: `$${parseFloat(product.variants[0]?.price || 0).toFixed(2)}`,
      category: product.product_type || 'Uncategorized',
      description: product.body_html?.replace(/<[^>]*>?/gm, '') || '',
      image: product.image?.src || '',
      variants: product.variants?.map(v => ({
        id: v.id.toString(),
        title: v.title,
        price: parseFloat(v.price),
        sku: v.sku,
        inventory_quantity: v.inventory_quantity
      })) || []
    }));
  } catch (error) {
    console.error('Error fetching Shopify products:', error.message);
    throw new Error(`Shopify products fetch failed: ${error.message}`);
  }
}

/**
 * Creates an order in Shopify
 * @param {Object} orderData Order information
 * @param {Object} store Store configuration
 * @returns {Object} Created order information
 */
async function createOrder(orderData, store) {
  try {
    const client = buildShopifyClient(store);
    
    // Transform to Shopify order format
    const shopifyOrder = {
      order: {
        line_items: orderData.items.map(item => ({
          variant_id: item.variant_id,
          quantity: item.quantity
        })),
        customer: {
          first_name: orderData.customer.firstName,
          last_name: orderData.customer.lastName,
          email: orderData.customer.email
        },
        shipping_address: orderData.shippingAddress,
        financial_status: "pending"
      }
    };
    
    const response = await client.post('/orders.json', shopifyOrder);
    return {
      id: response.data.order.id.toString(),
      status: response.data.order.financial_status,
      total: response.data.order.total_price,
      items: response.data.order.line_items.length
    };
  } catch (error) {
    console.error('Error creating Shopify order:', error.message);
    throw new Error(`Shopify order creation failed: ${error.message}`);
  }
}

/**
 * Gets order status from Shopify
 * @param {string} orderId Order ID
 * @param {Object} store Store configuration
 * @returns {Object} Order status information
 */
async function getOrderStatus(orderId, store) {
  try {
    const client = buildShopifyClient(store);
    const response = await client.get(`/orders/${orderId}.json`);
    
    return {
      id: response.data.order.id.toString(),
      status: response.data.order.financial_status,
      fulfillment_status: response.data.order.fulfillment_status || 'unfulfilled',
      created_at: response.data.order.created_at,
      updated_at: response.data.order.updated_at,
      total: response.data.order.total_price
    };
  } catch (error) {
    console.error('Error fetching Shopify order status:', error.message);
    throw new Error(`Shopify order status fetch failed: ${error.message}`);
  }
}

/**
 * Searches products in Shopify
 * @param {string} query Search query
 * @param {Object} store Store configuration
 * @returns {Array} Matching products
 */
async function searchProducts(query, store) {
  try {
    const client = buildShopifyClient(store);
    const response = await client.get(`/products.json?title=${encodeURIComponent(query)}`);
    
    // Normalize the data to a consistent format
    return response.data.products.map(product => ({
      id: product.id.toString(),
      name: product.title,
      price: `$${parseFloat(product.variants[0]?.price || 0).toFixed(2)}`,
      category: product.product_type || 'Uncategorized',
      description: product.body_html?.replace(/<[^>]*>?/gm, '') || '',
      image: product.image?.src || ''
    }));
  } catch (error) {
    console.error('Error searching Shopify products:', error.message);
    throw new Error(`Shopify product search failed: ${error.message}`);
  }
}

/**
 * Gets a specific product details from Shopify
 * @param {string} productId Product ID
 * @param {Object} store Store configuration
 * @returns {Object} Product details
 */
async function getProductDetails(productId, store) {
  try {
    const client = buildShopifyClient(store);
    const response = await client.get(`/products/${productId}.json`);
    
    const product = response.data.product;
    return {
      id: product.id.toString(),
      name: product.title,
      price: `$${parseFloat(product.variants[0]?.price || 0).toFixed(2)}`,
      category: product.product_type || 'Uncategorized',
      description: product.body_html?.replace(/<[^>]*>?/gm, '') || '',
      image: product.image?.src || '',
      variants: product.variants?.map(v => ({
        id: v.id.toString(),
        title: v.title,
        price: parseFloat(v.price),
        sku: v.sku,
        inventory_quantity: v.inventory_quantity
      })) || []
    };
  } catch (error) {
    console.error('Error fetching Shopify product details:', error.message);
    throw new Error(`Shopify product details fetch failed: ${error.message}`);
  }
}

module.exports = {
  fetchProducts,
  createOrder,
  getOrderStatus,
  searchProducts,
  getProductDetails
};
