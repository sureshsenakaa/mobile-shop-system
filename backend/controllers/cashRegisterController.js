const { CashRegister, Sale, Repair, Expense, sequelize } = require('../models');
const { Op } = require('sequelize');

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

exports.getTodaySummary = async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayStr = getLocalDateString(today);

    // Get today's register record
    const register = await CashRegister.findOne({
      where: { shopId: req.shopId, date: todayStr },
      ...opts
    });

    // Query today's sales
    const sales = await Sale.findAll({
      where: {
        shopId: req.shopId,
        returned: false,
        date: { [Op.gte]: today, [Op.lt]: tomorrow }
      },
      ...opts
    });

    let cashIn = 0;
    let cardIn = 0;

    for (const s of sales) {
      let cashAmount = 0;
      let cardAmount = 0;

      if (s.paymentMethod && typeof s.paymentMethod === 'object') {
        cashAmount = Number(s.paymentMethod.cash || 0);
        cardAmount = Number(s.paymentMethod.card || 0) + Number(s.paymentMethod.bank || 0);
      } else if (s.paymentMethod === 'Cash') {
        cashAmount = Number(s.total || 0);
      } else if (s.paymentMethod === 'Card' || s.paymentMethod === 'Bank') {
        cardAmount = Number(s.total || 0);
      }

      cashIn += cashAmount;
      cardIn += cardAmount;
    }

    // Query today's repairs
    const repairs = await Repair.findAll({
      where: {
        shopId: req.shopId,
        dateCreated: { [Op.gte]: today, [Op.lt]: tomorrow }
      },
      ...opts
    });

    let repairCash = 0;
    for (const r of repairs) {
      repairCash += Number(r.paidAmount || 0);
    }
    cashIn += repairCash;

    // Query today's expenses (exclude COGS)
    const expenses = await Expense.findAll({
      where: {
        shopId: req.shopId,
        date: { [Op.gte]: today, [Op.lt]: tomorrow },
        category: { [Op.ne]: 'Cost of Goods Sold' }
      },
      ...opts
    });

    let cashOut = 0;
    for (const e of expenses) {
      cashOut += Number(e.amount || 0);
    }

    const expectedBalance = (register?.openingBalance || 0) + cashIn - cashOut;

    res.json({
      register,
      cashIn,
      cardIn,
      repairCash,
      cashOut,
      expectedBalance,
      salesCount: sales.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.openRegister = async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const { openingBalance } = req.body;
    const todayStr = getLocalDateString();

    const [register, created] = await CashRegister.findOrCreate({
      where: { shopId: req.shopId, date: todayStr },
      defaults: {
        shopId: req.shopId,
        date: todayStr,
        openingBalance: Number(openingBalance || 0),
        status: 'open'
      },
      ...opts
    });

    if (!created) {
      register.openingBalance = Number(openingBalance || 0);
      register.status = 'open';
      await register.save(opts);
    }

    res.json(register);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.closeRegister = async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const { closingBalance, notes } = req.body;
    const todayStr = getLocalDateString();

    const register = await CashRegister.findOne({
      where: { shopId: req.shopId, date: todayStr },
      ...opts
    });

    if (!register || register.status !== 'open') {
      return res.status(400).json({ error: 'No open register found for today' });
    }

    // Recalculate expectedBalance at close time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sales = await Sale.findAll({
      where: {
        shopId: req.shopId,
        returned: false,
        date: { [Op.gte]: today, [Op.lt]: tomorrow }
      },
      ...opts
    });

    let cashIn = 0;
    for (const s of sales) {
      if (s.paymentMethod && typeof s.paymentMethod === 'object') {
        cashIn += Number(s.paymentMethod.cash || 0);
      } else if (s.paymentMethod === 'Cash') {
        cashIn += Number(s.total || 0);
      }
    }

    const repairs = await Repair.findAll({
      where: {
        shopId: req.shopId,
        dateCreated: { [Op.gte]: today, [Op.lt]: tomorrow }
      },
      ...opts
    });

    for (const r of repairs) {
      cashIn += Number(r.paidAmount || 0);
    }

    const expenses = await Expense.findAll({
      where: {
        shopId: req.shopId,
        date: { [Op.gte]: today, [Op.lt]: tomorrow },
        category: { [Op.ne]: 'Cost of Goods Sold' }
      },
      ...opts
    });

    let cashOut = 0;
    for (const e of expenses) {
      cashOut += Number(e.amount || 0);
    }

    const expectedBalance = (register.openingBalance || 0) + cashIn - cashOut;
    const difference = Number(closingBalance) - expectedBalance;

    register.closingBalance = Number(closingBalance);
    register.expectedBalance = expectedBalance;
    register.difference = difference;
    register.notes = notes || register.notes;
    register.status = 'closed';
    register.closedBy = req.user.id;
    register.closedAt = new Date();
    await register.save(opts);

    res.json(register);
  } catch (err) {
    console.error('closeRegister error:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const { month } = req.query;
    const where = { shopId: req.shopId };

    if (month) {
      const startDate = new Date(`${month}-01T00:00:00Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      where.date = {
        [Op.gte]: startDate.toISOString().split('T')[0],
        [Op.lt]: endDate.toISOString().split('T')[0]
      };
    }

    const registers = await CashRegister.findAll({
      where,
      order: [['date', 'DESC']],
      ...opts
    });

    res.json(registers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
