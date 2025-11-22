require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const recurringRoutes = require('./routes/recurringRoutes');
const exportRoutes = require('./routes/exportRoutes');

const { getDashboardSummary } = require('./controllers/dashboardController');
const auth = require('./middleware/auth');
const pool = require('./config/db');

const app = express();


const allowedOrigins = [
  'http://localhost:5173',
  'https://wechi-gebi-frontend.vercel.app'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log(' Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);


app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false, 
  })
);

app.use(morgan('combined'));
app.use(express.json());



app.get('/', (req, res) => {
  res.send('Wechi Gebi Backend is running');
});

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/export', exportRoutes);

app.get('/api/dashboard', auth, getDashboardSummary);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend OK' });
});

app.get('/setup', async (req, res) => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS transactions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
      amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
      description VARCHAR(255),
      category VARCHAR(50) NOT NULL,
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    `CREATE TABLE IF NOT EXISTS budgets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category VARCHAR(50) NOT NULL,
      monthly_limit DECIMAL(12, 2) NOT NULL CHECK (monthly_limit > 0),
      month DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),
      created_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, category, month)
    );`,

    `CREATE TABLE IF NOT EXISTS recurring_transactions (
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
    );`
  ];

  try {
    for (const query of queries) {
      await pool.query(query);
    }

    res.json({
      success: true,
      message: 'All tables created successfully with password_hash column.'
    });
  } catch (err) {
    console.error('Setup failed:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/fix-passwords', async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Not allowed in production' });
  }

  const users = await pool.query('SELECT id, password_hash FROM users');

  for (const user of users.rows) {
    if (!user.password_hash || user.password_hash.length < 40) {
      const newHash = await bcrypt.hash('password123', 12);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, user.id]);
    }
  }

  res.json({ message: 'All weak passwords fixed (dev mode only)' });
});



app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});


const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(` Server running on http://localhost:${PORT}`)
);
