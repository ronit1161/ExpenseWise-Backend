const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');

module.exports = async (req, res, next) => {
    try {
        // 1. Get token from authorization header
        let token;
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer')) {
            token = authHeader.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('Access denied. No authentication session found.', 401));
        }

        // 2. Verify token signature
        const decoded = jwt.verify(token, env.JWT_SECRET);

        // 3. Attach user context to request
        req.user = {
            id: decoded.id,
            email: decoded.email
        };

        return next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return next(new AppError('Your session has expired. Please log in again.', 401));
        }
        return next(new AppError('Access denied. Invalid session token.', 401));
    }
};
