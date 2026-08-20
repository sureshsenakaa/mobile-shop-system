const { Sale, SaleItem, Product, Expense, Supplier, Customer, sequelize } = require('../models');
const { Op } = require('sequelize');

exports.createSale = async (req, res) => {
  const transaction = req._rlsTransaction;
  try {
    const payload = req.body || {};
    const sale = await Sale.create({ ...payload, shopId: req.shopId }, { transaction });

    // Handle items
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      let totalCost = 0;
      for (const it of payload.items) {
        await SaleItem.create({ ...it, saleId: sale.id, shopId: req.shopId }, { transaction });
        if (it.productId) {
          const prod = await Product.findOne({ where: { id: it.productId, shopId: req.shopId }, transaction });
          if (prod) {
            await prod.decrement('stock', { by: it.quantity, transaction });
            if (it.imei && Array.isArray(prod.imeiList)) {
                prod.imeiList = prod.imeiList.filter(i => i !== it.imei);
                await prod.save({ transaction });
            }
            if (prod.supplier) {
              const sup = await Supplier.findOne({ where: { id: prod.supplier, shopId: req.shopId }, transaction });
              if (sup) await sup.decrement('totalStock', { by: it.quantity, transaction });
            }
            totalCost += (Number(prod.cost || 0) * Number(it.quantity || 0));
          }
        }
      }
      
      if (totalCost > 0) {
        await Expense.create({
          category: 'Cost of Goods Sold',
          amount: totalCost,
          date: sale.date || new Date(),
          notes: `Auto-created for sale ${sale.id}`,
          shopId: req.shopId
        }, { transaction });
      }
    } else if (payload.productId) {
      // Backward compatibility for single item sale
      const prod = await Product.findOne({ where: { id: payload.productId, shopId: req.shopId }, transaction });
      if (prod) {
        await prod.decrement('stock', { by: payload.quantity || 1, transaction });
        if (prod.supplier) {
          const sup = await Supplier.findOne({ where: { id: prod.supplier, shopId: req.shopId }, transaction });
          if (sup) await sup.decrement('totalStock', { by: payload.quantity || 1, transaction });
        }
        const totalCost = Number(prod.cost || 0) * Number(payload.quantity || 1);
        if (totalCost > 0) {
          await Expense.create({
            category: 'Cost of Goods Sold',
            amount: totalCost,
            date: sale.date || new Date(),
            notes: `Auto-created for sale ${sale.id}`,
            shopId: req.shopId
          }, { transaction });
        }
      }
    }

    // Handle Credit Payments
    let creditAmount = 0;
    if (payload.paymentMethod === 'Credit') {
      creditAmount = payload.total;
    } else if (payload.paymentMethod === 'Split' && payload.paymentDetails && payload.paymentDetails.credit) {
      creditAmount = Number(payload.paymentDetails.credit);
    }
    
    if (creditAmount > 0 && payload.customerMobile) {
      const customer = await Customer.findOne({ where: { mobile: payload.customerMobile, shopId: req.shopId }, transaction });
      if (customer) {
        await customer.increment('outstandingCredit', { by: creditAmount, transaction });
      } else if (payload.customerName) {
        // Fallback to name if mobile not found
        const customerByName = await Customer.findOne({ where: { name: payload.customerName, shopId: req.shopId }, transaction });
        if (customerByName) {
          await customerByName.increment('outstandingCredit', { by: creditAmount, transaction });
        }
      }
    }

    // transaction.commit() is handled by shopScope
    
    // Fetch with items for response
    const completeSale = await Sale.findOne({ where: { id: sale.id, shopId: req.shopId }, include: ['items'] });
    res.status(201).json(completeSale);
  } catch (err) {
    // transaction.rollback() is handled by shopScope
    res.status(400).json({ error: err.message });
  }
};

