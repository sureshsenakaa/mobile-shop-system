const { Part } = require('../models');

exports.createPart = async (req, res) => {
  try {
    const partData = { ...req.body };
    partData.shopId = req.shopId || (req.user && req.user.shopId) || 1;
    
    if (!partData.sku || !String(partData.sku).trim()) {
      partData.sku = 'PRT-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
    }
    // Auto-generate 12-digit barcode (same format as products)
    if (!partData.barcode || !String(partData.barcode).trim()) {
      partData.barcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    }
    partData.cost = Number(partData.cost) || 0;
    partData.quantity = Number(partData.quantity) || 0;
    
    const options = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const part = await Part.create(partData, options);
    res.status(201).json(part);
  } catch (err) {
    console.error('Error creating part:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getParts = async (req, res) => {
  try {
    const parts = await Part.findAll({ where: { shopId: req.shopId } });
    res.json(parts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePart = async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.cost) update.cost = Number(update.cost);
    if (update.quantity) update.quantity = Number(update.quantity);
    
    const part = await Part.findOne({ where: { id: req.params.id, shopId: req.shopId } });
    if (!part) return res.status(404).json({ error: 'Part not found' });
    
    await Part.update(update, { where: { id: req.params.id, shopId: req.shopId } });
    const updatedPart = await Part.findByPk(req.params.id);
    res.json(updatedPart);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deletePart = async (req, res) => {
  try {
    const deleted = await Part.destroy({ where: { id: req.params.id, shopId: req.shopId } });
    if (!deleted) return res.status(404).json({ error: 'Part not found' });
    res.json({ message: 'Part deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
