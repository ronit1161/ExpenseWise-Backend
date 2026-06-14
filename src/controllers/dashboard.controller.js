const expenseRepository = require('../repositories/expense.repository');
const budgetRepository = require('../repositories/budget.repository');
const loanRepository = require('../repositories/loan.repository');
const insightService = require('../services/insight.service');

class DashboardController {
    getSummary = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;
            const todayStr = now.toISOString().split('T')[0];

            // 1. Total Expenses This Month
            const totalMonthExpenses = await expenseRepository.getTotalForMonth(userId, year, month);

            // 2. Today's Expenses
            const totalTodayExpenses = await expenseRepository.getTotalForDay(userId, todayStr);

            // 3. Highest Spending Category
            const highestCategory = await expenseRepository.getHighestSpendingCategory(userId, year, month);

            // 4. Receivables / Payables Balance
            const debtSummary = await loanRepository.getDebtBalances(userId);

            // 5. Total Budget and Remaining Budget
            const budgetStatuses = await budgetRepository.getBudgetStatus(userId, year, month);
            let totalBudgetLimit = 0;
            let totalBudgetSpent = 0;
            budgetStatuses.forEach(b => {
                totalBudgetLimit += b.budgetLimit;
                totalBudgetSpent += b.spentAmount;
            });
            const remainingBudget = Math.max(0, totalBudgetLimit - totalMonthExpenses);

            return res.status(200).json({
                status: 'success',
                data: {
                    monthSpent: totalMonthExpenses,
                    todaySpent: totalTodayExpenses,
                    highestCategory: highestCategory ? highestCategory.name : 'N/A',
                    receivable: debtSummary.totalReceivable,
                    payable: debtSummary.totalPayable,
                    remainingBudget,
                    budgetLimit: totalBudgetLimit
                }
            });
        } catch (err) {
            next(err);
        }
    };

    getAnalytics = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;

            // 1. 6-Month Spending Trend
            const trend = await expenseRepository.getMonthlyTrend(userId, 6);

            // 2. Category Wise breakdown for current month
            const categoriesBreakdown = await expenseRepository.getCategoryBreakdown(userId, year, month);

            // 3. Budget limits vs spent amounts
            const budgets = await budgetRepository.getBudgetStatus(userId, year, month);

            // 4. Debt overview (Receivables vs Payables)
            const debtSummary = await loanRepository.getDebtBalances(userId);

            return res.status(200).json({
                status: 'success',
                data: {
                    monthlyTrend: trend,
                    categoryBreakdown: categoriesBreakdown,
                    budgets,
                    debts: debtSummary
                }
            });
        } catch (err) {
            next(err);
        }
    };

    getInsights = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const insights = await insightService.generateInsights(userId);

            return res.status(200).json({
                status: 'success',
                data: { insights }
            });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new DashboardController();
