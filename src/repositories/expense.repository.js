const pool = require('../config/db');

class ExpenseRepository {
    async create({ id, userId, categoryId, amount, description, paymentMethod, expenseDate }) {
        await pool.query(
            `INSERT INTO expenses (id, user_id, category_id, amount, description, payment_method, expense_date)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, userId, categoryId, amount, description, paymentMethod, expenseDate]
        );
        return this.findById(id, userId);
    }

    async findById(id, userId) {
        const [rows] = await pool.query(
            `SELECT e.id, e.amount, e.description, e.payment_method as paymentMethod, 
                    e.expense_date as expenseDate, e.category_id as categoryId, c.name as categoryName, c.color as categoryColor, c.icon as categoryIcon
             FROM expenses e
             JOIN categories c ON e.category_id = c.id
             WHERE e.id = ? AND e.user_id = ?`,
            [id, userId]
        );
        return rows[0];
    }

    async update(id, userId, { categoryId, amount, description, paymentMethod, expenseDate }) {
        await pool.query(
            `UPDATE expenses 
             SET category_id = ?, amount = ?, description = ?, payment_method = ?, expense_date = ?
             WHERE id = ? AND user_id = ?`,
            [categoryId, amount, description, paymentMethod, expenseDate, id, userId]
        );
        return this.findById(id, userId);
    }

    async delete(id, userId) {
        const [result] = await pool.query('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, userId]);
        return result.affectedRows > 0;
    }

    async findAll(userId, { limit = 10, offset = 0, startDate, endDate, categoryId }) {
        let query = `
            SELECT e.id, e.amount, e.description, e.payment_method as paymentMethod, 
                   e.expense_date as expenseDate, e.category_id as categoryId, c.name as categoryName, c.color as categoryColor, c.icon as categoryIcon
            FROM expenses e
            JOIN categories c ON e.category_id = c.id
            WHERE e.user_id = ?
        `;
        const params = [userId];

        if (startDate) {
            query += ' AND e.expense_date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND e.expense_date <= ?';
            params.push(endDate);
        }
        if (categoryId) {
            query += ' AND e.category_id = ?';
            params.push(categoryId);
        }

        query += ' ORDER BY e.expense_date DESC, e.created_at DESC LIMIT ? OFFSET ?';
        params.push(Number(limit), Number(offset));

        const [rows] = await pool.query(query, params);
        return rows;
    }

    async countAll(userId, { startDate, endDate, categoryId }) {
        let query = 'SELECT COUNT(*) as count FROM expenses WHERE user_id = ?';
        const params = [userId];

        if (startDate) {
            query += ' AND expense_date >= ?';
            params.push(startDate);
        }
        if (endDate) {
            query += ' AND expense_date <= ?';
            params.push(endDate);
        }
        if (categoryId) {
            query += ' AND category_id = ?';
            params.push(categoryId);
        }

        const [rows] = await pool.query(query, params);
        return rows[0].count;
    }

    async getTotalForMonth(userId, year, month) {
        const [rows] = await pool.query(
            `SELECT SUM(amount) as total 
             FROM expenses 
             WHERE user_id = ? AND YEAR(expense_date) = ? AND MONTH(expense_date) = ?`,
            [userId, year, month]
        );
        return parseFloat(rows[0].total) || 0;
    }

    async getTotalForDay(userId, dateString) {
        const [rows] = await pool.query(
            'SELECT SUM(amount) as total FROM expenses WHERE user_id = ? AND expense_date = ?',
            [userId, dateString]
        );
        return parseFloat(rows[0].total) || 0;
    }

    async getCategoryBreakdown(userId, year, month) {
        const [rows] = await pool.query(
            `SELECT c.id as categoryId, c.name as categoryName, c.color as categoryColor, c.icon as categoryIcon, SUM(e.amount) as total
             FROM expenses e
             JOIN categories c ON e.category_id = c.id
             WHERE e.user_id = ? AND YEAR(e.expense_date) = ? AND MONTH(e.expense_date) = ?
             GROUP BY c.id, c.name, c.color, c.icon
             ORDER BY total DESC`,
            [userId, year, month]
        );
        return rows.map(r => ({ ...r, total: parseFloat(r.total) }));
    }

    async getMonthlyTrend(userId, limitMonths = 6) {
        // Returns the sum of expenses for the last N calendar months
        const [rows] = await pool.query(
            `SELECT YEAR(expense_date) as year, MONTH(expense_date) as month, SUM(amount) as total
             FROM expenses
             WHERE user_id = ?
             GROUP BY YEAR(expense_date), MONTH(expense_date)
             ORDER BY year DESC, month DESC
             LIMIT ?`,
            [userId, limitMonths]
        );
        
        // Reverse to ascending order (chronological) for Recharts area trends
        return rows.reverse().map(r => ({
            period: `${r.year}-${String(r.month).padStart(2, '0')}`,
            total: parseFloat(r.total) || 0
        }));
    }

    async getHighestSpendingCategory(userId, year, month) {
        const [rows] = await pool.query(
            `SELECT c.name as categoryName, SUM(e.amount) as total
             FROM expenses e
             JOIN categories c ON e.category_id = c.id
             WHERE e.user_id = ? AND YEAR(e.expense_date) = ? AND MONTH(e.expense_date) = ?
             GROUP BY c.name
             ORDER BY total DESC
             LIMIT 1`,
            [userId, year, month]
        );
        return rows[0] ? { name: rows[0].categoryName, total: parseFloat(rows[0].total) } : null;
    }
}

module.exports = new ExpenseRepository();
