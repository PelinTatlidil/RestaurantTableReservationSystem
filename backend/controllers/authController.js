const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};
=======
const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

const normalizeEmail = (email = '') => email.trim().toLowerCase();
>>>>>>> theirs

const registerUser = async (req, res) => {
    const { name, email, phone, password } = req.body;
    try {
        if (!name || !email || !phone || !password) {
            return res.status(400).json({ message: 'Name, email, phone number, and password are required' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) return res.status(400).json({ message: 'Email is already registered' });

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            password,
            role: 'customer',
        });

=======
=======
>>>>>>> theirs
const generateToken = (id, role) => jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
        return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    try {
        const userExists = await User.findOne({ email: normalizedEmail });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const user = await User.create({ name, email: normalizedEmail, password, role: 'customer' });
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
            phone: user.phone,
            role: user.role,
            token: generateToken(user.id, user.role),
            message: 'Registration successful',
=======
            role: user.role,
            token: generateToken(user.id, user.role),
>>>>>>> theirs
=======
            role: user.role,
            token: generateToken(user.id, user.role),
>>>>>>> theirs
=======
            role: user.role,
            token: generateToken(user.id, user.role),
>>>>>>> theirs
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await User.findOne({ email: normalizedEmail });
        if (user && (await bcrypt.compare(password, user.password))) {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
            res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role, token: generateToken(user.id, user.role) });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
            return res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user.id, user.role),
            });
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
        }
        return res.status(401).json({ message: 'Invalid email or password' });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        university: user.university,
        address: user.address,
      });
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            name: user.name,
            email: user.email,
            role: user.role,
            university: user.university,
            address: user.address,
        });
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    } catch (error) {
        return res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const { name, email, phone, university, address } = req.body;
        user.name = name || user.name;
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
        user.email = email || user.email;
        user.phone = phone || user.phone;
=======
        user.email = email ? normalizeEmail(email) : user.email;
>>>>>>> theirs
=======
        user.email = email ? normalizeEmail(email) : user.email;
>>>>>>> theirs
=======
        user.email = email ? normalizeEmail(email) : user.email;
>>>>>>> theirs
        user.university = university || user.university;
        user.address = address || user.address;

        const updatedUser = await user.save();
<<<<<<< ours
<<<<<<< ours
<<<<<<< ours
        res.json({ id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone, role: updatedUser.role, university: updatedUser.university, address: updatedUser.address, token: generateToken(updatedUser.id, updatedUser.role) });
=======
=======
>>>>>>> theirs
=======
>>>>>>> theirs
        return res.json({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            university: updatedUser.university,
            address: updatedUser.address,
            token: generateToken(updatedUser.id, updatedUser.role),
        });
<<<<<<< ours
<<<<<<< ours
>>>>>>> theirs
=======
>>>>>>> theirs
=======
>>>>>>> theirs
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, updateUserProfile, getProfile };
