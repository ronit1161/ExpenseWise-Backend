const pool = require('../config/db');

class ContactRepository {
    async findByName(userId, name) {
        const [rows] = await pool.query(
            'SELECT id, name, email, phone FROM contacts WHERE user_id = ? AND name = ?',
            [userId, name]
        );
        return rows[0];
    }

    async findById(id, userId) {
        const [rows] = await pool.query(
            'SELECT id, name, email, phone FROM contacts WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return rows[0];
    }

    async create({ id, userId, name, email = null, phone = null }) {
        await pool.query(
            'INSERT INTO contacts (id, user_id, name, email, phone) VALUES (?, ?, ?, ?, ?)',
            [id, userId, name, email, phone]
        );
        return { id, userId, name, email, phone };
    }

    async findAll(userId) {
        const [rows] = await pool.query(
            'SELECT id, name, email, phone FROM contacts WHERE user_id = ? ORDER BY name ASC',
            [userId]
        );
        return rows;
    }
}

module.exports = new ContactRepository();
