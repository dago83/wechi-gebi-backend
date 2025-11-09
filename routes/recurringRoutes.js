
const express = require('express');
const auth = require('../middleware/auth');
const {
  getRecurring,
  createRecurring,
  deleteRecurring,
  generateRecurringTransactions,
  validateRecurring,
} = require('../controllers/recurringController');

const router = express.Router();

router.get('/', auth, getRecurring);
router.post('/', auth, validateRecurring, createRecurring);
router.delete('/:id', auth, deleteRecurring);

router.post('/generate', auth, generateRecurringTransactions);

module.exports = router;