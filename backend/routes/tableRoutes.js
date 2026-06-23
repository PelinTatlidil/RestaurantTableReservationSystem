const express = require('express');
const {
  createTable,
  deleteTable,
  getTables,
  toggleTableAvailability,
  updateTable,
} = require('../controllers/tableController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * PROXY PATTERN: Table Management Routes
 * All management operations restricted to admin-only access
 * Protects sensitive table configuration and pricing data
 */

// Get all tables (admin only) - PROXY: Restricts access to sensitive table configuration
router.route('/').get(protect, adminOnly, getTables).post(protect, adminOnly, createTable);

// Update, delete table (admin only) - PROXY: Restricts modification of table data
router
  .route('/:id')
  .put(protect, adminOnly, updateTable)
  .delete(protect, adminOnly, deleteTable);

// Toggle table availability (admin only) - PROXY: Restricts table status changes
router.patch('/:id/toggle-availability', protect, adminOnly, toggleTableAvailability);

module.exports = router;
