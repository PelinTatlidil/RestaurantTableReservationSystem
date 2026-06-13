const mongoose = require('mongoose');

const restaurantInfoSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postcode: { type: String, required: true, trim: true },
  },
  contact: {
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
  },
  openingHours: [{ type: String, required: true, trim: true }],
  bookingPolicy: { type: String, required: true, trim: true },
});

module.exports = mongoose.model('RestaurantInfo', restaurantInfoSchema);
