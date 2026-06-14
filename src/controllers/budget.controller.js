const crypto = require('crypto');
const budgetRepository = require('../repositories/budget.repository');
const AppError = require('../utils/AppError');

class BudgetController {
    setBudget = async (req, res, next) => {
        try {
            const { categoryId, amount, month, year } = req.body;
            const userId = req.user.id;
            const id = crypto.randomUUID();

            const budget = await budgetRepository.createOrUpdate({
                id,
                userId,
                categoryId,
                amount,
                month,
                year
            });

            return res.status(201).json({
                status: 'success',
                message: 'Budget set successfully',
                data: { budget }
            });
        } catch (err) {
            next(err);
        }
    };

    getBudgetStatus = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const now = new Date();
            // Default to current month/year if not provided
            const { month = now.getMonth() + 1, year = now.getFullYear() } = req.query;

            const budgets = await budgetRepository.getBudgetStatus(userId, Number(year), Number(month));

            return res.status(200).json({
                status: 'success',
                data: {
                    period: `${year}-${String(month).padStart(2, '0')}`,
                    budgets
                }
            });
        } catch (err) {
            next(err);
        }
    };

    deleteBudget = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const deleted = await budgetRepository.delete(id, userId);
            if (!deleted) {
                throw new AppError('Budget limit record not found or access denied.', 404);
            }

            return res.status(200).json({
                status: 'success',
                message: 'Budget limit removed successfully'
            });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new BudgetController();
