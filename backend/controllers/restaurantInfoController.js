const RestaurantInfo = require('../models/RestaurantInfo');

const defaultRestaurantInfo = {
  name: 'Digi Meat Restaurant',
  address: {
    street: '123 Food Street',
    city: 'Brisbane',
    state: 'QLD',
    postcode: '4000',
  },
  contact: {
    phone: '0400 123 456',
    email: 'info@restaurant.com',
  },
  openingHours: ['Mon to Fri 11:00 AM to 10:00 PM', 'Sat to Sun 10:00 AM to 11:00 PM'],
  bookingPolicy:
    'Bookings are recommended. Please arrive within 15 minutes of your reservation time. For changes or cancellations, contact the restaurant before your booking.',
};

const getRestaurantInfo = async (req, res) => {
  try {
    const restaurantInfo = await RestaurantInfo.findOne().lean();

    return res.status(200).json(restaurantInfo || defaultRestaurantInfo);
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to retrieve restaurant information',
      error: error.message,
    });
  }
};

module.exports = {
  defaultRestaurantInfo,
  getRestaurantInfo,
};
