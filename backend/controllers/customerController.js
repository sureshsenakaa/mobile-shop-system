const mongoose = require('mongoose');
const { Customer } = require('../models');

const isDbReady = () => mongoose.connection.readyState === 1;

exports.createCustomer = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const mobile = req.body.mobile && req.body.mobile.trim();
    if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });

    const existing = await Customer.findOne({ mobile });
    if (existing) return res.status(409).json({ error: 'Customer with this mobile number already exists' });

    const customer = new Customer({ ...req.body, mobile });
    await customer.save();
    res.status(201).json(customer);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


exports.getCustomers = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.json([]);
    }

    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCustomerById = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { id } = req.params;
    const customer = await Customer.findById(id);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { id } = req.params;
    await Customer.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
