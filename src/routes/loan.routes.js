const express = require('express');
const loanController = require('../controllers/loan.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { validate, loanSchema, settlementSchema } = require('../middleware/validate.middleware');

const router = express.Router();

router.use(authMiddleware);

router.get('/contacts', loanController.getContacts);
router.get('/', loanController.getLoans);
router.post('/', validate(loanSchema), loanController.createLoan);
router.get('/:id', loanController.getLoanDetails);
router.delete('/:id', loanController.deleteLoan);
router.post('/:id/settlements', validate(settlementSchema), loanController.addSettlement);

module.exports = router;
