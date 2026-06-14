const dotenv = require('dotenv');
const { z } = require('zod');
const path = require('path');

// Load environment variables from backend root .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const envSchema = z.object({
    PORT: z.preprocess((val) => val || '5000', z.string().transform(Number)),
    DB_HOST: z.string().default('localhost'),
    DB_USER: z.string().default('root'),
    DB_PASSWORD: z.string().default(''),
    DB_NAME: z.string().default('expensewise'),
    JWT_SECRET: z.string().default('expensewise_dev_access_secret_key_12345'),
    JWT_REFRESH_SECRET: z.string().default('expensewise_dev_refresh_secret_key_12345'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
    process.exit(1);
}

module.exports = parsed.data;
