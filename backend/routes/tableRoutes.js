const express = require('express');
const {
  createTable,
  deleteTable,
  getTables,
  toggleTableAvailability,
  updateTable,
} = require('../controllers/tableController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  return next();
};

router.route('/').get(protect, adminOnly, getTables).post(protect, adminOnly, createTable);
router
  .route('/:id')
  .put(protect, adminOnly, updateTable)
  .delete(protect, adminOnly, deleteTable);
router.patch('/:id/toggle-availability', protect, adminOnly, toggleTableAvailability);

module.exports = router;
