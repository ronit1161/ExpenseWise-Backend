const app = require('./app');
const env = require('./config/env');
const initDb = require('./config/initDb');

const PORT = env.PORT || 5000;

const startServer = async () => {
    try {
        // Ensure Database and tables are fully initialized first
        await initDb();

        // Start listening
        app.listen(PORT, () => {
            console.log(`🚀 ExpenseWise Server running in [${env.NODE_ENV}] mode on port ${PORT}`);
        });
    } catch (err) {
        console.error('❌ Server startup failure due to database error:', err);
        process.exit(1);
    }
};

startServer();
