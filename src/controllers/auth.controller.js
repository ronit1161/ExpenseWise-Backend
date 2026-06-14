const authService = require('../services/auth.service');

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
};

class AuthController {
    register = async (req, res, next) => {
        try {
            const { name, email, password } = req.body;
            const { user, accessToken, refreshToken } = await authService.register({ name, email, password });

            // Set refresh token in HttpOnly cookie
            res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

            return res.status(201).json({
                status: 'success',
                message: 'User registered successfully',
                data: { user, accessToken }
            });
        } catch (err) {
            next(err);
        }
    };

    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const { user, accessToken, refreshToken } = await authService.login({ email, password });

            // Set refresh token in HttpOnly cookie
            res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

            return res.status(200).json({
                status: 'success',
                message: 'Logged in successfully',
                data: { user, accessToken }
            });
        } catch (err) {
            next(err);
        }
    };

    logout = async (req, res, next) => {
        try {
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            return res.status(200).json({
                status: 'success',
                message: 'Logged out successfully'
            });
        } catch (err) {
            next(err);
        }
    };

    refresh = async (req, res, next) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            const { accessToken, user } = await authService.refreshSession(refreshToken);

            return res.status(200).json({
                status: 'success',
                data: { accessToken, user }
            });
        } catch (err) {
            next(err);
        }
    };

    getMe = async (req, res, next) => {
        try {
            return res.status(200).json({
                status: 'success',
                data: {
                    user: req.user
                }
            });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new AuthController();
