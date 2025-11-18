
const { Pool } = require('pg');
require('dotenv').config();


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, 
  },
});


pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('PostgreSQL connection failed:', err.stack);
  } else {
    console.log(' Connected to PostgreSQL');
  }
});

module.exports = pool;