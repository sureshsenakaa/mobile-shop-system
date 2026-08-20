const { Investor, Product, Expense } = require('../models');
const { Op } = require('sequelize');

exports.createInvestor = async (req, res) => {
  try {
    const inv = await Investor.create({ ...req.body, shopId: req.shopId });
    res.status(201).json(inv);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getInvestors = async (req, res) => {
  try {
    const investors = await Investor.findAll({ 
      where: { shopId: req.shopId },
      order: [['dateInvested', 'DESC']] 
    });
    const out = investors.map(i => {
      const monthlyPayment = (i.amountInvested * (i.monthlyRate || 0)) / 100;
      const next = i.nextPaymentDate ? new Date(i.nextPaymentDate) : (() => { const d = new Date(i.dateInvested); d.setMonth(d.getMonth() + 1); return d; })();
      return {
        _id: i.id, // Support _id
        id: i.id,
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

exports.recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await Investor.findOne({ where: { id, shopId: req.shopId } });
    if (!inv) return res.status(404).json({ error: 'Investor not found' });

    const monthlyPayment = Number(inv.amountInvested || 0) * Number(inv.monthlyRate || 0) / 100;
    const expense = await Expense.create({ 
      category: 'Interest (Paid to investors)', 
      amount: monthlyPayment, 
      date: new Date(), 
      notes: `Monthly payment to ${inv.name}`,
      shopId: req.shopId
    });

    const base = inv.nextPaymentDate ? new Date(inv.nextPaymentDate) : new Date();
    const next = new Date(base);
    next.setMonth(next.getMonth() + 1);
    
    await inv.update({ nextPaymentDate: next });

    res.json({ success: true, nextPaymentDate: inv.nextPaymentDate, expenseId: expense.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteInvestor = async (req, res) => {
  try {
    const { id } = req.params;
    const inv = await Investor.findOne({ where: { id, shopId: req.shopId } });
    if (!inv) return res.status(404).json({ error: 'Investor not found' });

    const productsCount = await Product.count({
      where: {
        shopId: req.shopId,
        [Op.or]: [
          { investor: inv.id },
          { investorName: inv.name }
        ]
      }
    });

    if (productsCount > 0) {
      return res.status(400).json({ error: 'Cannot delete investor: there are products assigned to this investor' });
    }

    await inv.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateInvestor = async (req, res) => {
  try {
    const inv = await Investor.findOne({ where: { id: req.params.id, shopId: req.shopId } });
    if (!inv) return res.status(404).json({ error: 'Investor not found' });
    
    await inv.update(req.body);
    res.json(inv);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
