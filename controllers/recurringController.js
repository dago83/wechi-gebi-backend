
const pool = require('../config/db');
const { body, validationResult } = require('express-validator');

const validateRecurring = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be "income" or "expense"'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  body('description').optional().isLength({ max: 255 }),
  body('category').notEmpty().withMessage('Category is required'),
  body('frequency').isIn(['daily', 'weekly', 'monthly']).withMessage('Frequency must be daily, weekly, or monthly'),
  body('start_date').optional().isISO8601().toDate(),
  body('end_date').optional().isISO8601().toDate(),
];

const getRecurring = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM recurring_transactions WHERE user_id = $1 ORDER BY start_date DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const createRecurring = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { type, amount, description, category, frequency, start_date, end_date } = req.body;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      `INSERT INTO recurring_transactions 
       (user_id, type, amount, description, category, frequency, start_date, end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, type, amount, description || null, category, frequency, start_date || new Date(), end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteRecurring = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  try {
    const result = await pool.query(
      'DELETE FROM recurring_transactions WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Recurring rule not found' });
    }
    res.json({ message: 'Recurring rule deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


const generateRecurringTransactions = async (req, res) => {
  const userId = req.user.userId;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    
    const rules = await pool.query(
      `SELECT * FROM recurring_transactions 
       WHERE user_id = $1 
       AND start_date <= $2 
       AND (end_date IS NULL OR end_date >= $2)`,
      [userId, today]
    );

    let generatedCount = 0;

    for (const rule of rules.rows) {
      
      const existing = await pool.query(
        `SELECT id FROM transactions 
         WHERE user_id = $1 AND description = $2 AND date = $3`,
        [userId, `[Recurring] ${rule.description || rule.category}`, today]
      );

      if (existing.rows.length > 0) continue; // Skip if already created today

      let shouldGenerate = false;
      const startDate = new Date(rule.start_date);
      const diffTime = today - startDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      switch (rule.frequency) {
        case 'daily':
          shouldGenerate = true;
          break;
        case 'weekly':
          shouldGenerate = diffDays >= 0 && diffDays % 7 === 0;
          break;
        case 'monthly':
          shouldGenerate = today.getDate() === startDate.getDate();
          break;
      }

      if (shouldGenerate) {
        await pool.query(
          `INSERT INTO transactions 
           (user_id, type, amount, description, category, date)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            rule.type,
            rule.amount,
            `[Recurring] ${rule.description || rule.category}`,
            rule.category,
            today
          ]
        );
        generatedCount++;
      }
    }

    res.json({ message: `${generatedCount} recurring transaction(s) generated` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getRecurring,
  createRecurring,
  deleteRecurring,
  generateRecurringTransactions,
  validateRecurring,
};