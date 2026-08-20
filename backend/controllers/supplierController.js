const { Supplier, Product } = require('../models');

exports.createSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.create({ ...req.body, shopId: req.shopId });
    res.status(201).json(supplier);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.findAll({ where: { shopId: req.shopId } });
    res.json(suppliers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const linkedProduct = await Product.findOne({ where: { supplier: req.params.id, shopId: req.shopId } });
    if (linkedProduct) {
      return res.status(400).json({ error: 'Cannot delete supplier: referenced by existing products' });
    }
    const deleted = await Supplier.destroy({ where: { id: req.params.id, shopId: req.shopId } });
    if (!deleted) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    res.json({ message: 'Supplier deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findOne({ where: { id: req.params.id, shopId: req.shopId } });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }
    await Supplier.update(req.body, { where: { id: req.params.id, shopId: req.shopId } });
    const updatedSupplier = await Supplier.findByPk(req.params.id);
    res.json(updatedSupplier);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
