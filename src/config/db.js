const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: (env.DB_HOST === 'localhost' || env.DB_HOST === '127.0.0.1' || env.DB_HOST.endsWith('.internal')) ? undefined : {
        rejectUnauthorized: true
    }
});

module.exports = pool;