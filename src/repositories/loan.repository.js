const pool = require('../config/db');
const AppError = require('../utils/AppError');

class LoanRepository {
    async create({ id, userId, contactId, type, amount, description, loanDate, dueDate }) {
        await pool.query(
            `INSERT INTO loans (id, user_id, contact_id, type, amount, remaining_amount, description, loan_date, due_date, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
            [id, userId, contactId, type, amount, amount, description, loanDate, dueDate]
        );
        return this.findById(id, userId);
    }

    async findById(id, userId) {
        const [rows] = await pool.query(
            `SELECT l.id, l.type, l.amount, l.remaining_amount as remainingAmount, l.description,
                    l.status, l.loan_date as loanDate, l.due_date as dueDate, l.contact_id as contactId, c.name as contactName
             FROM loans l
             JOIN contacts c ON l.contact_id = c.id
             WHERE l.id = ? AND l.user_id = ?`,
            [id, userId]
        );
        return rows[0];
    }

    async findAll(userId, { type, status }) {
        let query = `
            SELECT l.id, l.type, l.amount, l.remaining_amount as remainingAmount, l.description,
                   l.status, l.loan_date as loanDate, l.due_date as dueDate, l.contact_id as contactId, c.name as contactName
            FROM loans l
            JOIN contacts c ON l.contact_id = c.id
            WHERE l.user_id = ?
        `;
        const params = [userId];

        if (type) {
            query += ' AND l.type = ?';
            params.push(type);
        }
        if (status) {
            query += ' AND l.status = ?';
            params.push(status);
        }

        query += ' ORDER BY l.loan_date DESC, l.created_at DESC';
        const [rows] = await pool.query(query, params);
        return rows;
    }

    async recordSettlement({ id, loanId, amount, paymentMethod, settlementDate, notes, userId }) {
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // 1. Fetch loan and lock the row for update (prevent race conditions)
            const [loans] = await connection.query(
                'SELECT amount, remaining_amount, status FROM loans WHERE id = ? AND user_id = ? FOR UPDATE',
                [loanId, userId]
            );
            const loan = loans[0];

            if (!loan) {
                throw new AppError('Loan record not found.', 404);
            }

            const currentRemaining = parseFloat(loan.remaining_amount);
            const settleAmount = parseFloat(amount);

            if (settleAmount > currentRemaining) {
                throw new AppError(`Settlement amount (₹${settleAmount}) exceeds remaining debt (₹${currentRemaining}).`, 400);
            }

            // 2. Insert settlement audit row
            await connection.query(
                `INSERT INTO loan_settlements (id, loan_id, amount, payment_method, settlement_date, notes)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [id, loanId, settleAmount, paymentMethod, settlementDate, notes]
            );

            // 3. Compute remaining amount and new status
            const newRemaining = parseFloat((currentRemaining - settleAmount).toFixed(2));
            let newStatus = 'PARTIAL';
            if (newRemaining <= 0) {
                newStatus = 'SETTLED';
            }

            // 4. Update the loan balance and status
            await connection.query(
                'UPDATE loans SET remaining_amount = ?, status = ? WHERE id = ?',
                [newRemaining, newStatus, loanId]
            );

            await connection.commit();
            return {
                settlementId: id,
                remainingAmount: newRemaining,
                status: newStatus
            };
        } catch (err) {
            await connection.rollback();
            throw err;
        } finally {
            connection.release();
        }
    }

    async getSettlementsByLoan(loanId, userId) {
        // Ensure the loan belongs to the user before showing settlements
        const [loans] = await pool.query('SELECT id FROM loans WHERE id = ? AND user_id = ?', [loanId, userId]);
        if (loans.length === 0) return [];

        const [rows] = await pool.query(
            `SELECT id, amount, payment_method as paymentMethod, settlement_date as settlementDate, notes
             FROM loan_settlements
             WHERE loan_id = ?
             ORDER BY settlement_date DESC, created_at DESC`,
            [loanId]
        );
        return rows.map(r => ({ ...r, amount: parseFloat(r.amount) }));
    }

    async getDebtBalances(userId) {
        // Aggregates total receivable (LENT and not SETTLED) vs total payable (BORROWED and not SETTLED)
        const [rows] = await pool.query(
            `SELECT 
                SUM(CASE WHEN type = 'LENT' THEN remaining_amount ELSE 0 END) as totalReceivable,
                SUM(CASE WHEN type = 'BORROWED' THEN remaining_amount ELSE 0 END) as totalPayable
             FROM loans
             WHERE user_id = ? AND status != 'SETTLED'`,
            [userId]
        );

        return {
            totalReceivable: parseFloat(rows[0].totalReceivable) || 0,
            totalPayable: parseFloat(rows[0].totalPayable) || 0
        };
    }

    async delete(id, userId) {
        // Cascade delete will automatically remove settlements in database because of ON DELETE CASCADE
        const [result] = await pool.query('DELETE FROM loans WHERE id = ? AND user_id = ?', [id, userId]);
        return result.affectedRows > 0;
    }
}

module.exports = new LoanRepository();
