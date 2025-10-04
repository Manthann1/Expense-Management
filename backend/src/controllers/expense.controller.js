const { pool } = require('../config/config');
const currencyService = require('../services/currencyService');

const expenseController = {
  // EXPENSES ----------
  createExpense: async (req, res) => {
    const client = await pool.connect();
    try {
      const { amount, currency, categoryId, description, expenseDate } = req.body;
      const employeeId = req.user.id;
      const companyId = req.user.companyId;

      await client.query('BEGIN');

      const convertedAmountUsd = await currencyService.convertToUSD(parseFloat(amount), currency);

      const expenseResult = await client.query(
        `INSERT INTO expenses (employee_id, company_id, amount, currency, converted_amount_usd, 
         category_id, description, expense_date, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
        [employeeId, companyId, amount, currency, convertedAmountUsd, categoryId, description, expenseDate, 'Pending']
      );

      const expense = expenseResult.rows[0];

      const managerResult = await client.query('SELECT manager_id FROM users WHERE id = $1', [
        employeeId,
      ]);

      if (managerResult.rows[0]?.manager_id) {
        await client.query(
          `INSERT INTO approvals (expense_id, approver_id, level, status)
           VALUES ($1, $2, $3, $4)`,
          [expense.id, managerResult.rows[0].manager_id, 1, 'Pending']
        );
      }

      await client.query('COMMIT');
      res.status(201).json({ message: 'Expense created successfully', expense });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Create expense error:', err);
      res.status(500).json({ error: 'Failed to create expense' });
    } finally {
      client.release();
    }
  },

  getExpenses: async (req, res) => {
    try {
      const { role, id: userId, companyId } = req.user;
      let query, params;

      if (role === 'Admin') {
        query = `
          SELECT e.*, u.first_name, u.last_name, u.email, c.name as category_name
          FROM expenses e
          JOIN users u ON e.employee_id = u.id
          LEFT JOIN categories c ON e.category_id = c.id
          WHERE e.company_id = $1
          ORDER BY e.created_at DESC
        `;
        params = [companyId];
      } else if (role === 'Manager') {
        query = `
          SELECT e.*, u.first_name, u.last_name, u.email, c.name as category_name
          FROM expenses e
          JOIN users u ON e.employee_id = u.id
          LEFT JOIN categories c ON e.category_id = c.id
          WHERE e.company_id = $1 AND (u.manager_id = $2 OR e.employee_id = $2)
          ORDER BY e.created_at DESC
        `;
        params = [companyId, userId];
      } else {
        query = `
          SELECT e.*, u.first_name, u.last_name, u.email, c.name as category_name
          FROM expenses e
          JOIN users u ON e.employee_id = u.id
          LEFT JOIN categories c ON e.category_id = c.id
          WHERE e.employee_id = $1
          ORDER BY e.created_at DESC
        `;
        params = [userId];
      }

      const result = await pool.query(query, params);
      res.json({ expenses: result.rows });
    } catch (err) {
      console.error('Get expenses error:', err);
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  },

  getExpenseById: async (req, res) => {
    try {
      const { id } = req.params;
      const { role, id: userId, companyId } = req.user;

      const result = await pool.query(
        `
        SELECT e.*, u.first_name, u.last_name, u.email, c.name as category_name
        FROM expenses e
        JOIN users u ON e.employee_id = u.id
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.id = $1 AND e.company_id = $2
      `,
        [id, companyId]
      );

      if (result.rows.length === 0) return res.status(404).json({ error: 'Expense not found' });

      const expense = result.rows[0];
      if (role === 'Employee' && expense.employee_id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const approvalsResult = await pool.query(
        `SELECT a.*, u.first_name, u.last_name, u.email
         FROM approvals a
         JOIN users u ON a.approver_id = u.id
         WHERE a.expense_id = $1
         ORDER BY a.level`,
        [id]
      );

      expense.approvals = approvalsResult.rows;
      res.json({ expense });
    } catch (err) {
      console.error('Get expense error:', err);
      res.status(500).json({ error: 'Failed to fetch expense' });
    }
  },

  // CATEGORIES ----------
  getCategories: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const result = await pool.query(
        'SELECT * FROM categories WHERE company_id = $1 ORDER BY name',
        [companyId]
      );
      res.json({ categories: result.rows });
    } catch (err) {
      console.error('Get categories error:', err);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  },

  createCategory: async (req, res) => {
    try {
      const { name, description } = req.body;
      const companyId = req.user.companyId;

      const result = await pool.query(
        'INSERT INTO categories (company_id, name, description) VALUES ($1, $2, $3) RETURNING *',
        [companyId, name, description]
      );

      res.status(201).json({ message: 'Category created successfully', category: result.rows[0] });
    } catch (err) {
      console.error('Create category error:', err);
      res.status(500).json({ error: 'Failed to create category' });
    }
  },

  // APPROVALS ----------
  getPendingApprovals: async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await pool.query(
        `SELECT a.*, e.amount, e.currency, e.description, e.expense_date,
         u.first_name, u.last_name, u.email, c.name as category_name
         FROM approvals a
         JOIN expenses e ON a.expense_id = e.id
         JOIN users u ON e.employee_id = u.id
         LEFT JOIN categories c ON e.category_id = c.id
         WHERE a.approver_id = $1 AND a.status = 'Pending'
         ORDER BY a.created_at ASC`,
        [userId]
      );

      res.json({ approvals: result.rows });
    } catch (err) {
      console.error('Get pending approvals error:', err);
      res.status(500).json({ error: 'Failed to fetch approvals' });
    }
  },

  approveExpense: async (req, res) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const userId = req.user.id;

      await client.query('BEGIN');

      const approvalResult = await client.query(
        'SELECT * FROM approvals WHERE id = $1 AND approver_id = $2',
        [id, userId]
      );
      if (approvalResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Approval not found or not authorized' });
      }

      const approval = approvalResult.rows[0];
      if (approval.status !== 'Pending') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Approval already processed' });
      }

      await client.query(
        'UPDATE approvals SET status = $1, comments = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3',
        ['Approved', comments, id]
      );

      const nextLevelResult = await client.query(
        'SELECT 1 FROM approvals WHERE expense_id = $1 AND level = $2',
        [approval.expense_id, approval.level + 1]
      );

      if (nextLevelResult.rows.length === 0) {
        await client.query(
          'UPDATE expenses SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['Approved', approval.expense_id]
        );
      } else {
        await client.query(
          'UPDATE expenses SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['Processing', approval.expense_id]
        );
      }

      await client.query('COMMIT');
      res.json({ message: 'Expense approved successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Approve expense error:', err);
      res.status(500).json({ error: 'Failed to approve expense' });
    } finally {
      client.release();
    }
  },

  rejectExpense: async (req, res) => {
    const client = await pool.connect();
    try {
      const { id } = req.params;
      const { comments } = req.body;
      const userId = req.user.id;

      await client.query('BEGIN');

      const approvalResult = await client.query(
        'SELECT * FROM approvals WHERE id = $1 AND approver_id = $2',
        [id, userId]
      );
      if (approvalResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Approval not found or not authorized' });
      }

      const approval = approvalResult.rows[0];
      if (approval.status !== 'Pending') {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Approval already processed' });
      }

      await client.query(
        'UPDATE approvals SET status = $1, comments = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3',
        ['Rejected', comments || 'Rejected by approver', id]
      );

      await client.query(
        'UPDATE expenses SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['Rejected', approval.expense_id]
      );

      await client.query('COMMIT');
      res.json({ message: 'Expense rejected successfully' });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Reject expense error:', err);
      res.status(500).json({ error: 'Failed to reject expense' });
    } finally {
      client.release();
    }
  },
};

module.exports = expenseController;
