
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Customer, Product, Sale, Repair, Supplier } = require('./models');

const customerRoutes = require('./routes/customerRoutes');
const productRoutes = require('./routes/productRoutes');
const saleRoutes = require('./routes/saleRoutes');
const repairRoutes = require('./routes/repairRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const investorRoutes = require('./routes/investorRoutes');

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/mobile-shop';

if (!process.env.MONGODB_URI && !process.env.MONGO_URL) {
  console.warn('No MONGODB_URI or MONGO_URL set; falling back to local MongoDB.');
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err && err.message ? err.message : err);
    console.error('Tried URI:', process.env.MONGODB_URI ? 'from process.env.MONGODB_URI' : process.env.MONGO_URL ? 'from process.env.MONGO_URL' : 'local fallback URI');
    console.warn('Continuing without a live MongoDB connection so the HTTP server stays reachable.');
  });

// Authentication removed: no default user creation or auth routes mounted

// Simple request logger to help diagnose request routing issues
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Use routes
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/investors', investorRoutes);

app.get('/', (req, res) => {
  res.send('Mobile Shop Backend API');
});

// Return JSON for any unmatched /api routes (avoid Express default HTML 404)
app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.method} ${req.originalUrl}` });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

