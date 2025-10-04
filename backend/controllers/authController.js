const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const axios = require('axios');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const signup = async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const { email, password, firstName, lastName, country } = req.body;

    // Validate input
    if (!email || !password || !firstName || !lastName || !country) {
      await connection.rollback();
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const [existingUsers] = await connection.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'User already exists' });
    }

    // Get currency for the country
    const currencyResponse = await axios.get(`https://restcountries.com/v3.1/all?fields=name,currencies`);
    const countries = currencyResponse.data;
    const selectedCountry = countries.find(c => 
      c.name.common.toLowerCase() === country.toLowerCase() ||
      c.name.official.toLowerCase() === country.toLowerCase()
    );

    if (!selectedCountry) {
      await connection.rollback();
      return res.status(400).json({ error: 'Invalid country' });
    }

    const currencyCode = Object.keys(selectedCountry.currencies)[0];

    // Create company
    const [companyResult] = await connection.query(
      'INSERT INTO companies (name, currency_code, country) VALUES (?, ?, ?)',
      [`${firstName}'s Company`, currencyCode, country]
    );

    const companyId = companyResult.insertId;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const [userResult] = await connection.query(
      'INSERT INTO users (company_id, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)',
      [companyId, email, hashedPassword, firstName, lastName, 'admin']
    );

    const userId = userResult.insertId;

    await connection.commit();

    const token = generateToken(userId);

    res.status(201).json({
      message: 'User and company created successfully',
      token,
      user: {
        id: userId,
        email,
        firstName,
        lastName,
        role: 'admin',
        companyId,
        currency: currencyCode
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Server error during signup' });
  } finally {
    connection.release();
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Get user with company info
    const [users] = await pool.query(
      `SELECT u.*, c.currency_code 
       FROM users u 
       JOIN companies c ON u.company_id = c.id 
       WHERE u.email = ? AND u.is_active = TRUE`,
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        companyId: user.company_id,
        currency: user.currency_code
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
};

module.exports = { signup, login };