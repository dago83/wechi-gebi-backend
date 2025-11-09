
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

const validateBudget = [
  body('category').notEmpty().withMessage('Category is required'),
  body('monthly_limit').isFloat({ gt: 0 }).withMessage('Monthly limit must be a positive number'),
  body('month').optional().isISO8601().toDate(),
];

const getBudgets = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM budgets WHERE user_id = $1 ORDER BY category',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createOrUpdateBudget = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { category, monthly_limit, month } = req.body;
  const userId = req.user.userId;
  const budgetMonth = month ? new Date(month) : new Date();
 
  budgetMonth.setDate(1);
  budgetMonth.setHours(0, 0, 0, 0);

  try {
    const result = await pool.query(
      `INSERT INTO budgets (user_id, category, monthly_limit, month)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, category, month)
       DO UPDATE SET monthly_limit = $3
       RETURNING *`,
      [userId, category, monthly_limit, budgetMonth]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteBudget = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'DELETE FROM budgets WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Budget not found or access denied' });
    }
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
  validateBudget,
};