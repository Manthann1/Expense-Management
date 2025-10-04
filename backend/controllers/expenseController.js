const { pool } = require('../config/database');
const axios = require('axios');

const convertCurrency = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  try {
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
    const rate = response.data.rates[toCurrency];
    return (amount * rate).toFixed(2);
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw new Error('Failed to convert currency');
  }
};

const createExpense = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { amount, currencyCode, category, description, expenseDate, expenseLines } = req.body;
    const employeeId = req.user.id;
    const companyId = req.user.company_id;

    // Validate input
    if (!amount || !currencyCode || !category || !expenseDate) {
      await connection.rollback();
      return res.status(400).json({ error: 'Amount, currency, category, and date are required' });
    }

    // Get company currency
    const [companies] = await connection.query(
      'SELECT currency_code FROM companies WHERE id = ?',
      [companyId]
    );

    const companyCurrency = companies[0].currency_code;

    // Convert amount to company currency
    const amountInCompanyCurrency = await convertCurrency(
      amount,
      currencyCode,
      companyCurrency
    );

    // Get user's manager and check for approval rules
    const [users] = await connection.query(
      'SELECT manager_id FROM users WHERE id = ?',
      [employeeId]
    );

    const managerId = users[0].manager_id;

    // Get active approval rule for the company
    const [approvalRules] = await connection.query(
      'SELECT * FROM approval_rules WHERE company_id = ? AND is_active = TRUE LIMIT 1',
      [companyId]
    );

    let approvalRuleId = null;
    if (approvalRules.length > 0) {
      approvalRuleId = approvalRules[0].id;
    }

    // Create expense
    const [expenseResult] = await connection.query(
      `INSERT INTO expenses 
       (company_id, employee_id, amount, currency_code, amount_in_company_currency, 
        category, description, expense_date, approval_rule_id, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [companyId, employeeId, amount, currencyCode, amountInCompanyCurrency, 
       category, description, expenseDate, approvalRuleId, 'pending']
    );

    const expenseId = expenseResult.insertId;

    // Add expense lines if provided
    if (expenseLines && Array.isArray(expenseLines) && expenseLines.length > 0) {
      for (const line of expenseLines) {
        await connection.query(
          'INSERT INTO expense_lines (expense_id, item_name, amount, quantity) VALUES (?, ?, ?, ?)',
          [expenseId, line.itemName, line.amount, line.quantity || 1]
        );
      }
    }

    // Create approval workflow
    if (approvalRuleId) {
      const rule = approvalRules[0];

      // Check if manager approver is required
      if (rule.is_manager_approver && managerId) {
        await connection.query(
          'INSERT INTO approvals (expense_id, approver_id, step_number, status) VALUES (?, ?, ?, ?)',
          [expenseId, managerId, 1, 'pending']
        );
      }

      // Get additional approval steps
      const [approvalSteps] = await connection.query(
        'SELECT * FROM approval_steps WHERE approval_rule_id = ? ORDER BY step_order',
        [approvalRuleId]
      );

      const startStep = (rule.is_manager_approver && managerId) ? 2 : 1;
      
      for (let i = 0; i < approvalSteps.length; i++) {
        await connection.query(
          'INSERT INTO approvals (expense_id, approver_id, step_number, status) VALUES (?, ?, ?, ?)',
          [expenseId, approvalSteps[i].approver_id, startStep + i, 'pending']
        );
      }
    } else if (managerId) {
      // Default: if no rule, just assign to manager
      await connection.query(
        'INSERT INTO approvals (expense_id, approver_id, step_number, status) VALUES (?, ?, ?, ?)',
        [expenseId, managerId, 1, 'pending']
      );
    }

    await connection.commit();

    res.status(201).json({
      message: 'Expense created successfully',
      expense: {
        id: expenseId,
        amount,
        currencyCode,
        amountInCompanyCurrency,
        category,
        description,
        expenseDate,
        status: 'pending'
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Server error while creating expense' });
  } finally {
    connection.release();
  }
};

const getMyExpenses = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT e.*, c.currency_code as company_currency
      FROM expenses e
      JOIN companies c ON e.company_id = c.id
      WHERE e.employee_id = ?
    `;
    
    const params = [employeeId];

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    query += ' ORDER BY e.created_at DESC';

    const [expenses] = await pool.query(query, params);

    // Get expense lines for each expense
    for (let expense of expenses) {
      const [lines] = await pool.query(
        'SELECT * FROM expense_lines WHERE expense_id = ?',
        [expense.id]
      );
      expense.lines = lines;

      // Get approval history
      const [approvals] = await pool.query(
        `SELECT a.*, u.first_name, u.last_name, u.role
         FROM approvals a
         JOIN users u ON a.approver_id = u.id
         WHERE a.expense_id = ?
         ORDER BY a.step_number`,
        [expense.id]
      );
      expense.approvals = approvals;
    }

    res.json({ expenses });

  } catch (error) {
    console.error('Get my expenses error:', error);
    res.status(500).json({ error: 'Server error while fetching expenses' });
  }
};

