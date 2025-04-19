const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { handleChat } = require("../controllers/chatController");
const { getStoreByApiKey } = require("../services/storeService");

// ✅ Step 3: API key middleware
router.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey) return res.status(401).json({ error: "Missing API Key" });

  const store = getStoreByApiKey(apiKey);
  if (!store) return res.status(401).json({ error: "Invalid API Key" });

  req.store = store; // 🔥 Now every controller has access to store info
  next();
});


router.use(async (req, res, next) => {
    const apiKey = req.headers["x-api-key"];
    if (!apiKey) return res.status(401).json({ error: "API key missing" });
  
    const store = await getStoreByApiKey(apiKey);
    if (!store) return res.status(401).json({ error: "Invalid API key" });
  
    req.store = store;
    next();
  });

// ✅ Protected routes (require valid API key)
router.post("/chat", chatController.handleChat);
router.post("/order", chatController.createOrder);
router.get("/order-status/:id", chatController.getOrderStatus);
router.post("/", handleChat); 

module.exports = router;
