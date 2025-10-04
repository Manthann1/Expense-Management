const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, role, managerId } = req.body;
    const companyId = req.user.company_id;

    // Validate input
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Validate role
    if (!['employee', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be employee or manager' });
    }

    // If manager is assigned, verify they exist and belong to same company
    if (managerId) {
      const [managers] = await pool.query(
        'SELECT id FROM users WHERE id = ? AND company_id = ? AND role IN (?, ?)',
        [managerId, companyId, 'manager', 'admin']
      );

      if (managers.length === 0) {
        return res.status(400).json({ error: 'Invalid manager ID' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await pool.query(
      'INSERT INTO users (company_id, email, password, first_name, last_name, role, manager_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [companyId, email, hashedPassword, firstName, lastName, role, managerId || null]
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: result.insertId,
        email,
        firstName,
        lastName,
        role,
        managerId
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Server error while creating user' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const companyId = req.user.company_id;

    const [users] = await pool.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.manager_id, u.is_active,
              m.first_name as manager_first_name, m.last_name as manager_last_name
       FROM users u
       LEFT JOIN users m ON u.manager_id = m.id
       WHERE u.company_id = ?
       ORDER BY u.role, u.first_name`,
      [companyId]
    );

    res.json({ users });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Server error while fetching users' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, managerId } = req.body;
    const companyId = req.user.company_id;

    // Validate role
    if (!['employee', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    // Check if user exists and belongs to same company
    const [users] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND company_id = ?',
      [userId, companyId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Cannot change own role
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    // If manager is assigned, verify they exist
    if (managerId) {
      const [managers] = await pool.query(
        'SELECT id FROM users WHERE id = ? AND company_id = ? AND role IN (?, ?)',
        [managerId, companyId, 'manager', 'admin']
      );

      if (managers.length === 0) {
        return res.status(400).json({ error: 'Invalid manager ID' });
      }
    }

    await pool.query(
      'UPDATE users SET role = ?, manager_id = ? WHERE id = ?',
      [role, managerId || null, userId]
    );

    res.json({ message: 'User role updated successfully' });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Server error while updating user role' });
  }
};

const assignManager = async (req, res) => {
  try {
    const { userId } = req.params;
    const { managerId } = req.body;
    const companyId = req.user.company_id;

    // Check if user exists
    const [users] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND company_id = ?',
      [userId, companyId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify manager exists and is actually a manager or admin
    if (managerId) {
      const [managers] = await pool.query(
        'SELECT id FROM users WHERE id = ? AND company_id = ? AND role IN (?, ?)',
        [managerId, companyId, 'manager', 'admin']
      );

      if (managers.length === 0) {
        return res.status(400).json({ error: 'Invalid manager ID or user is not a manager' });
      }
    }

    await pool.query(
      'UPDATE users SET manager_id = ? WHERE id = ?',
      [managerId || null, userId]
    );

    res.json({ message: 'Manager assigned successfully' });

  } catch (error) {
    console.error('Assign manager error:', error);
    res.status(500).json({ error: 'Server error while assigning manager' });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  updateUserRole,
  assignManager
};