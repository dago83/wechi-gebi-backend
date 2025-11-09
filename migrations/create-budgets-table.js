
const pool = require('../config/db');

const createBudgetsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category VARCHAR(50) NOT NULL,
      monthly_limit DECIMAL(12, 2) NOT NULL CHECK (monthly_limit > 0),
      month DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, category, month)
    );
  `;

  try {
    await pool.query(query);
    console.log(' Budgets table created');
  } catch (err) {
    console.error(' Error creating budgets table:', err);
  }
};

createBudgetsTable();