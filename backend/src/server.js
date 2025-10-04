require('dotenv').config();
const app = require('./app');
const { initDatabase } = require('./config/config');

const PORT = process.env.PORT || 3000;

(async () => {
  await initDatabase();
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
})();
