const budgetRepository = require('../repositories/budget.repository');
const loanRepository = require('../repositories/loan.repository');
const expenseRepository = require('../repositories/expense.repository');

class InsightService {
    async generateInsights(userId) {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // 1-indexed
        const currentDay = now.getDate();
        
        // Helper to find total days in a month
        const totalDaysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        const monthProgressRatio = currentDay / totalDaysInMonth;

        const insights = [];

        try {
            // 1. Fetch budget status for current period
            const budgetStatuses = await budgetRepository.getBudgetStatus(userId, currentYear, currentMonth);
            
            for (const b of budgetStatuses) {
                const limit = b.budgetLimit;
                const spent = b.spentAmount;
                const util = b.utilizationPercentage;

                if (limit <= 0) continue;

                // Rule A: Over Budget
                if (spent > limit) {
                    insights.push({
                        type: 'BUDGET_BREACH',
                        severity: 'high',
                        message: `Budget breached: You spent ₹${spent.toLocaleString()} on ${b.categoryName}, exceeding your limit of ₹${limit.toLocaleString()} by ₹${(spent - limit).toLocaleString()}.`
                    });
                }
                // Rule B: High Budget Utilization
                else if (util >= 80) {
                    insights.push({
                        type: 'BUDGET_WARNING',
                        severity: 'medium',
                        message: `Warning: You have used ${util}% of your ${b.categoryName} budget (Spent: ₹${spent.toLocaleString()} of ₹${limit.toLocaleString()}).`
                    });
                }
                // Rule C: Pacing Velocity violation (spending too fast)
                else {
                    const spendingRatio = spent / limit;
                    // If spending progress is 15% ahead of calendar progress
                    if (spendingRatio > monthProgressRatio + 0.15) {
                        insights.push({
                            type: 'VELOCITY_ALERT',
                            severity: 'low',
                            message: `Pacing alert: At your current rate, you are spending faster than normal on ${b.categoryName} for day ${currentDay} of the month.`
                        });
                    }
                }
            }

            // 2. Fetch peer debt summaries
            const debts = await loanRepository.getDebtBalances(userId);
            if (debts.totalReceivable > 0) {
                insights.push({
                    type: 'PENDING_RECEIVABLES',
                    severity: 'medium',
                    message: `Lending Reminder: You have a total of ₹${debts.totalReceivable.toLocaleString()} receivable from friends or contacts.`
                });
            }
            if (debts.totalPayable > 10000) {
                insights.push({
                    type: 'PENDING_PAYABLES',
                    severity: 'high',
                    message: `Payables Alert: You owe a total of ₹${debts.totalPayable.toLocaleString()} to others. Schedule your settlements to maintain healthy credit.`
                });
            }

            // 3. Compare with previous month (Overall Spending Trend)
            let prevYear = currentYear;
            let prevMonth = currentMonth - 1;
            if (prevMonth === 0) {
                prevMonth = 12;
                prevYear = currentYear - 1;
            }

            const currentMonthTotal = await expenseRepository.getTotalForMonth(userId, currentYear, currentMonth);
            const prevMonthTotal = await expenseRepository.getTotalForMonth(userId, prevYear, prevMonth);

            if (prevMonthTotal > 0) {
                const diff = currentMonthTotal - prevMonthTotal;
                if (diff > 0) {
                    const percentInc = ((diff / prevMonthTotal) * 100).toFixed(0);
                    if (percentInc >= 15) {
                        insights.push({
                            type: 'MOM_SPENDING_SPIKE',
                            severity: 'medium',
                            message: `Spending Trend: Your current spending of ₹${currentMonthTotal.toLocaleString()} is already ${percentInc}% higher than your total spend of last month (₹${prevMonthTotal.toLocaleString()}).`
                        });
                    }
                }
            }

            // Fallback general tip if no insights are generated
            if (insights.length === 0) {
                insights.push({
                    type: 'FINANCIAL_TIP',
                    severity: 'low',
                    message: "All clear! You are tracking well within your budgets and ledgers are balanced."
                });
            }

        } catch (err) {
            console.error('⚠️ Failed to calculate real-time insights:', err);
            // Non-breaking, return basic fallback
            insights.push({
                type: 'SYSTEM_STATUS',
                severity: 'low',
                message: "Insights Engine is scanning your transactions. Record more details to generate analytics."
            });
        }

        return insights;
    }
}

module.exports = new InsightService();
