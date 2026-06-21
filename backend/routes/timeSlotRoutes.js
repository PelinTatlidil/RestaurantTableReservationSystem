const express = require('express');
const {
  createTimeSlot,
  deleteTimeSlot,
  getAvailableTimeSlots,
  getTimeSlots,
  updateTimeSlot,
} = require('../controllers/timeSlotController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * PROXY PATTERN: Time Slot Management Routes
 * Customer: Can only view available time slots
 * Admin: Can view, create, update, and delete all time slots
 * Protects sensitive availability and pricing data
 */

// Get available time slots - PROXY: Customers can only see available slots
router.get('/available', protect, getAvailableTimeSlots);

// Get all time slots (admin only) - PROXY: Restricts access to full time slot inventory
router.route('/').get(protect, adminOnly, getTimeSlots).post(protect, adminOnly, createTimeSlot);

// Update, delete time slots (admin only) - PROXY: Restricts time slot modifications to admins
router.route('/:id').put(protect, adminOnly, updateTimeSlot).delete(protect, adminOnly, deleteTimeSlot);

module.exports = router;
