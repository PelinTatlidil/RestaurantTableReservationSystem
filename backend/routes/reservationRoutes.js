const express = require('express');
const {
  cancelCustomerReservation,
  createAdminReservation,
  checkCustomerReservationAvailability,
  createCustomerReservation,
  deleteAdminReservation,
  getAdminReservations,
  getCustomerReservations,
  recoverAdminReservation,
  updateAdminReservation,
  updateCustomerReservation,
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

const customerOnly = (req, res, next) => {
  if (req.user?.role !== 'customer') {
    return res.status(403).json({ message: 'Customer access required' });
  }

  return next();
};

router.route('/admin').get(protect, adminOnly, getAdminReservations).post(protect, adminOnly, createAdminReservation);
router.get('/availability', protect, customerOnly, checkCustomerReservationAvailability);
router.post('/', protect, customerOnly, createCustomerReservation);
router.get('/my', protect, customerOnly, getCustomerReservations);
router.put('/:id', protect, customerOnly, updateCustomerReservation);
router.patch('/:id/cancel', protect, customerOnly, cancelCustomerReservation);
router.patch('/admin/:id/status', protect, adminOnly, updateReservationStatus);
router.patch('/admin/:id/recover', protect, adminOnly, recoverAdminReservation);
router
  .route('/admin/:id')
  .put(protect, adminOnly, updateAdminReservation)
  .delete(protect, adminOnly, deleteAdminReservation);

module.exports = router;
