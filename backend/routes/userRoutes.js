const express = require('express');
const {
  deleteAdminUser,
  getAdminUserDetails,
  getAdminUsers,
  updateAdminUser,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * PROXY PATTERN: User Management Routes
 * All routes restricted to admin-only access
 * Protects sensitive user data (emails, phone numbers, addresses)
 */

// Get all users - PROXY: Admin only access to sensitive user data
router.get('/admin', protect, adminOnly, getAdminUsers);

// Get, update, delete specific user - PROXY: Admin only access to individual user details
router
  .route('/admin/:id')
  .get(protect, adminOnly, getAdminUserDetails)
  .put(protect, adminOnly, updateAdminUser)
  .delete(protect, adminOnly, deleteAdminUser);

module.exports = router;
