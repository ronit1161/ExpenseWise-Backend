const express = require('express');
const budgetController = require('../controllers/budget.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validate, budgetSchema } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/status', budgetController.getBudgetStatus);
router.post('/', validate(budgetSchema), budgetController.setBudget);
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
