const express = require('express');
const { getRestaurantInfo } = require('../controllers/restaurantInfoController');

const router = express.Router();

router.get('/', getRestaurantInfo);

module.exports = router;
