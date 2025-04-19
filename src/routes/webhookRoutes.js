/**
 * Webhook routes for e-commerce platform integrations
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const logger = require('../utils/logger');
const storeService = require('../services/storeService');

/**
 * Shopify webhook handler
 * POST /webhooks/shopify
 */
router.post('/shopify', async (req, res) => {
  try {
    // Get the HMAC header from Shopify
    const hmacHeader = req.headers['x-shopify-hmac-sha256'];
    
    if (!hmacHeader) {
      return res.status(401).json({
        error: 'Missing HMAC signature'
      });
    }
    
    // Get request body as raw string
    const body = req.body;
    const shopDomain = req.headers['x-shopify-shop-domain'];
    
    if (!shopDomain) {
      return res.status(400).json({
        error: 'Missing shop domain'
      });
    }
    
    // Find store by domain
    const store = await storeService.findStoreByDomain(shopDomain);
    
    if (!store) {
      return res.status(404).json({
        error: 'Store not found'
      });
    }
    
    // Verify webhook signature
    const isValid = verifyShopifyWebhook(
      JSON.stringify(body),
      hmacHeader,
      store.shopify_webhook_secret
    );
    
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid webhook signature'
      });
    }
    
    // Process the webhook based on type
    const topic = req.headers['x-shopify-topic'];
    
    logger.info('Received Shopify webhook', {
      topic,
      domain: shopDomain
    });
    
    // Handle different webhook types - implement these as needed
    switch (topic) {
      case 'products/create':
      case 'products/update':
        // Process product updates
        // This could trigger a cache refresh or other actions
        break;
        
      case 'orders/create':
        // Process new orders
        break;
        
      default:
        logger.info('Unhandled webhook topic', { topic });
    }
    
    res.status(200).send();
  } catch (error) {
    logger.error('Shopify webhook error:', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * WooCommerce webhook handler
 * POST /webhooks/woocommerce
 */
router.post('/woocommerce', async (req, res) => {
  try {
    // Get WooCommerce signature
    const signature = req.headers['x-wc-webhook-signature'];
    
    if (!signature) {
      return res.status(401).json({
        error: 'Missing webhook signature'
      });
    }
    
    // Get the source (store ID or domain)
    const source = req.query.source;
    
    if (!source) {
      return res.status(400).json({
        error: 'Missing source identifier'
      });
    }
    
    // Find store
    const store = await storeService.findStoreByIdentifier(source);
    
    if (!store) {
      return res.status(404).json({
        error: 'Store not found'
      });
    }
    
    // Verify the signature
    const isValid = verifyWooCommerceWebhook(
      JSON.stringify(req.body),
      signature,
      store.woo_webhook_secret
    );
    
    if (!isValid) {
      return res.status(401).json({
        error: 'Invalid webhook signature'
      });
    }
    
    // Process the webhook based on type
    const topic = req.headers['x-wc-webhook-topic'];
    
    logger.info('Received WooCommerce webhook', {
      topic,
      source
    });
    
    // Handle different webhook types
    switch (topic) {
      case 'product.created':
      case 'product.updated':
        // Process product updates
        break;
        
      case 'order.created':
        // Process new orders
        break;
        
      default:
        logger.info('Unhandled webhook topic', { topic });
    }
    
    res.status(200).send();
  } catch (error) {
    logger.error('WooCommerce webhook error:', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Verify Shopify webhook signature
 * @param {string} body Request body as string
 * @param {string} hmac HMAC signature from Shopify
 * @param {string} secret Webhook secret
 * @returns {boolean} Whether the signature is valid
 */
function verifyShopifyWebhook(body, hmac, secret) {
  const calculated = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
    
  return crypto.timingSafeEqual(
    Buffer.from(calculated),
    Buffer.from(hmac)
  );
}

/**
 * Verify WooCommerce webhook signature
 * @param {string} body Request body as string
 * @param {string} signature Signature from WooCommerce
 * @param {string} secret Webhook secret
 * @returns {boolean} Whether the signature is valid
 */
function verifyWooCommerceWebhook(body, signature, secret) {
  const calculated = crypto
    .createHmac('sha256', secret)
    .update(body, 'utf8')
    .digest('base64');
    
  return crypto.timingSafeEqual(
    Buffer.from(calculated),
    Buffer.from(signature)
  );
}

module.exports = router;
