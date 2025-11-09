
const pool = require('../config/db');

const createRecurringTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
      amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
      description VARCHAR(255),
      category VARCHAR(50) NOT NULL,
      frequency VARCHAR(10) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
      start_date DATE NOT NULL DEFAULT CURRENT_DATE,
      end_date DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  try {
    await pool.query(query);
    console.log(' Recurring transactions table created');
  } catch (err) {
    console.error('Error creating recurring transactions table:', err);
  }
};

createRecurringTable();