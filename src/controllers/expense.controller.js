const crypto = require('crypto');
const expenseRepository = require('../repositories/expense.repository');
const categoryRepository = require('../repositories/category.repository');
const AppError = require('../utils/AppError');

class ExpenseController {
    create = async (req, res, next) => {
        try {
            const { categoryId, amount, description, paymentMethod, expenseDate } = req.body;
            const userId = req.user.id;
            const expenseId = crypto.randomUUID();

            const expense = await expenseRepository.create({
                id: expenseId,
                userId,
                categoryId,
                amount,
                description,
                paymentMethod,
                expenseDate
            });

            return res.status(201).json({
                status: 'success',
                message: 'Expense added successfully',
                data: { expense }
            });
        } catch (err) {
            next(err);
        }
    };

    update = async (req, res, next) => {
        try {
            const { id } = req.params;
            const { categoryId, amount, description, paymentMethod, expenseDate } = req.body;
            const userId = req.user.id;

            const existing = await expenseRepository.findById(id, userId);
            if (!existing) {
                throw new AppError('Expense record not found or access denied.', 404);
            }

            const updatedExpense = await expenseRepository.update(id, userId, {
                categoryId,
                amount,
                description,
                paymentMethod,
                expenseDate
            });

            return res.status(200).json({
                status: 'success',
                message: 'Expense updated successfully',
                data: { expense: updatedExpense }
            });
        } catch (err) {
            next(err);
        }
    };

    delete = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const deleted = await expenseRepository.delete(id, userId);
            if (!deleted) {
                throw new AppError('Expense record not found or access denied.', 404);
            }

            return res.status(200).json({
                status: 'success',
                message: 'Expense deleted successfully'
            });
        } catch (err) {
            next(err);
        }
    };

    getOne = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const expense = await expenseRepository.findById(id, userId);
            if (!expense) {
                throw new AppError('Expense record not found or access denied.', 404);
            }

            return res.status(200).json({
                status: 'success',
                data: { expense }
            });
        } catch (err) {
            next(err);
        }
    };

    getAll = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 10, startDate, endDate, categoryId } = req.query;

            const offset = (Number(page) - 1) * Number(limit);

            const expenses = await expenseRepository.findAll(userId, {
                limit,
                offset,
                startDate,
                endDate,
                categoryId
            });

            const totalCount = await expenseRepository.countAll(userId, {
                startDate,
                endDate,
                categoryId
            });

            const totalPages = Math.ceil(totalCount / Number(limit));

            return res.status(200).json({
                status: 'success',
                data: {
                    expenses,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        totalCount,
                        totalPages
                    }
                }
            });
        } catch (err) {
            next(err);
        }
    };

    getCategories = async (req, res, next) => {
        try {
            const categories = await categoryRepository.findAll();
            return res.status(200).json({
                status: 'success',
                data: { categories }
            });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new ExpenseController();
