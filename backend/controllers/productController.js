const mongoose = require('mongoose');
const { Product, Supplier } = require('../models');

const isDbReady = () => mongoose.connection.readyState === 1;

exports.createProduct = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


exports.getProducts = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.json([]);
    }

    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { id } = req.params;
    await Product.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/products/:id
exports.updateProduct = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { id } = req.params;
    // Only allow a specific set of updatable fields
    const allowed = ['brand','model','ram','storage','color','price','cost','stock','accessoryType','barcode','supplier','supplierName','investor','investorName','imei','imei1','imei2','serialNumber'];
    const update = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        update[key] = req.body[key];
      }
    }

    const product = await Product.findByIdAndUpdate(id, { $set: update }, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/products/:id/restock
exports.restockProduct = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { id } = req.params;
    const { quantity } = req.body;
    const qty = Number(quantity);
    if (!qty || isNaN(qty) || qty <= 0) return res.status(400).json({ error: 'Invalid quantity' });

    // If a supplierId is provided, resolve supplier name and set supplier fields on product
    const { supplierId } = req.body || {};
    const update = { $inc: { stock: qty } };
    if (supplierId) {
      // try to resolve supplier name
      const sup = await Supplier.findById(supplierId).lean();
      if (sup) {
        update.$set = { supplier: sup._id, supplierName: sup.name };
      }
    }

    const product = await Product.findByIdAndUpdate(id, update, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
