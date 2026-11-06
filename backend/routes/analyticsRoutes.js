const express = require('express');
const router = express.Router();
const { Sale, Repair, Expense, SaleItem, Product, User, sequelize, Return } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');
const { Op } = require('sequelize');

router.use(requireAuth, injectShopFilter);

// GET /api/analytics/dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.dateCreated = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else {
      // Default to current month
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter.dateCreated = { [Op.gte]: firstDay };
    }

    const saleDateFilter = dateFilter.dateCreated ? { date: dateFilter.dateCreated, shopId: req.shopId } : { shopId: req.shopId };
    const expenseDateFilter = dateFilter.dateCreated ? { date: dateFilter.dateCreated, shopId: req.shopId } : { shopId: req.shopId };
    const repairFilter = { ...dateFilter, status: 'Complete', shopId: req.shopId };

    // 1. P&L (Profit & Loss)
    // Only count active (unreturned) sales for revenue
    const totalSales = await Sale.sum('total', { where: { ...saleDateFilter, returned: false }, ...opts }) || 0;
    
    // Cost of Goods Sold (COGS) for active sales
    const saleItems = await SaleItem.findAll({
      include: [
        { model: Sale, where: { ...saleDateFilter, returned: false } },
        { model: Product, attributes: ['cost'] }
      ],
      ...opts
    });
    
    let totalCogs = 0;
    saleItems.forEach(item => {
      totalCogs += (item.Product?.cost || 0) * (item.quantity || 1);
    });

    const totalRepairs = await Repair.sum('cost', { where: repairFilter, ...opts }) || 0;
    
    // Repair parts cost
    const completedRepairs = await Repair.findAll({ where: repairFilter, ...opts });
    let totalRepairPartsCost = 0;
    completedRepairs.forEach(repair => {
      if (repair.usedParts && Array.isArray(repair.usedParts)) {
         repair.usedParts.forEach(p => {
           totalRepairPartsCost += (p.cost || 0) * (p.quantity || 1);
         });
      }
    });

    // Operating expenses (exclude COGS and Customer Refund to avoid double-counting)
    const totalExpenses = await Expense.sum('amount', {
      where: {
        ...expenseDateFilter,
        category: { [Op.notIn]: ['Cost of Goods Sold', 'Customer Refund'] }
      },
      ...opts
    }) || 0;

    const grossProfit = (totalSales - totalCogs) + (totalRepairs - totalRepairPartsCost);
    const netProfit = grossProfit - totalExpenses;

    // 2. Best Sellers
    const bestSellersRaw = await SaleItem.findAll({
      attributes: [
        'productId',
        [sequelize.fn('MAX', sequelize.col('productName')), 'fallbackName'],
        [sequelize.fn('SUM', sequelize.col('SaleItem.quantity')), 'totalQuantity']
      ],
      include: [
        { model: Sale, attributes: [], where: saleDateFilter }
      ],
      group: ['SaleItem.productId'],
      order: [[sequelize.literal('"totalQuantity"'), 'DESC']],
      limit: 5,
      ...opts
    });

    const bestSellersData = bestSellersRaw.map(item => {
        let name = item.dataValues.fallbackName || 'Unknown Product';
        // Strip IMEI suffix like " (IMEI: 123,456)" from the name
        name = name.replace(/\s*\(IMEI:.*?\)\s*$/, '');
        return {
            productName: name,
            totalQuantity: item.dataValues.totalQuantity
        };
    });

    // 3. Technician Performance
    const techPerformance = await Repair.findAll({
      attributes: [
        'assignedTechnician',
        [sequelize.fn('COUNT', sequelize.col('id')), 'jobsCompleted'],
        [sequelize.fn('SUM', sequelize.col('cost')), 'revenueGenerated']
      ],
      where: repairFilter,
      group: ['assignedTechnician'],
      ...opts
    });

    res.json({
      profitLoss: {
        totalSales,
        totalCogs,
        totalRepairs,
        totalRepairPartsCost,
        totalExpenses,
        grossProfit,
        netProfit
      },
      bestSellers: bestSellersData,
      techPerformance
    });

  } catch (err) {
    console.error('Analytics Error:', err);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

module.exports = router;
