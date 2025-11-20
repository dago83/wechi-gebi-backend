
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const { getDashboardSummary } = require('./controllers/dashboardController');
const auth = require('./middleware/auth');
const recurringRoutes = require('./routes/recurringRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();


const allowedOrigins = [
  'http://localhost:5173',
  'https://wechi-gebi-frontend.vercel.app'
];

app.use(helmet());
app.use(
  cors({
    origin: function (origin, callback) {
      
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);
app.use(morgan('combined'));
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/recurring', recurringRoutes);
app.use('/api/export', exportRoutes);

app.get('/api/dashboard', auth, getDashboardSummary);


app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend OK ' });
});

const PORT = process.env.PORT || 5000;

// Add this before app.listen()
app.get('/api/test-db', async (req, res) => {
  try {
    const users = await pool.query('SELECT COUNT(*) FROM public.users');
    const transactions = await pool.query('SELECT COUNT(*) FROM public.transactions');
    const budgets = await pool.query('SELECT COUNT(*) FROM public.budgets');
    const recurring = await pool.query('SELECT COUNT(*) FROM public.recurring_transactions');

    res.json({
      users: users.rows[0].count,
      transactions: transactions.rows[0].count,
      budgets: budgets.rows[0].count,
      recurring: recurring.rows[0].count,
      message: '✅ All tables exist and accessible'
    });
  } catch (err) {
    console.error('❌ Database test failed:', err);
    res.status(500).json({ message: 'Database test failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});