const getPendingApprovals = async (req, res) => {
  try {
    const approverId = req.user.id;

    const [expenses] = await pool.query(
      `SELECT e.*, 
              u.first_name as employee_first_name, 
              u.last_name as employee_last_name,
              a.step_number, a.comments, a.id as approval_id
       FROM expenses e
       JOIN users u ON e.employee_id = u.id
       JOIN approvals a ON e.id = a.expense_id
       WHERE a.approver_id = ? 
       AND a.status = 'pending'
       AND e.current_step = a.step_number
       ORDER BY e.created_at DESC`,
      [approverId]
    );

    // Get expense lines for each
    for (let expense of expenses) {
      const [lines] = await pool.query(
        'SELECT * FROM expense_lines WHERE expense_id = ?',
        [expense.id]
      );
      expense.lines = lines;
    }

    res.json({ expenses });

  } catch (error) {
    console.error('Get pending approvals error:', error);
    res.status(500).json({ error: 'Server error while fetching pending approvals' });
  }
};

const approveOrRejectExpense = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { expenseId } = req.params;
    const { action, comments } = req.body; // action: 'approve' or 'reject'
    const approverId = req.user.id;

    if (!['approve', 'reject'].includes(action)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Invalid action. Must be approve or reject' });
    }

    // Get expense details
    const [expenses] = await connection.query(
      'SELECT * FROM expenses WHERE id = ?',
      [expenseId]
    );

    if (expenses.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Expense not found' });
    }

    const expense = expenses[0];

    // Get current approval
    const [approvals] = await connection.query(
      `SELECT * FROM approvals 
       WHERE expense_id = ? AND approver_id = ? AND step_number = ? AND status = 'pending'`,
      [expenseId, approverId, expense.current_step]
    );

    if (approvals.length === 0) {
      await connection.rollback();
      return res.status(403).json({ error: 'Not authorized to approve this expense at current step' });
    }

    const approval = approvals[0];

    // Update approval
    await connection.query(
      'UPDATE approvals SET status = ?, comments = ?, approved_at = NOW() WHERE id = ?',
      [action === 'approve' ? 'approved' : 'rejected', comments, approval.id]
    );

    if (action === 'reject') {
      // If rejected, mark expense as rejected
      await connection.query(
        'UPDATE expenses SET status = ? WHERE id = ?',
        ['rejected', expenseId]
      );

      await connection.commit();
      return res.json({ message: 'Expense rejected successfully' });
    }

    // If approved, check approval rule
    const [approvalRules] = await connection.query(
      'SELECT * FROM approval_rules WHERE id = ?',
      [expense.approval_rule_id]
    );

    let expenseApproved = false;

    if (approvalRules.length > 0) {
      const rule = approvalRules[0];

      // Check for specific approver rule
      if (rule.specific_approver_id === approverId) {
        expenseApproved = true;
      }

      // Check percentage rule
      if (rule.rule_type === 'percentage' || rule.rule_type === 'hybrid') {
        const [allApprovals] = await connection.query(
          'SELECT * FROM approvals WHERE expense_id = ?',
          [expenseId]
        );

        const totalApprovers = allApprovals.length;
        const approvedCount = allApprovals.filter(a => a.status === 'approved').length;
        const approvalPercentage = (approvedCount / totalApprovers) * 100;

        if (approvalPercentage >= rule.percentage_threshold) {
          expenseApproved = true;
        }
      }
    }

    if (expenseApproved) {
      // Mark expense as fully approved
      await connection.query(
        'UPDATE expenses SET status = ? WHERE id = ?',
        ['approved', expenseId]
      );

      await connection.commit();
      return res.json({ message: 'Expense fully approved' });
    }

    // Check if there are more steps
    const [nextApprovals] = await connection.query(
      'SELECT * FROM approvals WHERE expense_id = ? AND step_number > ? ORDER BY step_number LIMIT 1',
      [expenseId, expense.current_step]
    );

    if (nextApprovals.length > 0) {
      // Move to next step
      await connection.query(
        'UPDATE expenses SET current_step = ? WHERE id = ?',
        [nextApprovals[0].step_number, expenseId]
      );

      await connection.commit();
      return res.json({ message: 'Expense approved. Moved to next approval step' });
    }

    // No more steps, approve the expense
    await connection.query(
      'UPDATE expenses SET status = ? WHERE id = ?',
      ['approved', expenseId]
    );

    await connection.commit();
    res.json({ message: 'Expense fully approved' });

  } catch (error) {
    await connection.rollback();
    console.error('Approve/Reject expense error:', error);
    res.status(500).json({ error: 'Server error while processing approval' });
  } finally {
    connection.release();
  }
};

