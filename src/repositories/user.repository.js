const pool = require('../config/db');

class UserRepository {
    async findByEmail(email) {
        const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = ?', [id]);
        return rows[0];
    }

    async create({ id, name, email, passwordHash }) {
        await pool.query(
            'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
            [id, name, email, passwordHash]
        );
        return { id, name, email };
    }
}

module.exports = new UserRepository();
