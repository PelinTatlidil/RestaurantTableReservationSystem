const express = require('express');
const { getRestaurantInfo, updateRestaurantInfo } = require('../controllers/restaurantInfoController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * PROXY PATTERN: Restaurant Information Routes
 * GET: Public access to restaurant info (public data)
 * PUT: Admin-only access to update sensitive restaurant configuration
 * Protects sensitive business data from unauthorized modifications
 */

// Get restaurant info - PROXY: Public read access to non-sensitive data
router.get('/', getRestaurantInfo);

// Update restaurant info - PROXY: Admin-only access to sensitive business data
router.put('/', protect, adminOnly, updateRestaurantInfo);

module.exports = router;
