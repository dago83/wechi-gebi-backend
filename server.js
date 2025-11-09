
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes')
const budgetRoutes = require('./routes/budgetRoutes');
const { getDashboardSummary } = require('./controllers/dashboardController');
const auth = require('./middleware/auth');
const recurringRoutes = require('./routes/recurringRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();


app.use(helmet());
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true, 
}));
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
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});