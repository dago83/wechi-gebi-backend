
const express = require('express');
const auth = require('../middleware/auth');
const { exportTransactionsToExcel } = require('../controllers/exportController');

const router = express.Router();

router.get('/transactions', auth, exportTransactionsToExcel);

module.exports = router;


