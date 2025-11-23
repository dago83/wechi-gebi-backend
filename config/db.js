const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  console.error(" ERROR: DATABASE_URL is not set.");
  process.exit(1);
}

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction
    ? { rejectUnauthorized: false }  
    : false,                         
  max: 20,                           
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("Connected to PostgreSQL:", res.rows[0].now);
  } catch (err) {
    console.error(" PostgreSQL connection failed:", err.message);
    process.exit(1); 
  }
})();

module.exports = pool;
