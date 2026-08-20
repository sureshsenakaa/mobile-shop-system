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
    const totalSales = await Sale.sum('total', { where: saleDateFilter, ...opts }) || 0;
    
    // Cost of Goods Sold (COGS)
    // Needs to join SaleItem with Product to get cost
    const saleItems = await SaleItem.findAll({
      include: [
        { model: Sale, where: saleDateFilter },
        { model: Product, attributes: ['cost'] }
      ],
      ...opts
    });
    
    let totalCogs = 0;
    saleItems.forEach(item => {
      totalCogs += (item.Product?.cost || 0) * item.quantity;
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

    const totalExpenses = await Expense.sum('amount', { where: expenseDateFilter, ...opts }) || 0;

    // 1.5 Handle Returns to Active Stock (Reversed COGS)
    // If an item is returned to stock, it reverses the COGS. The refund is already in Expenses.
    const returnFilter = dateFilter.dateCreated ? { dateCreated: dateFilter.dateCreated, shopId: req.shopId } : { shopId: req.shopId };
    const returns = await Return.findAll({ where: returnFilter, ...opts });
    let restockedCogs = 0;
    
    // We need to fetch products to get their cost
    const productIds = [];
    returns.forEach(r => {
      if (r.itemsReturned && Array.isArray(r.itemsReturned)) {
        r.itemsReturned.forEach(item => {
          if (item.returnToStock && item.productId) {
            productIds.push(item.productId);
          }
        });
      }
    });

    const returnedProducts = await Product.findAll({
      where: { id: { [Op.in]: productIds }, shopId: req.shopId },
      attributes: ['id', 'cost'],
      ...opts
    });
    
    const productCostMap = {};
    returnedProducts.forEach(p => { productCostMap[p.id] = p.cost || 0; });

    returns.forEach(r => {
      if (r.itemsReturned && Array.isArray(r.itemsReturned)) {
        r.itemsReturned.forEach(item => {
          if (item.returnToStock && item.productId) {
            restockedCogs += (productCostMap[item.productId] || 0) * (item.quantity || 1);
          }
        });
      }
    });

    // Adjusted COGS subtracts the cost of items that were put back into stock
    const adjustedCogs = totalCogs - restockedCogs;

    const grossProfit = (totalSales - adjustedCogs) + (totalRepairs - totalRepairPartsCost);
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
