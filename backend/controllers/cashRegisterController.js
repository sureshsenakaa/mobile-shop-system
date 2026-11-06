const { CashRegister, Sale, Repair, Expense, User, sequelize } = require('../models');
const { Op } = require('sequelize');

const getLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper: Calculate live metrics for a given time window
async function calculateShiftMetrics(shopId, startTime, endTime, opts = {}) {
  // 1. Sales
  const sales = await Sale.findAll({
    where: {
      shopId,
      returned: false,
      date: { [Op.gte]: startTime, [Op.lte]: endTime }
    },
    ...opts
  });

  let cashIn = 0;
  let cardIn = 0;
  for (const s of sales) {
    if (s.paymentMethod && typeof s.paymentMethod === 'object') {
      cashIn += Number(s.paymentMethod.cash || 0);
      cardIn += Number(s.paymentMethod.card || 0) + Number(s.paymentMethod.bank || 0);
    } else if (s.paymentMethod === 'Cash') {
      cashIn += Number(s.total || 0);
    } else if (s.paymentMethod === 'Card' || s.paymentMethod === 'Bank') {
      cardIn += Number(s.total || 0);
    }
  }

  // 2. Repairs
  const repairs = await Repair.findAll({
    where: {
      shopId,
      dateCreated: { [Op.gte]: startTime, [Op.lte]: endTime }
    },
    ...opts
  });

  let repairCash = 0;
  for (const r of repairs) {
    repairCash += Number(r.paidAmount || 0);
  }
  cashIn += repairCash;

  // 3. Expenses (excluding COGS)
  const expenses = await Expense.findAll({
    where: {
      shopId,
      date: { [Op.gte]: startTime, [Op.lte]: endTime },
      category: { [Op.ne]: 'Cost of Goods Sold' }
    },
    ...opts
  });

  let cashOut = 0;
  for (const e of expenses) {
    cashOut += Number(e.amount || 0);
  }

  return {
    cashIn,
    cardIn,
    repairCash,
    cashOut,
    salesCount: sales.length
  };
}

exports.getTodaySummary = async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const todayStr = getLocalDateString();

    // 1. Fetch all shifts for today
    const todayShifts = await CashRegister.findAll({
      where: { shopId: req.shopId, date: todayStr },
      include: [
        { model: User, as: 'opener', attributes: ['id', 'username'] },
        { model: User, as: 'closer', attributes: ['id', 'username'] }
      ],
      order: [['shiftNumber', 'ASC'], ['id', 'ASC']],
      ...opts
    });

    // 2. Check if there is an active (open) register
    const openRegister = await CashRegister.findOne({
      where: { shopId: req.shopId, status: 'open' },
      include: [
        { model: User, as: 'opener', attributes: ['id', 'username'] }
      ],
      order: [['id', 'DESC']],
      ...opts
    });

    if (openRegister) {
      // Calculate live metrics for the active shift
      const startTime = openRegister.openedAt || openRegister.createdAt;
      const endTime = new Date();
      const metrics = await calculateShiftMetrics(req.shopId, startTime, endTime, opts);

      const expectedBalance = Number(openRegister.openingBalance || 0) + metrics.cashIn - metrics.cashOut;

      return res.json({
        register: openRegister,
        activeShift: true,
        todayShifts,
        nextShiftNumber: todayShifts.length + 1,
        cashIn: metrics.cashIn,
        cardIn: metrics.cardIn,
        repairCash: metrics.repairCash,
        cashOut: metrics.cashOut,
        expectedBalance,
        salesCount: metrics.salesCount
      });
    }

    // 3. If no shift is open, find the most recently closed shift of today
    const latestClosed = todayShifts.length > 0 ? todayShifts[todayShifts.length - 1] : null;

    if (latestClosed) {
      return res.json({
        register: latestClosed,
        activeShift: false,
        todayShifts,
        nextShiftNumber: todayShifts.length + 1,
        cashIn: Number(latestClosed.cashIn || 0),
        cardIn: Number(latestClosed.cardIn || 0),
        repairCash: 0,
        cashOut: Number(latestClosed.cashOut || 0),
        expectedBalance: Number(latestClosed.expectedBalance || 0),
        salesCount: 0
      });
    }

    // 4. No shifts registered today yet
    return res.json({
      register: null,
      activeShift: false,
      todayShifts: [],
      nextShiftNumber: 1,
      cashIn: 0,
      cardIn: 0,
      repairCash: 0,
      cashOut: 0,
      expectedBalance: 0,
      salesCount: 0
    });
  } catch (err) {
    console.error('getTodaySummary error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.openRegister = async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const { openingBalance } = req.body;
    const todayStr = getLocalDateString();

    // Prevent opening multiple concurrent shifts
    const existingOpen = await CashRegister.findOne({
      where: { shopId: req.shopId, status: 'open' },
      ...opts
    });

    if (existingOpen) {
      return res.status(400).json({
        error: `Shift #${existingOpen.shiftNumber || 1} is already open. Please close it before opening a new shift.`
      });
    }

    // Determine shift number for today
    const shiftsToday = await CashRegister.count({
      where: { shopId: req.shopId, date: todayStr },
      ...opts
    });
    const shiftNumber = shiftsToday + 1;

    const opBal = Number(openingBalance || 0);
    const register = await CashRegister.create({
      shopId: req.shopId,
      date: todayStr,
      shiftNumber,
      openedBy: req.user ? req.user.id : null,
      openedAt: new Date(),
      openingBalance: opBal,
      expectedBalance: opBal,
      status: 'open'
    }, opts);

    const fullRegister = await CashRegister.findByPk(register.id, {
      include: [
        { model: User, as: 'opener', attributes: ['id', 'username'] }
      ],
      ...opts
    });

    res.status(201).json(fullRegister || register);
  } catch (err) {
    console.error('openRegister error:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.closeRegister = async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const { closingBalance, notes } = req.body;

    const register = await CashRegister.findOne({
      where: { shopId: req.shopId, status: 'open' },
      order: [['id', 'DESC']],
      ...opts
    });

    if (!register) {
      return res.status(400).json({ error: 'No open cash register found to close' });
    }

    const startTime = register.openedAt || register.createdAt;
    const endTime = new Date();

    // Calculate metrics for this shift's time window
    const metrics = await calculateShiftMetrics(req.shopId, startTime, endTime, opts);

    const expectedBalance = Number(register.openingBalance || 0) + metrics.cashIn - metrics.cashOut;
    const difference = Number(closingBalance) - expectedBalance;

    register.closingBalance = Number(closingBalance);
    register.expectedBalance = expectedBalance;
    register.difference = difference;
    register.cashIn = metrics.cashIn;
    register.cardIn = metrics.cardIn;
    register.cashOut = metrics.cashOut;
    register.notes = notes || register.notes;
    register.status = 'closed';
    register.closedBy = req.user ? req.user.id : null;
    register.closedAt = endTime;
    await register.save(opts);

    const fullRegister = await CashRegister.findByPk(register.id, {
      include: [
        { model: User, as: 'opener', attributes: ['id', 'username'] },
        { model: User, as: 'closer', attributes: ['id', 'username'] }
      ],
      ...opts
    });

    res.json(fullRegister || register);
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
      include: [
        { model: User, as: 'opener', attributes: ['id', 'username'] },
        { model: User, as: 'closer', attributes: ['id', 'username'] }
      ],
      order: [['date', 'DESC'], ['shiftNumber', 'DESC'], ['id', 'DESC']],
      ...opts
    });

    res.json(registers);
  } catch (err) {
    console.error('getHistory error:', err);
    res.status(500).json({ error: err.message });
  }
};
