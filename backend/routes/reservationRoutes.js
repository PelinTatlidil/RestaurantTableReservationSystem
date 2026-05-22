const express = require('express');
const {
  createAdminReservation,
  deleteAdminReservation,
  getAdminReservations,
  getCustomerReservations,
  recoverAdminReservation,
  updateAdminReservation,
  updateReservationStatus,
} = require('../controllers/reservationController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  return next();
};

router.route('/admin').get(protect, adminOnly, getAdminReservations).post(protect, adminOnly, createAdminReservation);
router.get('/my', protect, getCustomerReservations);
router.patch('/admin/:id/status', protect, adminOnly, updateReservationStatus);
router.patch('/admin/:id/recover', protect, adminOnly, recoverAdminReservation);
router
  .route('/admin/:id')
  .put(protect, adminOnly, updateAdminReservation)
  .delete(protect, adminOnly, deleteAdminReservation);

module.exports = router;
