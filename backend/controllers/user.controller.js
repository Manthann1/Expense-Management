const bcrypt = require('bcryptjs');
const { pool } = require('../config/config');

const userController = {
  createUser: async (req, res) => {
    try {
      const { email, password, firstName, lastName, role, managerId } = req.body;
      const companyId = req.user.companyId;

      if (!['Manager', 'Employee'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role. Must be Manager or Employee' });
      }

      const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const result = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, manager_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, email, first_name, last_name, role`,
        [email, passwordHash, firstName, lastName, role, companyId, managerId || null]
      );

      res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
    } catch (err) {
      console.error('Create user error:', err);
      res.status(500).json({ error: 'Failed to create user' });
    }
  },

  getUsers: async (req, res) => {
    try {
      const companyId = req.user.companyId;
      const result = await pool.query(
        `SELECT id, email, first_name, last_name, role, manager_id, created_at
         FROM users WHERE company_id = $1 ORDER BY created_at DESC`,
        [companyId]
      );
      res.json({ users: result.rows });
    } catch (err) {
      console.error('Get users error:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  },

  getUserById: async (req, res) => {
    try {
      const { id } = req.params;
      const companyId = req.user.companyId;

      const result = await pool.query(
        `SELECT id, email, first_name, last_name, role, manager_id, created_at
         FROM users WHERE id = $1 AND company_id = $2`,
        [id, companyId]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

      res.json({ user: result.rows[0] });
    } catch (err) {
      console.error('Get user error:', err);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  },
};

module.exports = userController;
