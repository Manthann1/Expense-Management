const bcrypt = require('bcryptjs');
const { pool } = require('../config/config');
const { signJwt } = require('../utils/jwt');

const authController = {
  register: async (req, res) => {
    const client = await pool.connect();
    try {
      const { email, password, firstName, lastName, companyName } = req.body;
      await client.query('BEGIN');

      const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingUser.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Email already registered' });
      }

      const companyResult = await client.query(
        'INSERT INTO companies (name) VALUES ($1) RETURNING id',
        [companyName]
      );
      const companyId = companyResult.rows[0].id;

      const passwordHash = await bcrypt.hash(password, 10);

      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, company_id)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, company_id`,
        [email, passwordHash, firstName, lastName, 'Admin', companyId]
      );

      const categories = ['Travel', 'Food', 'Office Supplies', 'Software', 'Other'];
      for (const category of categories) {
        await client.query('INSERT INTO categories (company_id, name) VALUES ($1, $2)', [
          companyId,
          category,
        ]);
      }

      await client.query('COMMIT');

      const user = userResult.rows[0];
      const token = signJwt({
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
      });

      res.status(201).json({
        message: 'Company and admin user created successfully',
        token,
        user: { id: user.id, email: user.email, role: user.role, companyId: user.company_id },
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Registration error:', err);
      res.status(500).json({ error: 'Registration failed' });
    } finally {
      client.release();
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const result = await pool.query(
        'SELECT id, email, password_hash, role, company_id, first_name, last_name FROM users WHERE email = $1',
        [email]
      );
      if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

      const user = result.rows[0];
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) return res.status(401).json({ error: 'Invalid credentials' });

      const token = signJwt({
        id: user.id,
        email: user.email,
        role: user.role,
        companyId: user.company_id,
      });

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name,
          companyId: user.company_id,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed' });
    }
  },
};

module.exports = authController;
