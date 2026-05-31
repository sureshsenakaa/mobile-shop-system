const mongoose = require('mongoose');
const { Repair } = require('../models');

const isDbReady = () => mongoose.connection.readyState === 1;

exports.createRepair = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const repairData = { ...req.body };
    if (repairData.cost) repairData.cost = Number(repairData.cost);
    const repair = new Repair(repairData);
    await repair.save();
    res.status(201).json(repair);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getRepairs = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.json([]);
    }

    const repairs = await Repair.find();
    res.json(repairs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRepair = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const update = { ...req.body };
    if (update.cost) update.cost = Number(update.cost);
    const repair = await Repair.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!repair) return res.status(404).json({ error: 'Repair not found' });
    res.json(repair);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteRepair = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const repair = await Repair.findByIdAndDelete(req.params.id);
    if (!repair) return res.status(404).json({ error: 'Repair not found' });
    res.json({ message: 'Repair deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
