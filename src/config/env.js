const dotenv = require('dotenv');
const { z } = require('zod');
dotenv.config();

const envSchema = z.object({
    DB_HOST: z.string().default(process.env.MYSQLHOST || 'localhost'),
    DB_PORT: z.coerce.number().default(Number(process.env.MYSQLPORT || 3306)),
    DB_USER: z.string().default(process.env.MYSQLUSER || 'root'),
    DB_PASSWORD: z.string().default(process.env.MYSQLPASSWORD || ''),
    DB_NAME: z.string().default(process.env.MYSQLDATABASE || 'railway'),
});

console.log("DB_HOST =", process.env.DB_HOST);
console.log("MYSQLHOST =", process.env.MYSQLHOST);

console.log("DB_PORT =", process.env.DB_PORT);
console.log("MYSQLPORT =", process.env.MYSQLPORT);

console.log("DB_USER =", process.env.DB_USER);
console.log("MYSQLUSER =", process.env.MYSQLUSER);

console.log("DB_NAME =", process.env.DB_NAME);
console.log("MYSQLDATABASE =", process.env.MYSQLDATABASE);

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error(
        '❌ Invalid environment variables:',
        JSON.stringify(parsed.error.format(), null, 2)
    );
    process.exit(1);
}

module.exports = parsed.data;