const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const globalErrorHandler = require('./middleware/error.middleware');
const AppError = require('./utils/AppError');

const app = express();

// 1. Global Middlewares
app.use(cors({
    origin: [
        'https://expense-wise-frontend.vercel.app'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors());

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
