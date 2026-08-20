const { Repair } = require('../models');

exports.createRepair = async (req, res) => {
  try {
    const repairData = { ...req.body, shopId: req.shopId };
    const count = await Repair.count({ where: { shopId: req.shopId } });
    repairData.repairId = `REP-${String(count + 1).padStart(4, '0')}`;
    if (repairData.cost) repairData.cost = Number(repairData.cost);
    if (repairData.estimatedCost) repairData.estimatedCost = Number(repairData.estimatedCost);
    if (repairData.paidAmount) repairData.paidAmount = Number(repairData.paidAmount);
    const repair = await Repair.create(repairData);
    res.status(201).json(repair);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getRepairs = async (req, res) => {
  try {
    const repairs = await Repair.findAll({ where: { shopId: req.shopId } });
    res.json(repairs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRepair = async (req, res) => {
  try {
    const update = { ...req.body };
    if (update.cost) update.cost = Number(update.cost);
    
    const repair = await Repair.findOne({ where: { id: req.params.id, shopId: req.shopId } });
    if (!repair) return res.status(404).json({ error: 'Repair not found' });
    
    await Repair.update(update, { where: { id: req.params.id, shopId: req.shopId } });
    const updatedRepair = await Repair.findByPk(req.params.id);
    res.json(updatedRepair);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteRepair = async (req, res) => {
  try {
    const deleted = await Repair.destroy({ where: { id: req.params.id, shopId: req.shopId } });
    if (!deleted) return res.status(404).json({ error: 'Repair not found' });
    res.json({ message: 'Repair deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
