
const express = require('express');
const auth = require('../middleware/auth');
const {
  getBudgets,
  createOrUpdateBudget,
  deleteBudget,
  validateBudget,
} = require('../controllers/budgetController');

const router = express.Router();

router.get('/', auth, getBudgets);
router.post('/', auth, validateBudget, createOrUpdateBudget);
router.delete('/:id', auth, deleteBudget);

module.exports = router;