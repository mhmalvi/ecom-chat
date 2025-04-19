/**
 * Authentication routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../utils/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to auth routes
router.use(apiLimiter);

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', authMiddleware(), authController.getProfile);

module.exports = router; 