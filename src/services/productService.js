const woo = require("../connectors/wooConnector");
const shopify = require("../connectors/shopifyConnector");

function getConnector(source = "woo") {
  return source === "shopify" ? shopify : woo;
}

async function fetchAllProducts(source) {
  return await getConnector(source).fetchProducts();
}

async function createOrder(orderData, source) {
  return await getConnector(source).createOrder(orderData);
}

async function getOrderStatus(orderId, source) {
  return await getConnector(source).getOrderStatus(orderId);
}

module.exports = {
  fetchAllProducts,
  createOrder,
  getOrderStatus
};
