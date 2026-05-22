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

const normalizeRestaurantInfo = (body) => ({
  name: body.name ? body.name.trim() : '',
  address: {
    street: body.address?.street ? body.address.street.trim() : '',
    city: body.address?.city ? body.address.city.trim() : '',
    state: body.address?.state ? body.address.state.trim() : '',
    postcode: body.address?.postcode ? body.address.postcode.trim() : '',
  },
  contact: {
    phone: body.contact?.phone ? body.contact.phone.trim() : '',
    email: body.contact?.email ? body.contact.email.trim().toLowerCase() : '',
  },
  openingHours: Array.isArray(body.openingHours)
    ? body.openingHours.map((line) => String(line || '').trim()).filter(Boolean)
    : [],
  bookingPolicy: body.bookingPolicy ? body.bookingPolicy.trim() : '',
});

const validateRestaurantInfo = (restaurantInfo) => {
  if (!restaurantInfo.name) {
    return 'Restaurant name is required';
  }

  if (!restaurantInfo.address.street) {
    return 'Street address is required';
  }

  if (!restaurantInfo.address.city) {
    return 'City is required';
  }

  if (!restaurantInfo.address.state) {
    return 'State is required';
  }

  if (!restaurantInfo.address.postcode) {
    return 'Postcode is required';
  }

  if (!restaurantInfo.contact.phone) {
    return 'Contact phone number is required';
  }

  if (!restaurantInfo.contact.email) {
    return 'Contact email is required';
  }

  if (!restaurantInfo.openingHours.length) {
    return 'At least one opening hours line is required';
  }

  if (!restaurantInfo.bookingPolicy) {
    return 'Booking policy is required';
  }

  return '';
};

const updateRestaurantInfo = async (req, res) => {
  const payload = normalizeRestaurantInfo(req.body);
  const validationMessage = validateRestaurantInfo(payload);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const existingInfo = await RestaurantInfo.findOne();
    const restaurantInfo = existingInfo || new RestaurantInfo();

    Object.assign(restaurantInfo, payload);
    const savedInfo = await restaurantInfo.save();

    return res.status(200).json({
      ...savedInfo.toObject(),
      message: 'Restaurant information updated successfully',
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to update restaurant information',
      error: error.message,
    });
  }
};

module.exports = {
  defaultRestaurantInfo,
  getRestaurantInfo,
  normalizeRestaurantInfo,
  updateRestaurantInfo,
  validateRestaurantInfo,
};
