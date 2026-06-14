const express = require('express');
const expenseController = require('../controllers/expense.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validate, expenseSchema } = require('../middleware/validate.middleware');

const router = express.Router();

// Apply authentication to all expense routes
router.use(authMiddleware);

router.get('/categories', expenseController.getCategories);
router.get('/', expenseController.getAll);
router.post('/', validate(expenseSchema), expenseController.create);
router.get('/:id', expenseController.getOne);
router.put('/:id', validate(expenseSchema), expenseController.update);
router.delete('/:id', expenseController.delete);

module.exports = router;
