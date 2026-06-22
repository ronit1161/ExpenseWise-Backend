const dotenv = require('dotenv');
const { z } = require('zod');
dotenv.config();

const envSchema = z.object({
    PORT: z.preprocess(
        (val) => val || '5000',
        z.string().transform(Number)
    ),

    DB_HOST: z.preprocess(
        (val) => val || process.env.MYSQLHOST || 'localhost',
        z.string()
    ),

    DB_PORT: z.preprocess(
        (val) => val || process.env.MYSQLPORT || '3306',
        z.string().transform(Number)
    ),

    DB_USER: z.preprocess(
        (val) => val || process.env.MYSQLUSER || 'root',
        z.string()
    ),
    DB_PASSWORD: z.preprocess(
        (val) => val || process.env.MYSQLPASSWORD || '',
        z.string()
    ),
    DB_NAME: z.preprocess(
        (val) => val || process.env.MYSQLDATABASE || 'expensewise',
        z.string()
    ),

    JWT_SECRET: z.string(),
    JWT_REFRESH_SECRET: z.string(),

    NODE_ENV: z
        .enum(['development', 'production', 'test'])
        .default('development')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
}

module.exports = {
    DB_HOST: process.env.MYSQLHOST,
    DB_PORT: Number(process.env.MYSQLPORT),
    DB_USER: process.env.MYSQLUSER,
    DB_PASSWORD: process.env.MYSQLPASSWORD,
    DB_NAME: process.env.MYSQLDATABASE
};