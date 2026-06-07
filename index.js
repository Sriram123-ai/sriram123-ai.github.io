/**
 * Nexora IoT Solutions - Express Backend Server
 */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Route imports
const contactRoutes = require('./routes/contact');
const supportRoutes = require('./routes/support');
const careerRoutes = require('./routes/career');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// API Routes
app.use('/contact', contactRoutes);
app.use('/support', supportRoutes);
app.use('/career', careerRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Nexora IoT Solutions API is running', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Nexora IoT Server running on http://localhost:${PORT}`);
});