const getAllExpenses = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const { status, startDate, endDate } = req.query;

    let query = `
      SELECT e.*, 
             u.first_name as employee_first_name, 
             u.last_name as employee_last_name,
             c.currency_code as company_currency
      FROM expenses e
      JOIN users u ON e.employee_id = u.id
      JOIN companies c ON e.company_id = c.id
      WHERE e.company_id = ?
    `;
    
    const params = [companyId];

    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }

    if (startDate) {
      query += ' AND e.expense_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND e.expense_date <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY e.created_at DESC';

    const [expenses] = await pool.query(query, params);

    // Get expense lines and approvals for each
    for (let expense of expenses) {
      const [lines] = await pool.query(
        'SELECT * FROM expense_lines WHERE expense_id = ?',
        [expense.id]
      );
      expense.lines = lines;

      const [approvals] = await pool.query(
        `SELECT a.*, u.first_name, u.last_name, u.role
         FROM approvals a
         JOIN users u ON a.approver_id = u.id
         WHERE a.expense_id = ?
         ORDER BY a.step_number`,
        [expense.id]
      );
      expense.approvals = approvals;
    }

    res.json({ expenses });

  } catch (error) {
    console.error('Get all expenses error:', error);
    res.status(500).json({ error: 'Server error while fetching expenses' });
  }
};

const getTeamExpenses = async (req, res) => {
  try {
    const managerId = req.user.id;

    const [expenses] = await pool.query(
      `SELECT e.*, 
              u.first_name as employee_first_name, 
              u.last_name as employee_last_name
       FROM expenses e
       JOIN users u ON e.employee_id = u.id
       WHERE u.manager_id = ?
       ORDER BY e.created_at DESC`,
      [managerId]
    );

    // Get expense lines for each
    for (let expense of expenses) {
      const [lines] = await pool.query(
        'SELECT * FROM expense_lines WHERE expense_id = ?',
        [expense.id]
      );
      expense.lines = lines;

      const [approvals] = await pool.query(
        `SELECT a.*, u.first_name, u.last_name, u.role
         FROM approvals a
         JOIN users u ON a.approver_id = u.id
         WHERE a.expense_id = ?
         ORDER BY a.step_number`,
        [expense.id]
      );
      expense.approvals = approvals;
    }

    res.json({ expenses });

  } catch (error) {
    console.error('Get team expenses error:', error);
    res.status(500).json({ error: 'Server error while fetching team expenses' });
  }
};

module.exports = {
  createExpense,
  getMyExpenses,
  getPendingApprovals,
  approveOrRejectExpense,
  getAllExpenses,
  getTeamExpenses
};