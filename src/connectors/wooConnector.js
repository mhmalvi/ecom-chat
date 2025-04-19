const axios = require("axios");

/**
 * Builds a WooCommerce API client for a specific store
 * @param {Object} store Store configuration with WooCommerce credentials
 * @returns {Object} Configured axios instance for WooCommerce API
 */
function buildWooClient(store) {
  return axios.create({
    baseURL: `${store.domain}/wp-json/wc/v3`,
    auth: {
      username: store.wooKey,
      password: store.wooSecret
    }
  });
}

/**
 * Fetches products from WooCommerce store
 * @param {Object} store Store configuration
 * @returns {Array} Normalized product data
 */
async function fetchProducts(store) {
  try {
    const client = buildWooClient(store);
    const response = await client.get("/products", {
      params: { per_page: 100 }
    });
    
    // Normalize the data to a consistent format
    return response.data.map(product => ({
      id: product.id.toString(),
      name: product.name,
      price: `$${parseFloat(product.price || 0).toFixed(2)}`,
      category: product.categories?.[0]?.name || 'Uncategorized',
      description: product.description?.replace(/<[^>]*>?/gm, '') || '',
      image: product.images?.[0]?.src || '',
      variants: product.variations?.map(v => ({
        id: v.id.toString(),
        title: v.attributes?.map(a => a.option).join(' - ') || '',
        price: parseFloat(v.price || 0),
        sku: v.sku,
        inventory_quantity: v.stock_quantity
      })) || []
    }));
  } catch (error) {
    console.error('Error fetching WooCommerce products:', error.message);
    throw new Error(`WooCommerce products fetch failed: ${error.message}`);
  }
}

/**
 * Creates an order in WooCommerce
 * @param {Object} orderData Order information
 * @param {Object} store Store configuration
 * @returns {Object} Created order information
 */
async function createOrder(orderData, store) {
  try {
    const client = buildWooClient(store);
    
    // Transform to WooCommerce order format if needed
    const wooOrder = {
      line_items: orderData.items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        variation_id: item.variation_id
      })),
      billing: {
        first_name: orderData.customer.firstName,
        last_name: orderData.customer.lastName,
        email: orderData.customer.email,
        ...orderData.billingAddress
      },
      shipping: orderData.shippingAddress
    };
    
    const response = await client.post("/orders", wooOrder);
    return {
      id: response.data.id.toString(),
      status: response.data.status,
      total: response.data.total,
      items: response.data.line_items.length
    };
  } catch (error) {
    console.error('Error creating WooCommerce order:', error.message);
    throw new Error(`WooCommerce order creation failed: ${error.message}`);
  }
}

/**
 * Gets order status from WooCommerce
 * @param {string} orderId Order ID
 * @param {Object} store Store configuration
 * @returns {Object} Order status information
 */
async function getOrderStatus(orderId, store) {
  try {
    const client = buildWooClient(store);
    const response = await client.get(`/orders/${orderId}`);
    
    return {
      id: response.data.id.toString(),
      status: response.data.status,
      fulfillment_status: response.data.status,
      created_at: response.data.date_created,
      updated_at: response.data.date_modified,
      total: response.data.total
    };
  } catch (error) {
    console.error('Error fetching WooCommerce order status:', error.message);
    throw new Error(`WooCommerce order status fetch failed: ${error.message}`);
  }
}

/**
 * Searches products in WooCommerce
 * @param {string} query Search query
 * @param {Object} store Store configuration
 * @returns {Array} Matching products
 */
async function searchProducts(query, store) {
  try {
    const client = buildWooClient(store);
    const response = await client.get("/products", {
      params: { 
        search: query,
        per_page: 20
      }
    });
    
    // Normalize the data to a consistent format
    return response.data.map(product => ({
      id: product.id.toString(),
      name: product.name,
      price: `$${parseFloat(product.price || 0).toFixed(2)}`,
      category: product.categories?.[0]?.name || 'Uncategorized',
      description: product.description?.replace(/<[^>]*>?/gm, '') || '',
      image: product.images?.[0]?.src || ''
    }));
  } catch (error) {
    console.error('Error searching WooCommerce products:', error.message);
    throw new Error(`WooCommerce product search failed: ${error.message}`);
  }
}

/**
 * Gets a specific product details from WooCommerce
 * @param {string} productId Product ID
 * @param {Object} store Store configuration
 * @returns {Object} Product details
 */
async function getProductDetails(productId, store) {
  try {
    const client = buildWooClient(store);
    const response = await client.get(`/products/${productId}`);
    
    const product = response.data;
    
    // Get variations if available
    let variations = [];
    if (product.variations && product.variations.length > 0) {
      const variationsResponse = await client.get(`/products/${productId}/variations`, {
        params: { per_page: 100 }
      });
      variations = variationsResponse.data;
    }
    
    return {
      id: product.id.toString(),
      name: product.name,
      price: `$${parseFloat(product.price || 0).toFixed(2)}`,
      category: product.categories?.[0]?.name || 'Uncategorized',
      description: product.description?.replace(/<[^>]*>?/gm, '') || '',
      image: product.images?.[0]?.src || '',
      variants: variations.map(v => ({
        id: v.id.toString(),
        title: v.attributes?.map(a => a.option).join(' - ') || '',
        price: parseFloat(v.price || 0),
        sku: v.sku,
        inventory_quantity: v.stock_quantity
      }))
    };
  } catch (error) {
    console.error('Error fetching WooCommerce product details:', error.message);
    throw new Error(`WooCommerce product details fetch failed: ${error.message}`);
  }
}

module.exports = {
  fetchProducts,
  createOrder,
  getOrderStatus,
  searchProducts,
  getProductDetails
};
