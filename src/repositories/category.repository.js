const pool = require('../config/db');

class CategoryRepository {
    async findAll() {
        const [rows] = await pool.query('SELECT id, name, icon, color FROM categories ORDER BY name ASC');
        return rows;
    }

    async findById(id) {
        const [rows] = await pool.query('SELECT id, name, icon, color FROM categories WHERE id = ?', [id]);
        return rows[0];
    }
}

module.exports = new CategoryRepository();
