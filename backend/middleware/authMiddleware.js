
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * PROXY PATTERN: Authentication Middleware
 * Verifies JWT token and attaches authenticated user to request
 * Acts as gatekeeper for all protected routes
 */
const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

/**
 * PROXY PATTERN: Admin-Only Access Control Middleware
 * Restricts access to admin-only sensitive operations
 * Prevents unauthorized users from accessing admin functionality
 */
const adminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin') {
        return res.status(403).json({ 
            message: 'Admin access required',
            requiredRole: 'admin',
            userRole: req.user.role
        });
    }

    next();
};

/**
 * PROXY PATTERN: Customer-Only Access Control Middleware
 * Restricts access to customer-specific operations
 * Ensures only customers can access customer features
 */
const customerOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== 'customer') {
        return res.status(403).json({ 
            message: 'Customer access required',
            requiredRole: 'customer',
            userRole: req.user.role
        });
    }

    next();
};

/**
 * PROXY PATTERN: Ownership Verification Middleware
 * Ensures customers can only access their own data
 * Acts as a proxy to filter access based on data ownership
 * 
 * @param {string} idParam - The parameter name for the resource ID (e.g., 'id', 'reservationId')
 * @param {Function} getOwnerIdFn - Async function to fetch owner ID from database
 */
const verifyOwnership = (idParam = 'id', getOwnerIdFn) => {
    return async (req, res, next) => {
        try {
            // Admins bypass ownership check
            if (req.user.role === 'admin') {
                return next();
            }

            const resourceId = req.params[idParam];
            
            if (!resourceId) {
                return res.status(400).json({ message: 'Resource ID is required' });
            }

            // Get owner ID for this resource
            const ownerId = await getOwnerIdFn(resourceId);
            
            if (!ownerId) {
                return res.status(404).json({ message: 'Resource not found' });
            }

            // Verify customer owns this resource
            if (ownerId.toString() !== req.user._id.toString()) {
                return res.status(403).json({ 
                    message: 'Access denied: You do not own this resource',
                    resourceId,
                    userId: req.user._id
                });
            }

            // Store owner info for use in controller
            req.resourceOwner = ownerId;
            next();
        } catch (error) {
            res.status(500).json({ message: 'Error verifying ownership', error: error.message });
        }
    };
};

/**
 * PROXY PATTERN: Data Filtering Middleware
 * Filters sensitive fields from response data based on user role
 * Protects financial and personal information
 * 
 * @param {Object} fieldConfig - Configuration of fields to include/exclude by role
 */
const dataAccessProxy = (fieldConfig = {}) => {
    return (req, res, next) => {
        // Store filter config in request for use by controllers
        req.fieldFilter = fieldConfig[req.user?.role] || fieldConfig.default || {};
        next();
    };
};

/**
 * PROXY PATTERN: Field-Level Access Filter
 * Removes sensitive fields from objects based on user role
 * Used to sanitize response data before sending to clients
 */
const filterSensitiveFields = (data, userRole, fieldConfig) => {
    if (!data) return data;
    
    const allowedFields = fieldConfig[userRole] || fieldConfig.default || {};
    const isArray = Array.isArray(data);
    const items = isArray ? data : [data];
    
    const filtered = items.map(item => {
        const filtered = {};
        Object.keys(allowedFields).forEach(field => {
            if (field in item) {
                filtered[field] = item[field];
            }
        });
        return filtered;
    });
    
    return isArray ? filtered : filtered[0];
};

module.exports = { 
    protect,
    adminOnly,
    customerOnly,
    verifyOwnership,
    dataAccessProxy,
    filterSensitiveFields
};
