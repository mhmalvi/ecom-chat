/**
 * Dashboard routes for admin functionality
 */

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware, roleMiddleware } = require('../utils/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting and authentication to all dashboard routes
router.use(apiLimiter);
router.use(authMiddleware());
router.use(roleMiddleware(['admin', 'store_owner'])); // Only admin or store owner can access dashboard

// Dashboard endpoints
router.get('/stats', dashboardController.getDashboardStats);
router.get('/users', dashboardController.getUsers);

// Settings endpoints
router.get('/settings', dashboardController.getSettings);
router.put('/settings', dashboardController.updateSettings);

module.exports = router; 