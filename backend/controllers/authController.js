const User = require('../models/User');
const UserFactory = require('../factories/userFactory');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

const normalizeEmail = (email = '') => {
    return email.trim().toLowerCase();
};

const registerUser = async (req, res) => {
    const { name, email, phone, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !phone || !password) {
        return res.status(400).json({
            message: 'Name, email, phone number, and password are required',
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: 'Password must be at least 6 characters long',
        });
    }

    try {
        const userExists = await User.findOne({ email: normalizedEmail });

        if (userExists) {
            return res.status(400).json({
                message: 'Email is already registered',
            });
        }

        const user = await UserFactory.createCustomer({
            name: name.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            password,
        });

        return res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            token: generateToken(user.id, user.role),
            message: 'Registration successful',
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const checkEmail = async (req, res) => {
    const normalizedEmail = normalizeEmail(req.query.email);

    if (!normalizedEmail) {
        return res.status(400).json({
            message: 'Email is required',
        });
    }

    try {
        const userExists = await User.exists({ email: normalizedEmail });

        return res.status(200).json({
            exists: Boolean(userExists),
            message: userExists ? 'Email address already exists' : 'Email address is available',
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
        return res.status(400).json({
            message: 'Email and password are required',
        });
    }

    try {
        const user = await User.findOne({ email: normalizedEmail });
        if (user && (await bcrypt.compare(password, user.password))) {
            return res.json({
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                token: generateToken(user.id, user.role),
            });
        }

        return res.status(401).json({
            message: 'Invalid email or password',
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        return res.status(200).json({
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            university: user.university,
            address: user.address,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Server error',
            error: error.message,
        });
    }
};

const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }

        const { name, phone } = req.body;
        const normalizedName = name ? name.trim() : '';
        const normalizedPhone = phone ? phone.trim() : '';

        if (!normalizedName || !normalizedPhone) {
            return res.status(400).json({
                message: 'Name and phone number are required',
            });
        }

        user.name = normalizedName;
        user.phone = normalizedPhone;

        const updatedUser = await user.save();
        return res.json({
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            message: 'Profile updated successfully',
            token: generateToken(updatedUser.id, updatedUser.role),
        });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

module.exports = {
    checkEmail,
    registerUser,
    loginUser,
    updateUserProfile,
    getProfile,
};
