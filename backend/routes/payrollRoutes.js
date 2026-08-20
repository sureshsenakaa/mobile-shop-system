const express = require('express');
const router = express.Router();
const { User, Sale, Repair, Shop, Expense, CashRegister } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');
const { Op } = require('sequelize');

// GET /api/payroll/commissions
// Fetch commissions for staff members in a given month
router.get('/commissions', requireAuth, injectShopFilter, async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const { month, year } = req.query; // e.g., month=7, year=2026
    
    let dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      dateFilter = {
        dateCreated: {
          [Op.between]: [startDate, endDate]
        }
      };
    }

    const users = await User.findAll({
      where: { 
        role: { [Op.ne]: 'super_admin' },
        shopId: req.shopId
      },
      attributes: ['id', 'username', 'role', 'commissionRateSales', 'commissionRateRepairs', 'basicSalary'],
      ...opts
    });

    const payrollData = [];

    for (const user of users) {
      // Find sales commission
      const sales = await Sale.findAll({
        where: {
          commissionTo: user.id,
          shopId: req.shopId,
          date: dateFilter.dateCreated || { [Op.not]: null }
        },
        attributes: [[User.sequelize.fn('SUM', User.sequelize.col('commissionAmount')), 'totalSalesCommission']],
        ...opts
      });

      // Find repair commission
      const repairs = await Repair.findAll({
        where: {
          commissionTo: user.id,
          shopId: req.shopId,
          ...dateFilter
        },
        attributes: [[User.sequelize.fn('SUM', User.sequelize.col('commissionAmount')), 'totalRepairCommission']],
        ...opts
      });

      const salesComm = parseFloat(sales[0]?.dataValues?.totalSalesCommission || 0);
      const repairComm = parseFloat(repairs[0]?.dataValues?.totalRepairCommission || 0);
      const basicSalary = parseFloat(user.basicSalary || 0);
      const totalEarnings = basicSalary + salesComm + repairComm;

      // Check if paid
      const paymentExpense = await Expense.findOne({
        where: {
          shopId: req.shopId,
          category: 'Staff Salary',
          notes: {
            [Op.like]: `PAYROLL|${user.id}|${month}|${year}%`
          }
        },
        ...opts
      });

      payrollData.push({
        userId: user.id,
        username: user.username,
        role: user.role,
        basicSalary: basicSalary,
        commissionRateSales: user.commissionRateSales,
        commissionRateRepairs: user.commissionRateRepairs,
        totalSalesCommission: salesComm,
        totalRepairCommission: repairComm,
        totalCommission: totalEarnings, // kept name totalCommission for backward compatibility with UI
        isPaid: !!paymentExpense,
        paidAmount: paymentExpense ? paymentExpense.amount : 0
      });
    }

    res.json(payrollData);
  } catch (error) {
    console.error('Error fetching payroll data:', error);
    res.status(500).json({ error: 'Failed to fetch payroll data' });
  }
});

// POST /api/payroll/pay
// Pay staff salary via Expense
router.post('/pay', requireAuth, injectShopFilter, async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const { userId, username, month, year, amount } = req.body;

    if (!userId || !month || !year || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if register is open
    const register = await CashRegister.findOne({ 
        where: { status: 'open', shopId: req.shopId },
        ...opts
    });
    
    if (!register) {
        return res.status(400).json({ error: 'Cash register must be open to make a payment.' });
    }

    // Check if already paid
    const existing = await Expense.findOne({
      where: {
        shopId: req.shopId,
        category: 'Staff Salary',
        notes: {
          [Op.like]: `PAYROLL|${userId}|${month}|${year}%`
        }
      },
      ...opts
    });

    if (existing) {
      return res.status(400).json({ error: 'Salary already paid for this month' });
    }

    // Log expense
    await Expense.create({
      category: 'Staff Salary',
      amount: parseFloat(amount),
      date: new Date(),
      notes: `PAYROLL|${userId}|${month}|${year} - Salary for ${username} - ${month}/${year}`,
      shopId: req.shopId
    }, opts);

    // Update cash drawer
    register.cashOut += parseFloat(amount);
    register.currentBalance -= parseFloat(amount);
    await register.save(opts);

    res.json({ success: true, message: 'Salary paid successfully' });
  } catch (error) {
    console.error('Error paying salary:', error);
    res.status(500).json({ error: 'Failed to process salary payment' });
  }
});

module.exports = router;
