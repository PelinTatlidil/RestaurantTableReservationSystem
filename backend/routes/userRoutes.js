const express = require('express');
const {
  deleteAdminUser,
  getAdminUserDetails,
  getAdminUsers,
  updateAdminUser,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  return next();
};

router.get('/admin', protect, adminOnly, getAdminUsers);
router
  .route('/admin/:id')
  .get(protect, adminOnly, getAdminUserDetails)
  .put(protect, adminOnly, updateAdminUser)
  .delete(protect, adminOnly, deleteAdminUser);

module.exports = router;
