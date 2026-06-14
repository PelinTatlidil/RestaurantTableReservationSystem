const User = require('../models/User');

const VALID_ROLES = ['customer', 'admin'];

class UserFactory {
  static async createUser({ name, email, phone, password, role = 'customer' }) {
    const normalizedRole = role && typeof role === 'string' ? role.trim().toLowerCase() : 'customer';

    if (!VALID_ROLES.includes(normalizedRole)) {
      throw new Error(`Invalid user role: ${role}`);
    }

    return User.create({
      name,
      email,
      phone,
      password,
      role: normalizedRole,
    });
  }

  static createCustomer(userData) {
    return UserFactory.createUser({ ...userData, role: 'customer' });
  }

  static createAdmin(userData) {
    return UserFactory.createUser({ ...userData, role: 'admin' });
  }
}

module.exports = UserFactory;
