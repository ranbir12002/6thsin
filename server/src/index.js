require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const frontpageRoutes = require('./routes/frontpage');
const menuRoutes = require('./routes/menu');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));

// --- Routes ---
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '6th SIN API is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/frontpage', frontpageRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/upload', uploadRoutes);

// --- 404 handler ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// --- Global error handler ---
app.use(errorHandler);

// --- Start server ---
async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`\n🚀 6th SIN API server running on http://localhost:${PORT}`);
    console.log(`   Health check: http://localhost:${PORT}/api/health\n`);
  });
}

start();
