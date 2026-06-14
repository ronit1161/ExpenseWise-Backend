const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userRepository = require('../repositories/user.repository');
const env = require('../config/env');
const AppError = require('../utils/AppError');

class AuthService {
    generateAccessToken(user) {
        return jwt.sign(
            { id: user.id, email: user.email },
            env.JWT_SECRET,
            { expiresIn: '15m' }
        );
    }

    generateRefreshToken(user) {
        return jwt.sign(
            { id: user.id, email: user.email },
            env.JWT_REFRESH_SECRET,
            { expiresIn: '7d' }
        );
    }

    async register({ name, email, password }) {
        // 1. Check if email already registered
        const existingUser = await userRepository.findByEmail(email);
        if (existingUser) {
            throw new AppError('Email address is already in use.', 409);
        }

        // 2. Hash password
        const passwordHash = await bcrypt.hash(password, 12);
        const userId = crypto.randomUUID();

        // 3. Save user to DB
        const user = await userRepository.create({
            id: userId,
            name,
            email,
            passwordHash
        });

        // 4. Sign JWTs
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        return { user, accessToken, refreshToken };
    }

    async login({ email, password }) {
        // 1. Find user by email
        const user = await userRepository.findByEmail(email);
        if (!user) {
            throw new AppError('Incorrect email or password.', 401);
        }

        // 2. Verify password match
        const isPasswordCorrect = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordCorrect) {
            throw new AppError('Incorrect email or password.', 401);
        }

        // 3. Sign JWTs
        const accessToken = this.generateAccessToken(user);
        const refreshToken = this.generateRefreshToken(user);

        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            accessToken,
            refreshToken
        };
    }

    async refreshSession(refreshToken) {
        if (!refreshToken) {
            throw new AppError('Session refresh failed. Token not found.', 401);
        }

        try {
            // Verify token signature
            const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
            
            // Verify if user still exists
            const user = await userRepository.findById(decoded.id);
            if (!user) {
                throw new AppError('User belonging to this token no longer exists.', 401);
            }

            // Issue new access token
            const accessToken = this.generateAccessToken(user);
            return {
                accessToken,
                user
            };
        } catch (err) {
            throw new AppError('Session expired or invalid. Please log in again.', 401);
        }
    }
}

module.exports = new AuthService();
