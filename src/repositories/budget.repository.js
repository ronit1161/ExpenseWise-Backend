const pool = require('../config/db');

class BudgetRepository {
    async createOrUpdate({ id, userId, categoryId, amount, month, year }) {
        // Upsert style using DUPLICATE KEY UPDATE in MySQL
        await pool.query(
            `INSERT INTO budgets (id, user_id, category_id, amount, month, year)
             VALUES (?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE amount = VALUES(amount), updated_at = CURRENT_TIMESTAMP`,
            [id, userId, categoryId, amount, month, year]
        );
        return this.findByCategoryPeriod(userId, categoryId, month, year);
    }

    async findByCategoryPeriod(userId, categoryId, month, year) {
        const [rows] = await pool.query(
            `SELECT id, user_id as userId, category_id as categoryId, amount, month, year
             FROM budgets
             WHERE user_id = ? AND category_id = ? AND month = ? AND year = ?`,
            [userId, categoryId, month, year]
        );
        return rows[0];
    }

    async delete(id, userId) {
        const [result] = await pool.query('DELETE FROM budgets WHERE id = ? AND user_id = ?', [id, userId]);
        return result.affectedRows > 0;
    }

    async getBudgetStatus(userId, year, month) {
        const [rows] = await pool.query(
            `SELECT 
                b.id as budgetId,
                c.id as categoryId,
                c.name as categoryName,
                c.color as categoryColor,
                c.icon as categoryIcon,
                b.amount as budgetLimit,
                COALESCE(
                    (SELECT SUM(e.amount) 
                     FROM expenses e 
                     WHERE e.user_id = b.user_id 
                       AND e.category_id = b.category_id 
                       AND YEAR(e.expense_date) = b.year 
                       AND MONTH(e.expense_date) = b.month
                    ), 0
                ) as spentAmount
             FROM budgets b
             JOIN categories c ON b.category_id = c.id
             WHERE b.user_id = ? AND b.year = ? AND b.month = ?`,
            [userId, year, month]
        );
        return rows.map(r => ({
            ...r,
            budgetLimit: parseFloat(r.budgetLimit),
            spentAmount: parseFloat(r.spentAmount),
            remainingAmount: Math.max(0, parseFloat(r.budgetLimit) - parseFloat(r.spentAmount)),
            utilizationPercentage: parseFloat(((parseFloat(r.spentAmount) / parseFloat(r.budgetLimit)) * 100).toFixed(1)),
            isOverBudget: parseFloat(r.spentAmount) > parseFloat(r.budgetLimit)
        }));
    }
}

module.exports = new BudgetRepository();
