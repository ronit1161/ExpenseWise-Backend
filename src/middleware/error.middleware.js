const AppError = require('../utils/AppError');

const handleCastErrorDB = err => {
    return new AppError(`Invalid ${err.path}: ${err.value}.`, 400);
};

const handleDuplicateFieldsDB = err => {
    // MySQL duplicate entry error handling
    // e.g. "Duplicate entry 'email@test.com' for key 'users.uq_user_email'"
    const match = err.message.match(/Duplicate entry '(.*?)' for key/);
    const value = match ? match[1] : 'value';
    return new AppError(`Duplicate field value: "${value}". Please use another value!`, 409);
};

const handleJWTError = () => new AppError('Invalid session. Please log in again.', 401);

const handleJWTExpiredError = () => new AppError('Your session has expired. Please log in again.', 401);

const sendErrorDev = (err, req, res) => {
    return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        stack: err.stack,
        error: err
    });
};

const sendErrorProd = (err, req, res) => {
    // Operational, trusted error: send message to client
    if (err.isOperational) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    }
    
    // Programming or other unknown error: don't leak details to client
    console.error('ERROR 💥:', err);
    return res.status(500).json({
        status: 'error',
        message: 'Something went wrong on our end.'
    });
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else {
        let error = { ...err };
        error.message = err.message;
        error.name = err.name;
        error.code = err.code;

        // Custom database error mapping
        if (error.code === 'ER_DUP_ENTRY') error = handleDuplicateFieldsDB(error);
        if (error.name === 'JsonWebTokenError') error = handleJWTError();
        if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

        sendErrorProd(error, req, res);
    }
};
