require('dotenv').config();
const { initDatabase } = require('../config/config');

initDatabase()
  .then(() => {
    console.log('DB init done');
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
