const express = require('express');
const {
  cancelCustomerReservation,
  createAdminReservation,
  checkCustomerReservationAvailability,
  createCustomerReservation,
  deleteAdminReservation,
  getAdminReservations,
  getCustomerReservations,
  updateAdminReservation,
  updateCustomerReservation,
  updateReservationStatus,
} = require('../controllers/reservationController');
const { 
  protect, 
  adminOnly, 
  customerOnly,
  verifyOwnership 
} = require('../middleware/authMiddleware');
const Reservation = require('../models/Reservation');

const router = express.Router();

/**
 * PROXY PATTERN: Helper function to get reservation owner
 * Used by verifyOwnership middleware to ensure customers can only access their own reservations
 */
const getReservationOwnerId = async (reservationId) => {
  const reservation = await Reservation.findById(reservationId);
  return reservation ? reservation.customer : null;
};

// Admin routes - Full access to all reservations
router.route('/admin').get(protect, adminOnly, getAdminReservations).post(protect, adminOnly, createAdminReservation);

// Customer availability check - Protected route
router.get('/availability', protect, customerOnly, checkCustomerReservationAvailability);

// Customer create reservation
router.post('/', protect, customerOnly, createCustomerReservation);

// Customer view own reservations
router.get('/my', protect, customerOnly, getCustomerReservations);

// Customer update own reservation - PROXY: Verify customer owns this reservation
router.put(
  '/:id', 
  protect, 
  customerOnly,
  verifyOwnership('id', getReservationOwnerId),
  updateCustomerReservation
);

// Customer cancel own reservation - PROXY: Verify customer owns this reservation
router.patch(
  '/:id/cancel', 
  protect, 
  customerOnly,
  verifyOwnership('id', getReservationOwnerId),
  cancelCustomerReservation
);

// Admin delete reservation
router.delete('/:id', protect, adminOnly, deleteAdminReservation);

// Admin update reservation (status, details)
router.put('/admin/:id', protect, adminOnly, updateAdminReservation);

// Admin update reservation status - PROXY: Restricted to admins only
router.patch(
  '/admin/:id/status', 
  protect, 
  adminOnly, 
  updateReservationStatus
);

module.exports = router;
router
  .route('/admin/:id')
  .put(protect, adminOnly, updateAdminReservation)
  .delete(protect, adminOnly, deleteAdminReservation);

module.exports = router;
