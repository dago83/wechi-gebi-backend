
const express = require('express');
const { register, login, validateRegister } = require('../controllers/authController');

const router = express.Router();

router.post('/register', validateRegister, register);
router.post('/login', login);

module.exports = router;