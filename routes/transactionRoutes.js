
const express = require('express');
const auth = require('../middleware/auth');
const {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  validateTransaction,
} = require('../controllers/transactionController');

const router = express.Router();


router.get('/', auth, getTransactions);
router.post('/', auth, validateTransaction, createTransaction);
router.put('/:id', auth, validateTransaction, updateTransaction);
router.delete('/:id', auth, deleteTransaction);

module.exports = router;