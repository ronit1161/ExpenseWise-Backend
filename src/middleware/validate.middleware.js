const { z } = require('zod');
const AppError = require('../utils/AppError');

// Middleware to parse and validate request components
const validate = (schema) => (req, res, next) => {
    try {
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params
        });
        next();
    } catch (err) {
        if (err.errors) {
            const errorMessages = err.errors.map(e => `${e.path.slice(1).join('.')}: ${e.message}`).join(', ');
            return next(new AppError(`Validation failed: ${errorMessages}`, 400));
        }
        next(err);
    }
};

// 1. Authentication Schema
const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, 'Name must be at least 2 characters').max(100),
        email: z.string().email('Invalid email address format'),
        password: z.string().min(6, 'Password must be at least 6 characters')
    })
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email('Invalid email address format'),
        password: z.string().nonempty('Password is required')
    })
});

// 2. Expense Schema
const expenseSchema = z.object({
    body: z.object({
        categoryId: z.number().int().positive('Category ID must be a valid category reference'),
        amount: z.number().positive('Expense amount must be a positive decimal value'),
        description: z.string().max(255).optional().nullable(),
        paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING'], {
            errorMap: () => ({ message: 'Payment method must be one of: CASH, CREDIT_CARD, DEBIT_CARD, UPI, NET_BANKING' })
        }),
        expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted YYYY-MM-DD')
    })
});

// 3. Budget Schema
const budgetSchema = z.object({
    body: z.object({
        categoryId: z.number().int().positive('Category ID must be a valid category reference'),
        amount: z.number().positive('Budget amount must be a positive decimal value'),
        month: z.number().int().min(1).max(12, 'Month parameter must be between 1 and 12'),
        year: z.number().int().min(2000).max(2100, 'Year parameter must be between 2000 and 2100')
    })
});

// 4. Loan Schema
const loanSchema = z.object({
    body: z.object({
        contactName: z.string().min(2, 'Contact name must be at least 2 characters').max(100),
        contactEmail: z.string().email('Invalid email format').optional().nullable().or(z.literal('')),
        contactPhone: z.string().max(20).optional().nullable().or(z.literal('')),
        type: z.enum(['LENT', 'BORROWED'], {
            errorMap: () => ({ message: 'Type must be LENT (receivable) or BORROWED (payable)' })
        }),
        amount: z.number().positive('Principal amount must be a positive decimal value'),
        description: z.string().max(255).optional().nullable(),
        loanDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted YYYY-MM-DD'),
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted YYYY-MM-DD').optional().nullable().or(z.literal(''))
    })
});

// 5. Settlement Schema
const settlementSchema = z.object({
    body: z.object({
        amount: z.number().positive('Settlement amount must be a positive decimal value'),
        paymentMethod: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING'], {
            errorMap: () => ({ message: 'Payment method must be one of: CASH, CREDIT_CARD, DEBIT_CARD, UPI, NET_BANKING' })
        }),
        settlementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted YYYY-MM-DD'),
        notes: z.string().max(255).optional().nullable()
    })
});

module.exports = {
    validate,
    registerSchema,
    loginSchema,
    expenseSchema,
    budgetSchema,
    loanSchema,
    settlementSchema
};
