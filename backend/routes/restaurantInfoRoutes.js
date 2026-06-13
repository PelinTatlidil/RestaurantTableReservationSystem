const express = require('express');
const { getRestaurantInfo, updateRestaurantInfo } = require('../controllers/restaurantInfoController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  return next();
};

router.get('/', getRestaurantInfo);
router.put('/', protect, adminOnly, updateRestaurantInfo);

module.exports = router;
