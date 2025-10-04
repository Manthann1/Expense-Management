const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const signJwt = (payload, options = { expiresIn: '24h' }) =>
  jwt.sign(payload, JWT_SECRET, options);

const verifyJwt = (token) =>
  new Promise((resolve, reject) =>
    jwt.verify(token, JWT_SECRET, (err, user) => (err ? reject(err) : resolve(user)))
  );

module.exports = { JWT_SECRET, signJwt, verifyJwt };
