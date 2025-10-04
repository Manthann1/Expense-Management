const { pool } = require('../config/database');

const createApprovalRule = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { 
      name, 
      ruleType, 
      percentageThreshold, 
      specificApproverId, 
      isManagerApprover, 
      approvalSteps 
    } = req.body;
    
    const companyId = req.user.company_id;

    // Validate input
    if (!name || !ruleType) {
      await connection.rollback();
      return res.status(400).json({ error: 'Name and rule type are required' });
    }

    // Validate rule type
    if (!['percentage', 'specific_approver', 'hybrid'].includes(ruleType)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Invalid rule type' });
    }

    // Validate percentage for percentage/hybrid rules
    if ((ruleType === 'percentage' || ruleType === 'hybrid') && 
        (!percentageThreshold || percentageThreshold < 1 || percentageThreshold > 100)) {
      await connection.rollback();
      return res.status(400).json({ error: 'Valid percentage threshold (1-100) required' });
    }

    // Validate specific approver for specific_approver/hybrid rules
    if ((ruleType === 'specific_approver' || ruleType === 'hybrid') && !specificApproverId) {
      await connection.rollback();
      return res.status(400).json({ error: 'Specific approver ID required' });
    }

    // Deactivate all existing rules for the company (only one active rule at a time)
    await connection.query(
      'UPDATE approval_rules SET is_active = FALSE WHERE company_id = ?',
      [companyId]
    );

    // Create approval rule
    const [ruleResult] = await connection.query(
      `INSERT INTO approval_rules 
       (company_id, name, rule_type, percentage_threshold, specific_approver_id, is_manager_approver, is_active) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        companyId, 
        name, 
        ruleType, 
        percentageThreshold || null, 
        specificApproverId || null, 
        isManagerApprover !== false, // Default true
        true
      ]
    );

    const ruleId = ruleResult.insertId;

    // Add approval steps if provided
    if (approvalSteps && Array.isArray(approvalSteps) && approvalSteps.length > 0) {
      for (let i = 0; i < approvalSteps.length; i++) {
        const step = approvalSteps[i];
        
        // Verify approver exists and belongs to same company
        const [approvers] = await connection.query(
          'SELECT id FROM users WHERE id = ? AND company_id = ? AND role IN (?, ?)',
          [step.approverId, companyId, 'manager', 'admin']
        );

        if (approvers.length === 0) {
          await connection.rollback();
          return res.status(400).json({ 
            error: `Invalid approver ID at step ${i + 1}` 
          });
        }

        await connection.query(
          'INSERT INTO approval_steps (approval_rule_id, step_order, approver_id) VALUES (?, ?, ?)',
          [ruleId, i + 1, step.approverId]
        );
      }
    }

    await connection.commit();

    res.status(201).json({
      message: 'Approval rule created successfully',
      rule: {
        id: ruleId,
        name,
        ruleType,
        percentageThreshold,
        specificApproverId,
        isManagerApprover: isManagerApprover !== false
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Create approval rule error:', error);
    res.status(500).json({ error: 'Server error while creating approval rule' });
  } finally {
    connection.release();
  }
};

const getApprovalRules = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const [rules] = await pool.query(
      `SELECT ar.*, 
              u.first_name as approver_first_name, 
              u.last_name as approver_last_name
       FROM approval_rules ar
       LEFT JOIN users u ON ar.specific_approver_id = u.id
       WHERE ar.company_id = ?
       ORDER BY ar.is_active DESC, ar.created_at DESC`,
      [companyId]
    );

    // Get approval steps for each rule
    for (let rule of rules) {
      const [steps] = await pool.query(
        `SELECT ast.*, u.first_name, u.last_name, u.role
         FROM approval_steps ast
         JOIN users u ON ast.approver_id = u.id
         WHERE ast.approval_rule_id = ?
         ORDER BY ast.step_order`,
        [rule.id]
      );
      rule.steps = steps;
    }

    res.json({ rules });

  } catch (error) {
    console.error('Get approval rules error:', error);
    res.status(500).json({ error: 'Server error while fetching approval rules' });
  }
};

const updateApprovalRule = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { ruleId } = req.params;
    const { 
      name, 
      ruleType, 
      percentageThreshold, 
      specificApproverId, 
      isManagerApprover, 
      approvalSteps,
      isActive
    } = req.body;
    
    const companyId = req.user.company_id;

    // Check if rule exists and belongs to company
    const [rules] = await connection.query(
      'SELECT id FROM approval_rules WHERE id = ? AND company_id = ?',
      [ruleId, companyId]
    );

    if (rules.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Approval rule not found' });
    }

    // If activating this rule, deactivate others
    if (isActive === true) {
      await connection.query(
        'UPDATE approval_rules SET is_active = FALSE WHERE company_id = ? AND id != ?',
        [companyId, ruleId]
      );
    }

    // Update rule
    await connection.query(
      `UPDATE approval_rules 
       SET name = ?, rule_type = ?, percentage_threshold = ?, 
           specific_approver_id = ?, is_manager_approver = ?, is_active = ?
       WHERE id = ?`,
      [
        name, 
        ruleType, 
        percentageThreshold || null, 
        specificApproverId || null, 
        isManagerApprover,
        isActive !== undefined ? isActive : true,
        ruleId
      ]
    );

    // Delete existing steps
    await connection.query(
      'DELETE FROM approval_steps WHERE approval_rule_id = ?',
      [ruleId]
    );

    // Add new approval steps if provided
    if (approvalSteps && Array.isArray(approvalSteps) && approvalSteps.length > 0) {
      for (let i = 0; i < approvalSteps.length; i++) {
        const step = approvalSteps[i];
        
        await connection.query(
          'INSERT INTO approval_steps (approval_rule_id, step_order, approver_id) VALUES (?, ?, ?)',
          [ruleId, i + 1, step.approverId]
        );
      }
    }

    await connection.commit();

    res.json({ message: 'Approval rule updated successfully' });

  } catch (error) {
    await connection.rollback();
    console.error('Update approval rule error:', error);
    res.status(500).json({ error: 'Server error while updating approval rule' });
  } finally {
    connection.release();
  }
};

const deleteApprovalRule = async (req, res) => {
  try {
    const { ruleId } = req.params;
    const companyId = req.user.company_id;

    // Check if rule exists and belongs to company
    const [rules] = await pool.query(
      'SELECT id FROM approval_rules WHERE id = ? AND company_id = ?',
      [ruleId, companyId]
    );

    if (rules.length === 0) {
      return res.status(404).json({ error: 'Approval rule not found' });
    }

    // Delete rule (cascade will delete approval_steps)
    await pool.query(
      'DELETE FROM approval_rules WHERE id = ?',
      [ruleId]
    );

    res.json({ message: 'Approval rule deleted successfully' });

  } catch (error) {
    console.error('Delete approval rule error:', error);
    res.status(500).json({ error: 'Server error while deleting approval rule' });
  }
};

module.exports = {
  createApprovalRule,
  getApprovalRules,
  updateApprovalRule,
  deleteApprovalRule
};