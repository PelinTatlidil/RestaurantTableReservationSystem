const express = require('express');
const {
  createTimeSlot,
  deleteTimeSlot,
  getAvailableTimeSlots,
  getTimeSlots,
  updateTimeSlot,
} = require('../controllers/timeSlotController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  return next();
};

router.get('/available', protect, getAvailableTimeSlots);
router.route('/').get(protect, adminOnly, getTimeSlots).post(protect, adminOnly, createTimeSlot);
router.route('/:id').put(protect, adminOnly, updateTimeSlot).delete(protect, adminOnly, deleteTimeSlot);

module.exports = router;
