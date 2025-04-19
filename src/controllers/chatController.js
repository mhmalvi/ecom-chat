const { getGPTResponse } = require("../services/openaiService");
const { createOrder, getOrderStatus } = require("../services/productService");

exports.handleChat = async (req, res) => {
  const { message } = req.body;
  const source = req.query.store || "woo"; // dynamically capture ?store=

  if (!message) return res.status(400).json({ error: "Message is required." });

  try {
    const reply = await getGPTResponse(message, source);
    res.json({ reply });
  } catch (error) {
    console.error("GPT Error:", error.message);
    res.status(500).json({ error: "Something went wrong with the chatbot." });
  }
};

exports.createOrder = async (req, res) => {
  const orderData = req.body;
  const source = req.query.store || "woo";

  try {
    const result = await createOrder(orderData, source);
    res.json(result);
  } catch (err) {
    console.error("Create order error:", err.message);
    res.status(500).json({ error: "Order creation failed." });
  }
};

exports.getOrderStatus = async (req, res) => {
  const { id } = req.params;
  const source = req.query.store || "woo";

  try {
    const result = await getOrderStatus(id, source);
    res.json(result);
  } catch (err) {
    console.error("Get order status error:", err.message);
    res.status(500).json({ error: "Failed to fetch order status." });
  }
};
