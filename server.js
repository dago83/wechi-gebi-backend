require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const budgetRoutes = require('./routes/budgetRoutes');
const recurringRoutes = require('./routes/recurringRoutes');
const exportRoutes = require('./routes/exportRoutes');
const auth = require('./middleware/auth');
const { getDashboardSummary } = require('./controllers/dashboardController');

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://wechi-gebi-frontend.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const vercelPattern = /\.vercel\.app$/;
      const isAllowed =
        allowedOrigins.includes(origin) ||
        vercelPattern.test(new URL(origin).hostname);

      if (isAllowed) return callback(null, true);

      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("CORS blocked: " + origin));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);
app.use(morgan("combined"));
app.use(express.json());
app.get("/", (req, res) => res.send("Wechi Gebi Backend is running"));

app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/recurring", recurringRoutes);
app.use("/api/export", exportRoutes);

app.get("/api/dashboard", auth, getDashboardSummary);

app.get("/api/health", (req, res) => {
  res.json({ status: "Backend OK" });
});

app.get("/setup", async (req, res) => {
  try {
    const queries = [
      `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
        amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
        description VARCHAR(255),
        category VARCHAR(50) NOT NULL,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        monthly_limit DECIMAL(12,2) NOT NULL CHECK (monthly_limit > 0),
        month DATE NOT NULL DEFAULT DATE_TRUNC('month', CURRENT_DATE),
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, category, month)
      );
      `,
      `
      CREATE TABLE IF NOT EXISTS recurring_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(10) NOT NULL CHECK (type IN ('income', 'expense')),
        amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
        description VARCHAR(255),
        category VARCHAR(50) NOT NULL,
        frequency VARCHAR(10) NOT NULL CHECK (frequency IN ('daily','weekly','monthly')),
        start_date DATE NOT NULL DEFAULT CURRENT_DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      );
      `
    ];

    for (const q of queries) await pool.query(q);

    res.json({ success: true, message: "All tables created successfully." });
  } catch (err) {
    console.error("SETUP ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


app.get("/migrate-fix-users", async (req, res) => {
  try {
   
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users' AND column_name='password_hash'
        ) THEN
          ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
        END IF;
      END $$;
    `);

    await pool.query(`
      UPDATE users
      SET password_hash = password
      WHERE password_hash IS NULL AND password IS NOT NULL;
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='users' AND column_name='password'
        ) THEN
          ALTER TABLE users DROP COLUMN password;
        END IF;
      END $$;
    `);

    res.json({ message: "Migration complete." });
  } catch (err) {
    console.error("MIGRATION ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () =>
  console.log(` Server running on http://localhost:${PORT}`)
);
