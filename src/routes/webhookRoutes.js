const express = require("express");
const router = express.Router();

router.post("/shopify", (req, res) => {
  console.log("Shopify Webhook Hit:", req.body);
  res.sendStatus(200);
});

router.post("/woocommerce", (req, res) => {
  console.log("Woo Webhook Hit:", req.body);
  res.sendStatus(200);
});

module.exports = router;
