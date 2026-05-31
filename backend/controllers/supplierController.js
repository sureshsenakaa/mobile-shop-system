const mongoose = require('mongoose');
const { Supplier, Product } = require('../models');

const isDbReady = () => mongoose.connection.readyState === 1;

exports.createSupplier = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const supplier = new Supplier(req.body);
    await supplier.save();
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.json([]);
    }

    const suppliers = await Supplier.find();
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    // Prevent deletion if any product references this supplier
    const linkedProduct = await Product.findOne({ supplier: req.params.id });
    if (linkedProduct) {
      return res.status(400).json({ error: 'Cannot delete supplier: referenced by existing products' });
    }

    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json(supplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
