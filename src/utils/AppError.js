class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode || 500;
        this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Indicates client-expected or manual business errors
        
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
