const dotenv = require('dotenv');
const { z } = require('zod');
dotenv.config();

const envSchema = z.object({
    PORT: z.preprocess(
        (val) => val || '5000',
        z.string().transform(Number)
    ),

    DB_HOST: z.string().default('localhost'),

    DB_PORT: z.preprocess(
        (val) => val || '3306',
        z.string().transform(Number)
    ),

    DB_USER: z.string().default('root'),
    DB_PASSWORD: z.string().default(''),
    DB_NAME: z.string().default('expensewise'),

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

module.exports = parsed.data;
