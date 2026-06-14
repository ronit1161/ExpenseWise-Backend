const crypto = require('crypto');
const loanRepository = require('../repositories/loan.repository');
const contactRepository = require('../repositories/contact.repository');
const AppError = require('../utils/AppError');

class LoanController {
    createLoan = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { contactName, contactEmail, contactPhone, type, amount, description, loanDate, dueDate } = req.body;

            // 1. Resolve contact (find or auto-create)
            let contact = await contactRepository.findByName(userId, contactName);
            if (!contact) {
                const contactId = crypto.randomUUID();
                contact = await contactRepository.create({
                    id: contactId,
                    userId,
                    name: contactName,
                    email: contactEmail,
                    phone: contactPhone
                });
            }

            // 2. Create the loan record
            const loanId = crypto.randomUUID();
            const loan = await loanRepository.create({
                id: loanId,
                userId,
                contactId: contact.id,
                type,
                amount,
                description,
                loanDate,
                dueDate
            });

            return res.status(201).json({
                status: 'success',
                message: `${type === 'LENT' ? 'Lending' : 'Borrowing'} record created successfully.`,
                data: { loan }
            });
        } catch (err) {
            next(err);
        }
    };

    getLoans = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { type, status } = req.query; // optional filters

            const loans = await loanRepository.findAll(userId, { type, status });
            const balances = await loanRepository.getDebtBalances(userId);

            return res.status(200).json({
                status: 'success',
                data: {
                    loans,
                    summary: balances
                }
            });
        } catch (err) {
            next(err);
        }
    };

    getLoanDetails = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const loan = await loanRepository.findById(id, userId);
            if (!loan) {
                throw new AppError('Loan record not found or access denied.', 404);
            }

            const settlements = await loanRepository.getSettlementsByLoan(id, userId);

            return res.status(200).json({
                status: 'success',
                data: {
                    loan,
                    settlements
                }
            });
        } catch (err) {
            next(err);
        }
    };

    addSettlement = async (req, res, next) => {
        try {
            const { id: loanId } = req.params;
            const userId = req.user.id;
            const { amount, paymentMethod, settlementDate, notes } = req.body;
            const settlementId = crypto.randomUUID();

            const result = await loanRepository.recordSettlement({
                id: settlementId,
                loanId,
                amount,
                paymentMethod,
                settlementDate,
                notes,
                userId
            });

            return res.status(200).json({
                status: 'success',
                message: 'Settlement transaction logged successfully.',
                data: result
            });
        } catch (err) {
            next(err);
        }
    };

    deleteLoan = async (req, res, next) => {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const deleted = await loanRepository.delete(id, userId);
            if (!deleted) {
                throw new AppError('Loan record not found or access denied.', 404);
            }

            return res.status(200).json({
                status: 'success',
                message: 'Loan record deleted successfully.'
            });
        } catch (err) {
            next(err);
        }
    };

    getContacts = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const contacts = await contactRepository.findAll(userId);
            return res.status(200).json({
                status: 'success',
                data: { contacts }
            });
        } catch (err) {
            next(err);
        }
    };
}

module.exports = new LoanController();
