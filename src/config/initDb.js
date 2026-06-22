const mysql = require('mysql2/promise');
const env = require('./env');

const categoriesToSeed = [
    { name: 'Food', icon: 'Utensils', color: '#EF4444' },          // Red
    { name: 'Travel', icon: 'Car', color: '#3B82F6' },            // Blue
    { name: 'Shopping', icon: 'ShoppingBag', color: '#10B981' },    // Emerald
    { name: 'Entertainment', icon: 'Film', color: '#F59E0B' },     // Amber
    { name: 'Bills', icon: 'Receipt', color: '#8B5CF6' },          // Purple
    { name: 'Medical', icon: 'Activity', color: '#EC4899' },       // Pink
    { name: 'Education', icon: 'GraduationCap', color: '#06B6D4' },// Cyan
    { name: 'Others', icon: 'Layers', color: '#6B7280' }           // Gray
];

const initDb = async () => {
    let connection;
    try {
        console.log("DB_HOST =", env.DB_HOST);
        console.log("DB_PORT =", env.DB_PORT);
        console.log("DB_USER =", env.DB_USER);
        console.log("DB_NAME =", env.DB_NAME);
        console.log('🔄 Checking/creating database...');
        connection = await mysql.createConnection({
            host: env.DB_HOST,
            port: env.DB_PORT,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            ssl: (env.DB_HOST === 'localhost' || env.DB_HOST === '127.0.0.1' || env.DB_HOST.endsWith('.internal')) ? undefined : {
                rejectUnauthorized: true
            }
        });

        await connection.end();

        // Connect directly to the database to create tables
        connection = await mysql.createConnection({
            host: env.DB_HOST,
            port: env.DB_PORT,
            user: env.DB_USER,
            password: env.DB_PASSWORD,
            database: env.DB_NAME,
            ssl: {
                rejectUnauthorized: false
            }
        });

        console.log('🔄 Creating tables if they do not exist...');

        // 1. Users Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_user_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Categories Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS categories (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE,
                icon VARCHAR(50) NOT NULL,
                color VARCHAR(7) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 3. Expenses Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS expenses (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                category_id INT NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                description VARCHAR(255) NULL,
                payment_method ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING') NOT NULL,
                expense_date DATE NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
                INDEX idx_user_expense_date (user_id, expense_date),
                INDEX idx_user_category_date (user_id, category_id, expense_date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 4. Budgets Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS budgets (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                category_id INT NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                month TINYINT UNSIGNED NOT NULL,
                year SMALLINT UNSIGNED NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
                UNIQUE KEY uq_user_category_period (user_id, category_id, month, year),
                INDEX idx_user_period (user_id, year, month)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 5. Contacts Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS contacts (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(255) NULL,
                phone VARCHAR(20) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY uq_user_contact_name (user_id, name),
                INDEX idx_user_contact (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 6. Loans Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS loans (
                id VARCHAR(36) PRIMARY KEY,
                user_id VARCHAR(36) NOT NULL,
                contact_id VARCHAR(36) NOT NULL,
                type ENUM('LENT', 'BORROWED') NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                remaining_amount DECIMAL(12, 2) NOT NULL,
                description VARCHAR(255) NULL,
                status ENUM('PENDING', 'PARTIAL', 'SETTLED') DEFAULT 'PENDING' NOT NULL,
                loan_date DATE NOT NULL,
                due_date DATE NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE RESTRICT,
                INDEX idx_user_loan_status (user_id, status),
                INDEX idx_user_contact_loan (user_id, contact_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 7. Loan Settlements Table
        await connection.query(`
            CREATE TABLE IF NOT EXISTS loan_settlements (
                id VARCHAR(36) PRIMARY KEY,
                loan_id VARCHAR(36) NOT NULL,
                amount DECIMAL(12, 2) NOT NULL,
                payment_method ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING') NOT NULL,
                settlement_date DATE NOT NULL,
                notes VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (loan_id) REFERENCES loans(id) ON DELETE CASCADE,
                INDEX idx_settlement_loan (loan_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('🔄 Checking category seeds...');
        const [rows] = await connection.query('SELECT COUNT(*) as count FROM categories;');
        if (rows[0].count === 0) {
            console.log('🌱 Seeding initial categories...');
            for (const category of categoriesToSeed) {
                await connection.query(
                    'INSERT INTO categories (name, icon, color) VALUES (?, ?, ?);',
                    [category.name, category.icon, category.color]
                );
            }
            console.log('✅ Categories seeded successfully.');
        } else {
            console.log('ℹ️ Categories table already seeded.');
        }

        console.log('🎉 Database initialization complete.');
    } catch (err) {
        console.error('❌ Database initialization error:', err);
        throw err;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

module.exports = initDb;
