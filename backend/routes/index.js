const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticate, authorize } = require('../middleware/auth');

// Controllers
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const expenseController = require('../controllers/expenseController');
const approvalController = require('../controllers/approvalController');
const ocrController = require('../controllers/ocrController');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/receipts/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'receipt-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDFs are allowed'));
  }
});

// ==================== Public Routes ====================

// Authentication
router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);

// ==================== Protected Routes ====================

// User Management (Admin only)
router.post('/users', authenticate, authorize('admin'), userController.createUser);
router.get('/users', authenticate, authorize('admin', 'manager'), userController.getAllUsers);
router.put('/users/:userId/role', authenticate, authorize('admin'), userController.updateUserRole);
router.put('/users/:userId/manager', authenticate, authorize('admin'), userController.assignManager);

// Expense Management
router.post('/expenses', authenticate, expenseController.createExpense);
router.get('/expenses/my', authenticate, expenseController.getMyExpenses);
router.get('/expenses/pending-approvals', authenticate, authorize('manager', 'admin'), expenseController.getPendingApprovals);
router.get('/expenses/team', authenticate, authorize('manager', 'admin'), expenseController.getTeamExpenses);
router.get('/expenses/all', authenticate, authorize('admin'), expenseController.getAllExpenses);
router.post('/expenses/:expenseId/approve-reject', authenticate, authorize('manager', 'admin'), expenseController.approveOrRejectExpense);

// Approval Rules (Admin only)
router.post('/approval-rules', authenticate, authorize('admin'), approvalController.createApprovalRule);
router.get('/approval-rules', authenticate, authorize('admin'), approvalController.getApprovalRules);
router.put('/approval-rules/:ruleId', authenticate, authorize('admin'), approvalController.updateApprovalRule);
router.delete('/approval-rules/:ruleId', authenticate, authorize('admin'), approvalController.deleteApprovalRule);

// OCR for receipts
router.post('/ocr/process-receipt', authenticate, upload.single('receipt'), ocrController.processReceipt);

module.exports = router;