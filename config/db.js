
const { Pool } = require('pg');


const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(' ERROR: DATABASE_URL is not set');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, 
  },
});


pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error(' PostgreSQL connection failed:', err.stack);
  } else {
    console.log(' Connected to PostgreSQL');
  }
});

module.exports = pool;