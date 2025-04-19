const axios = require("axios");

// ✅ Function to build a WooCommerce API client per store
function buildWooClient(store) {
  return axios.create({
    baseURL: `${store.domain}/wp-json/wc/v3`,
    auth: {
      username: store.wooKey,
      password: store.wooSecret
    }
  });
}

// ✅ Fetch products using the client's config
async function fetchProducts(store) {
  const client = buildWooClient(store);
  const res = await client.get("/products");
  return res.data;
}

// ✅ Create order using store's Woo credentials
async function createOrder(orderData, store) {
  const client = buildWooClient(store);
  const res = await client.post("/orders", orderData);
  return res.data;
}

// ✅ Get order status using store config
async function getOrderStatus(orderId, store) {
  const client = buildWooClient(store);
  const res = await client.get(`/orders/${orderId}`);
  return res.data;
}

module.exports = {
  fetchProducts,
  createOrder,
  getOrderStatus
};