exports.getSales = async (req, res) => {
  try {
    const sales = await Sale.findAll({ where: { shopId: req.shopId }, include: ['items'] });
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDailySales = async (req, res) => {
  try {
    const daily = await Sale.findAll({
      where: { returned: false, shopId: req.shopId },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('date')), 'date'],
        [sequelize.fn('SUM', sequelize.col('total')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: [sequelize.fn('DATE', sequelize.col('date'))],
      order: [[sequelize.fn('DATE', sequelize.col('date')), 'ASC']]
    });

    const result = daily.map(d => ({
      date: d.getDataValue('date'),
      total: Number(d.getDataValue('total')),
      count: Number(d.getDataValue('count'))
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const { month } = req.query;
    let start, end;
    if (month) {
      start = new Date(`${month}-01T00:00:00.000Z`);
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
    } else {
      start = new Date();
      start.setDate(1);
      start.setHours(0,0,0,0);
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
    }

    const salesAgg = await Sale.findAll({
      where: { date: { [Op.gte]: start, [Op.lt]: end }, returned: false, shopId: req.shopId },
      attributes: [[sequelize.fn('SUM', sequelize.col('total')), 'totalSales']]
    });
    const salesTotal = Number(salesAgg[0]?.getDataValue('totalSales') || 0);

    const expensesAgg = await Expense.findAll({
      where: { date: { [Op.gte]: start, [Op.lt]: end }, shopId: req.shopId },
      attributes: [[sequelize.fn('SUM', sequelize.col('amount')), 'totalExpenses']]
    });
    const expensesTotal = Number(expensesAgg[0]?.getDataValue('totalExpenses') || 0);

    const categoryBreakdown = await Expense.findAll({
      where: { date: { [Op.gte]: start, [Op.lt]: end }, shopId: req.shopId },
      attributes: [
        'category',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total']
      ],
      group: ['category']
    });

    res.json({
      month: `${start.getUTCFullYear()}-${String(start.getUTCMonth()+1).padStart(2,'0')}`,
      salesTotal,
      expensesTotal,
      netProfit: salesTotal - expensesTotal,
      categoryBreakdown: categoryBreakdown.map(c => ({ category: c.category, total: Number(c.getDataValue('total')) }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteSale = async (req, res) => {
  const transaction = req._rlsTransaction;
  try {
    const { id } = req.params;
    const sale = await Sale.findOne({ where: { id, shopId: req.shopId }, include: ['items'], transaction });
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }

    if (sale.items && sale.items.length > 0) {
      for (const it of sale.items) {
        if (it.productId) {
          const prod = await Product.findOne({ where: { id: it.productId, shopId: req.shopId }, transaction });
          if (prod) {
            await prod.increment('stock', { by: it.quantity, transaction });
            if (it.imei) {
                const currentList = Array.isArray(prod.imeiList) ? prod.imeiList : [];
                if (!currentList.includes(it.imei)) {
                    prod.imeiList = [...currentList, it.imei];
                    await prod.save({ transaction });
                }
            }
            if (prod.supplier) {
              const sup = await Supplier.findOne({ where: { id: prod.supplier, shopId: req.shopId }, transaction });
              if (sup) await sup.increment('totalStock', { by: it.quantity, transaction });
            }
          }
        }
      }
    } else if (sale.productId) {
      // old single item sale format
      const prod = await Product.findOne({ where: { id: sale.productId, shopId: req.shopId }, transaction });
      if (prod) {
        await prod.increment('stock', { by: sale.quantity || 1, transaction });
        if (prod.supplier) {
          const sup = await Supplier.findOne({ where: { id: prod.supplier, shopId: req.shopId }, transaction });
          if (sup) await sup.increment('totalStock', { by: sale.quantity || 1, transaction });
        }
      }
    }

    await sale.destroy({ transaction });
    // transaction.commit() handled by shopScope
    res.json({ success: true });
  } catch (err) {
    // transaction.rollback() handled by shopScope
    res.status(500).json({ error: err.message });
  }
};

exports.returnSale = async (req, res) => {
  const transaction = req._rlsTransaction;
  try {
    const { id } = req.params;
    const sale = await Sale.findOne({ where: { id, shopId: req.shopId }, include: ['items'], transaction });
    if (!sale) {
      return res.status(404).json({ error: 'Sale not found' });
    }
    if (sale.returned) {
      return res.status(400).json({ error: 'Sale already returned' });
    }

    let returnedCost = 0;

    if (sale.items && sale.items.length > 0) {
      for (const it of sale.items) {
        if (it.productId) {
          const prod = await Product.findOne({ where: { id: it.productId, shopId: req.shopId }, transaction });
          if (prod) {
            await prod.increment('stock', { by: it.quantity, transaction });
            if (it.imei) {
                const currentList = Array.isArray(prod.imeiList) ? prod.imeiList : [];
                if (!currentList.includes(it.imei)) {
                    prod.imeiList = [...currentList, it.imei];
                    await prod.save({ transaction });
                }
            }
            if (prod.supplier) {
              const sup = await Supplier.findOne({ where: { id: prod.supplier, shopId: req.shopId }, transaction });
              if (sup) await sup.increment('totalStock', { by: it.quantity, transaction });
            }
            returnedCost += (Number(prod.cost || 0) * Number(it.quantity || 0));
          }
        }
      }
    } else if (sale.productId) {
      const prod = await Product.findOne({ where: { id: sale.productId, shopId: req.shopId }, transaction });
      if (prod) {
        await prod.increment('stock', { by: sale.quantity || 1, transaction });
        if (prod.supplier) {
          const sup = await Supplier.findOne({ where: { id: prod.supplier, shopId: req.shopId }, transaction });
          if (sup) await sup.increment('totalStock', { by: sale.quantity || 1, transaction });
        }
        returnedCost += (Number(prod.cost || 0) * Number(sale.quantity || 1));
      }
    }

    const orig = await Expense.findOne({
      where: {
        category: 'Cost of Goods Sold',
        notes: { [Op.like]: `%${sale.id}%` },
        shopId: req.shopId
      },
      transaction
    });

    if (orig) {
      const newAmount = Number(orig.amount || 0) - returnedCost;
      if (newAmount <= 0) {
        await orig.destroy({ transaction });
      } else {
        await orig.update({ amount: newAmount }, { transaction });
      }
    } else if (returnedCost > 0) {
      await Expense.create({
        category: 'Cost of Goods Sold',
        amount: -returnedCost,
        date: sale.date || new Date(),
        notes: `Auto-adjust (return) for sale ${sale.id}`,
        shopId: req.shopId
      }, { transaction });
    }

    await sale.update({ returned: true }, { transaction });
    // transaction.commit() handled by shopScope

    res.json({ success: true, sale });
  } catch (err) {
    // transaction.rollback() handled by shopScope
    res.status(500).json({ error: err.message });
  }
};
