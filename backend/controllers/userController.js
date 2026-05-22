const mongoose = require('mongoose');
const User = require('../models/User');

const allowedSortFields = ['name', 'email', 'role'];
const allowedRoles = ['customer', 'admin'];

const buildUserSearchQuery = (searchTerm = '') => {
  const normalizedSearch = searchTerm.trim();

  if (!normalizedSearch) {
    return {};
  }

  const searchRegex = new RegExp(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  return {
    $or: [
      { name: searchRegex },
      { email: searchRegex },
      { phone: searchRegex },
      { role: searchRegex },
    ],
  };
};

const getAdminUsers = async (req, res) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
  const sortBy = allowedSortFields.includes(req.query.sortBy) ? req.query.sortBy : 'name';
  const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
  const query = buildUserSearchQuery(req.query.search || '');
  const skip = (page - 1) * limit;

  try {
    const [users, total] = await Promise.all([
      User.find(query)
        .select('name email phone role university address')
        .sort({ [sortBy]: sortOrder, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      users,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      limit,
      sortBy,
      sortOrder: sortOrder === 1 ? 'asc' : 'desc',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to retrieve users' });
  }
};

const getAdminUserDetails = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'User ID is invalid' });
  }

  try {
    const user = await User.findById(req.params.id)
      .select('name email phone role university address')
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to retrieve user details' });
  }
};

const normalizeUserPayload = (body) => ({
  name: body.name ? body.name.trim() : '',
  email: body.email ? body.email.trim().toLowerCase() : '',
  phone: body.phone ? body.phone.trim() : '',
  role: body.role ? body.role.trim() : '',
  university: body.university ? body.university.trim() : '',
  address: body.address ? body.address.trim() : '',
});

const validateUserPayload = ({ name, email, phone, role }) => {
  if (!name) {
    return 'Name is required';
  }

  if (!email) {
    return 'Email is required';
  }

  if (!phone) {
    return 'Phone number is required';
  }

  if (!allowedRoles.includes(role)) {
    return 'User role is invalid';
  }

  return '';
};

const userResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  university: user.university,
  address: user.address,
});

const updateAdminUser = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'User ID is invalid' });
  }

  const payload = normalizeUserPayload(req.body);
  const validationMessage = validateUserPayload(payload);

  if (validationMessage) {
    return res.status(400).json({ message: validationMessage });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const duplicateEmail = await User.findOne({
      _id: { $ne: user._id },
      email: payload.email,
    });

    if (duplicateEmail) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    user.name = payload.name;
    user.email = payload.email;
    user.phone = payload.phone;
    user.role = payload.role;
    user.university = payload.university;
    user.address = payload.address;

    const updatedUser = await user.save();

    return res.status(200).json({
      ...userResponse(updatedUser),
      message: 'User updated successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to update user' });
  }
};

const deleteAdminUser = async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'User ID is invalid' });
  }

  if (String(req.user?._id) === req.params.id || String(req.user?.id) === req.params.id) {
    return res.status(400).json({ message: 'Admins cannot delete their own account' });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.deleteOne();

    return res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to delete user' });
  }
};

module.exports = {
  buildUserSearchQuery,
  deleteAdminUser,
  getAdminUserDetails,
  getAdminUsers,
  updateAdminUser,
};
