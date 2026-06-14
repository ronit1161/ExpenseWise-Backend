const express = require('express');
const authRoutes = require('./auth.routes');
const expenseRoutes = require('./expense.routes');
const budgetRoutes = require('./budget.routes');
const loanRoutes = require('./loan.routes');
const dashboardRoutes = require('./dashboard.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/expenses', expenseRoutes);
router.use('/budgets', budgetRoutes);
router.use('/loans', loanRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
