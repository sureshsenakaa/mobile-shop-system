const mongoose = require('mongoose');
const { Investor, Product, Expense } = require('../models');

const isDbReady = () => mongoose.connection.readyState === 1;

exports.createInvestor = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const inv = new Investor(req.body);
    await inv.save();
    res.status(201).json(inv);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getInvestors = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.json([]);
    }

    const investors = await Investor.find().sort({ dateInvested: -1 });
    // add computed monthlyPayment and nextPaymentDate for convenience
    const out = investors.map(i => {
      const monthlyPayment = (i.amountInvested * (i.monthlyRate || 0)) / 100;
      // prefer stored nextPaymentDate if available
      const next = i.nextPaymentDate ? new Date(i.nextPaymentDate) : (() => { const d = new Date(i.dateInvested); d.setMonth(d.getMonth() + 1); return d; })();
      return {
        _id: i._id,
        name: i.name,
        amountInvested: i.amountInvested,
        dateInvested: i.dateInvested,
        monthlyRate: i.monthlyRate,
        notes: i.notes,
        monthlyPayment,
        nextPaymentDate: next
      };
    });
    res.json(out);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/investors/:id/pay  - mark monthly payment as paid, create expense, advance nextPaymentDate
exports.recordPayment = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { id } = req.params;
    const inv = await Investor.findById(id);
    if (!inv) return res.status(404).json({ error: 'Investor not found' });

    const monthlyPayment = Number(inv.amountInvested || 0) * Number(inv.monthlyRate || 0) / 100;
    // create expense record for this payment
    const expense = new Expense({ category: 'Interest (Paid to investors)', amount: monthlyPayment, date: new Date(), notes: `Monthly payment to ${inv.name}` });
    await expense.save();

    // advance nextPaymentDate by one month (from stored or from now)
    const base = inv.nextPaymentDate ? new Date(inv.nextPaymentDate) : new Date();
    const next = new Date(base);
    next.setMonth(next.getMonth() + 1);
    inv.nextPaymentDate = next;
    await inv.save();

    res.json({ success: true, nextPaymentDate: inv.nextPaymentDate, expenseId: expense._id });
  } catch (err) {
    console.error('Failed to record investor payment', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteInvestor = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { id } = req.params;
    const inv = await Investor.findById(id);
    if (!inv) return res.status(404).json({ error: 'Investor not found' });

    // Prevent deletion if any product references this investor by id or by investorName
    const productsCount = await Product.countDocuments({
      $or: [
        { investor: inv._id },
        { investorName: { $eq: inv.name } }
      ]
    });

    if (productsCount > 0) {
      return res.status(400).json({ error: 'Cannot delete investor: there are products assigned to this investor' });
    }

    await Investor.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateInvestor = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const updated = await Investor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
