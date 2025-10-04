const router = require('express').Router();
const expenseController = require('../controllers/expense.controller');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth.middleware');
const currencyService = require('../services/currencyService');

// Expenses
router.post('/', authenticateToken, expenseController.createExpense);
router.get('/', authenticateToken, expenseController.getExpenses);
router.get('/:id', authenticateToken, expenseController.getExpenseById);

// Categories
router.get('/meta/categories', authenticateToken, expenseController.getCategories);
router.post('/meta/categories', authenticateToken, authorizeRoles('Admin'), expenseController.createCategory);

// Approvals
router.get('/meta/approvals/pending', authenticateToken, authorizeRoles('Manager', 'Admin'), expenseController.getPendingApprovals);
router.put('/meta/approvals/:id/approve', authenticateToken, authorizeRoles('Manager', 'Admin'), expenseController.approveExpense);
router.put('/meta/approvals/:id/reject', authenticateToken, authorizeRoles('Manager', 'Admin'), expenseController.rejectExpense);

// Currency
router.get('/meta/currencies/rates', authenticateToken, async (req, res) => {
  try {
    const rates = await currencyService.getExchangeRates();
    res.json({ rates });
  } catch {
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

module.exports = router;
