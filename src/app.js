const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const globalErrorHandler = require('./middleware/error.middleware');
const AppError = require('./utils/AppError');

const app = express();

// 1. Global Middlewares
const allowedOrigins = [
    'https://expense-wise-frontend.vercel.app'
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        
        const isLocalhost = /^http:\/\/localhost(:\d+)?$/.test(origin);
        const isVercel = origin.endsWith('.vercel.app');
        const isAllowed = allowedOrigins.includes(origin) || isLocalhost || isVercel;
        
        if (isAllowed) {
            callback(null, true);
        } else {
            callback(null, false); // Block by CORS
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

// 2. API Routes
app.use('/api', routes);

// 3. 404 Route Handler
app.use((req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 4. Central Global Error Handler
app.use(globalErrorHandler);

module.exports = app;
