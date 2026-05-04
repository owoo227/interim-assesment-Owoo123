const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const walletRoutes = require('./routes/wallet.routes');
const transactionRoutes = require('./routes/transaction.routes');
const swapRoutes = require('./routes/swap.routes');
const marketRoutes = require('./routes/market.routes');
const kycRoutes = require('./routes/kyc.routes');
const subscriptionRoutes = require('./routes/subscription.routes');
const cryptoRoutes = require('./routes/crypto.routes');
const { register, login } = require('./controllers/auth.controller');
const { getMe } = require('./controllers/user.controller');
const { protect } = require('./middleware/auth.middleware');
const { validate } = require('./middleware/validate.middleware');
const { body } = require('express-validator');

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow server-to-server / curl (no origin header) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin || true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// Explicit OPTIONS preflight handler for all routes
app.options('*', cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin || true);
    } else {
      callback(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/swap', swapRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/crypto', cryptoRoutes);

// README-spec top-level shortcuts (exact paths from the assignment)
app.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  register
);
app.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  login
);
app.get('/profile', protect, getMe);
app.use('/crypto', cryptoRoutes);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// Root landing page for the backend - concise, professional project overview
app.get('/', (_req, res) => {
  res.type('html').send(`<!doctype html>
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Interim Assessment API</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #0f172a; background: #f8fafc; margin: 0; padding: 40px; }
        .container { max-width: 900px; margin: 0 auto; background: #fff; border-radius: 8px; box-shadow: 0 6px 18px rgba(2,6,23,0.08); padding: 28px; }
        h1 { margin-top: 0; color: #0b5cff; }
        p.lead { color: #334155; }
        ul { color: #475569; }
        a { color: #0b5cff; text-decoration: none; }
        footer { margin-top: 20px; color: #94a3b8; font-size: 13px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Interim Assessment — Backend API</h1>
        <p class="lead">This service implements the backend for a cryptocurrency wallet and exchange demo used in the Multimedia and Web Design L300 assessment.</p>

        <h3>What this project provides</h3>
        <ul>
          <li>User registration, authentication (JWT + refresh tokens), and profile endpoints.</li>
          <li>Wallet management with balances and simulated market prices.</li>
          <li>Transactions, swaps, subscriptions, and KYC document upload endpoints.</li>
          <li>Seeded sample crypto data and a background price simulator for demo purposes.</li>
        </ul>

        <h3>Tech stack</h3>
        <ul>
          <li>Node.js + Express — HTTP API and middleware.</li>
          <li>MongoDB (configured in <code>server/config/db.js</code>) for persistence.</li>
          <li>JSON Web Tokens for auth, file uploads for KYC, and express-validator for input validation.</li>
        </ul>

        <h3>Useful endpoints</h3>
        <ul>
          <li><a href="/api/health">/api/health</a> — health check (returns JSON status)</li>
          <li><a href="/register">/register</a> — registration (POST)</li>
          <li><a href="/login">/login</a> — login (POST)</li>
          <li><a href="/api/crypto">/api/crypto</a> — crypto listings and prices</li>
        </ul>

        <p>To run locally: ensure MongoDB is reachable, set environment variables in a <code>.env</code> file, then start the server (see <code>server/README.md</code>).</p>

        <footer>Maintainer: Multimedia and Web Design L300 • API version: 1.0</footer>
      </div>
    </body>
  </html>`);
});

app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

module.exports = app;
