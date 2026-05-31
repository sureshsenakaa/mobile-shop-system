const mongoose = require('mongoose');
const { Expense } = require('../models');

const isDbReady = () => mongoose.connection.readyState === 1;

exports.createExpense = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const expense = new Expense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/expenses?month=YYYY-MM
exports.getExpenses = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.json([]);
    }

    const { month } = req.query;
    if (month) {
      // month is YYYY-MM
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      const expenses = await Expense.find({ date: { $gte: start, $lt: end } }).sort({ date: 1 });
      return res.json(expenses);
    }
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/expenses/monthly - aggregate total per category for month (optional month query)
exports.getMonthlyExpenses = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.json([]);
    }

    const { month } = req.query;
    const match = {};
    if (month) {
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      match.date = { $gte: start, $lt: end };
    }

    const agg = await Expense.aggregate([
      { $match: match },
      { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);
    res.json(agg.map(a => ({ category: a._id, total: a.total, count: a.count })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
