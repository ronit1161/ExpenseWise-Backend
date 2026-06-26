const dotenv = require('dotenv');
const { z } = require('zod');
dotenv.config();

// Railway injects MySQL variables as MYSQLHOST, MYSQLPORT, etc.
// We normalize them so both Railway's auto-vars and explicit DB_* vars work.
const rawEnv = {
    ...process.env,
    DB_HOST:     process.env.DB_HOST     || process.env.MYSQLHOST      || 'localhost',
    DB_PORT:     process.env.DB_PORT     || process.env.MYSQLPORT      || '3306',
    DB_USER:     process.env.DB_USER     || process.env.MYSQLUSER      || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD  || '',
    DB_NAME:     process.env.DB_NAME     || process.env.MYSQLDATABASE  || 'railway',
};

const envSchema = z.object({
    PORT:             z.coerce.number().default(5000),
    NODE_ENV:         z.string().default('development'),
    DB_HOST:          z.string(),
    DB_PORT:          z.coerce.number(),
    DB_USER:          z.string(),
    DB_PASSWORD:      z.string(),
    DB_NAME:          z.string(),
    JWT_SECRET:       z.string().min(10, 'JWT_SECRET must be at least 10 characters'),
    JWT_REFRESH_SECRET: z.string().min(10, 'JWT_REFRESH_SECRET must be at least 10 characters'),
});

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
    console.error(
        '❌ Invalid environment variables:',
        JSON.stringify(parsed.error.format(), null, 2)
    );
    process.exit(1);
}

module.exports = parsed.data;