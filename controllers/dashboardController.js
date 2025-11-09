
const pool = require('../config/db');

const getDashboardSummary = async (req, res) => {
  const userId = req.user.userId;
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  try {
   
    const totals = await pool.query(
      `SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses
       FROM transactions
       WHERE user_id = $1 AND date BETWEEN $2 AND $3`,
      [userId, startOfMonth, endOfMonth]
    );

    const { total_income, total_expenses } = totals.rows[0];
    const balance = total_income - total_expenses;

   
    const budgets = await pool.query(
      `SELECT category, monthly_limit FROM budgets
       WHERE user_id = $1 AND month = $2`,
      [userId, startOfMonth]
    );

    const spending = await pool.query(
      `SELECT category, SUM(amount) AS spent
       FROM transactions
       WHERE user_id = $1 AND type = 'expense' AND date BETWEEN $2 AND $3
       GROUP BY category`,
      [userId, startOfMonth, endOfMonth]
    );

    const spendingMap = {};
    spending.rows.forEach(item => {
      spendingMap[item.category] = parseFloat(item.spent);
    });

  
    const budgetsWithAlerts = budgets.rows.map(budget => {
      const spent = spendingMap[budget.category] || 0;
      const percentUsed = (spent / budget.monthly_limit) * 100;
      const alert = percentUsed >= 90 ? 'warning' : percentUsed >= 75 ? 'caution' : null;
      return {
        ...budget,
        spent,
        percent_used: parseFloat(percentUsed.toFixed(2)),
        alert
      };
    });

    res.json({
      summary: {
        total_income: parseFloat(total_income),
        total_expenses: parseFloat(total_expenses),
        balance: parseFloat(balance),
        currency: 'ETB'
      },
      budgets: budgetsWithAlerts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getDashboardSummary };