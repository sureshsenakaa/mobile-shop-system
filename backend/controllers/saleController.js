const mongoose = require('mongoose');
const { Sale, Product, Expense, Supplier } = require('../models');

const isDbReady = () => mongoose.connection.readyState === 1;

exports.createSale = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const payload = req.body || {};

    // Ensure items array exists for multi-item sales
    if (Array.isArray(payload.items) && payload.items.length > 0) {
      const sale = new Sale(payload);
      await sale.save();

      // decrement stock for each item and update supplier totals when applicable
      for (const it of sale.items) {
        if (it.productId) {
          // fetch product to determine supplier
          const prod = await Product.findById(it.productId).select('supplier');
          await Product.findByIdAndUpdate(it.productId, { $inc: { stock: -it.quantity } });
          if (prod && prod.supplier) {
            await Supplier.findByIdAndUpdate(prod.supplier, { $inc: { totalStock: -it.quantity } });
          }
        }
      }

      // Create an automatic expense record for cost of goods sold
      try {
        // fetch product costs in parallel
        const productIds = sale.items.map(i => i.productId).filter(Boolean);
        const products = await Product.find({ _id: { $in: productIds } }).select('cost');
        const costById = new Map(products.map(p => [String(p._id), Number(p.cost || 0)]));
        const totalCost = sale.items.reduce((sum, it) => sum + (Number(costById.get(String(it.productId)) || 0) * Number(it.quantity || 0)), 0);
        const expense = new Expense({ category: 'Cost of Goods Sold', amount: totalCost, date: sale.date || new Date(), notes: `Auto-created for sale ${sale._id}` });
        await expense.save();
      } catch (e) {
        console.error('Failed to create COGS expense for sale', e);
      }

      return res.status(201).json(sale);
    }

    // Backward-compatible single-item sale
    const sale = new Sale(payload);
    await sale.save();
    if (sale.productId) {
      const prod = await Product.findById(sale.productId).select('supplier');
      await Product.findByIdAndUpdate(sale.productId, { $inc: { stock: -sale.quantity } });
      if (prod && prod.supplier) {
        await Supplier.findByIdAndUpdate(prod.supplier, { $inc: { totalStock: -sale.quantity } });
      }
    }
    // Automatic expense for single-item sale
    try {
      if (sale.productId) {
        const prod = await Product.findById(sale.productId).select('cost');
        const totalCost = (prod && Number(prod.cost || 0) * Number(sale.quantity || 0)) || 0;
        const expense = new Expense({ category: 'Cost of Goods Sold', amount: totalCost, date: sale.date || new Date(), notes: `Auto-created for sale ${sale._id}` });
        await expense.save();
      }
    } catch (e) {
      console.error('Failed to create COGS expense for single-item sale', e);
    }
    res.status(201).json(sale);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getSales = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.json([]);
    }

    const sales = await Sale.find();
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/sales/daily
exports.getDailySales = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.json([]);
    }

    const daily = await Sale.aggregate([
      { $match: { returned: { $ne: true } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          total: { $sum: "$total" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const result = daily.map(d => ({ date: d._id, total: d.total, count: d.count }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/sales/summary?month=YYYY-MM
exports.getSummary = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.json({
        month: req.query.month || new Date().toISOString().slice(0, 7),
        salesTotal: 0,
        expensesTotal: 0,
        netProfit: 0,
        categoryBreakdown: []
      });
    }

    const { month } = req.query;
    let start, end;
    if (month) {
      start = new Date(`${month}-01T00:00:00.000Z`);
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
    } else {
      // default to current month
      start = new Date();
      start.setDate(1);
      start.setHours(0,0,0,0);
      end = new Date(start);
      end.setMonth(end.getMonth() + 1);
    }

    const salesAgg = await Sale.aggregate([
      { $match: { date: { $gte: start, $lt: end }, returned: { $ne: true } } },
      { $group: { _id: null, totalSales: { $sum: "$total" }, count: { $sum: 1 } } }
    ]);
    const salesTotal = (salesAgg[0] && salesAgg[0].totalSales) || 0;

    const expensesAgg = await Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: null, totalExpenses: { $sum: "$amount" } } }
    ]);
    const expensesTotal = (expensesAgg[0] && expensesAgg[0].totalExpenses) || 0;

    // category breakdown
    const categoryBreakdown = await Expense.aggregate([
      { $match: { date: { $gte: start, $lt: end } } },
      { $group: { _id: "$category", total: { $sum: "$amount" } } }
    ]);

    res.json({
      month: `${start.getUTCFullYear()}-${String(start.getUTCMonth()+1).padStart(2,'0')}`,
      salesTotal,
      expensesTotal,
      netProfit: salesTotal - expensesTotal,
      categoryBreakdown: categoryBreakdown.map(c => ({ category: c._id, total: c.total }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/sales/:id
exports.deleteSale = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { id } = req.params;
    const sale = await Sale.findById(id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });

    // restore product stock for multi-item or single-item sales and update supplier totals
    if (Array.isArray(sale.items) && sale.items.length > 0) {
      for (const it of sale.items) {
        if (it.productId) {
          const prod = await Product.findById(it.productId).select('supplier');
          await Product.findByIdAndUpdate(it.productId, { $inc: { stock: it.quantity } });
          if (prod && prod.supplier) {
            await Supplier.findByIdAndUpdate(prod.supplier, { $inc: { totalStock: it.quantity } });
          }
        }
      }
    } else if (sale.productId) {
      const prod = await Product.findById(sale.productId).select('supplier');
      await Product.findByIdAndUpdate(sale.productId, { $inc: { stock: sale.quantity } });
      if (prod && prod.supplier) {
        await Supplier.findByIdAndUpdate(prod.supplier, { $inc: { totalStock: sale.quantity } });
      }
    }

    await Sale.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/sales/:id/return
exports.returnSale = async (req, res) => {
  try {
    if (!isDbReady()) {
      return res.status(503).json({ error: 'Database not connected' });
    }

    const { id } = req.params;
    const sale = await Sale.findById(id);
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    if (sale.returned) return res.status(400).json({ error: 'Sale already returned' });

    // restore product stock for multi-item or single-item sales
    if (Array.isArray(sale.items) && sale.items.length > 0) {
      for (const it of sale.items) {
        if (it.productId) {
          // restore stock
          const prod = await Product.findById(it.productId).select('supplier');
          await Product.findByIdAndUpdate(it.productId, { $inc: { stock: it.quantity } });
          if (prod && prod.supplier) {
            await Supplier.findByIdAndUpdate(prod.supplier, { $inc: { totalStock: it.quantity } });
          }
        }
      }
    } else if (sale.productId) {
      const prod = await Product.findById(sale.productId).select('supplier');
      await Product.findByIdAndUpdate(sale.productId, { $inc: { stock: sale.quantity } });
      if (prod && prod.supplier) {
        await Supplier.findByIdAndUpdate(prod.supplier, { $inc: { totalStock: sale.quantity } });
      }
    }

    // compute the cost associated with this sale so we can adjust COGS
    try {
      const productIds = (Array.isArray(sale.items) && sale.items.length > 0)
        ? sale.items.map(i => i.productId).filter(Boolean)
        : (sale.productId ? [sale.productId] : []);

      if (productIds.length > 0) {
        const products = await Product.find({ _id: { $in: productIds } }).select('cost');
        const costById = new Map(products.map(p => [String(p._id), Number(p.cost || 0)]));
        const returnedCost = (Array.isArray(sale.items) && sale.items.length > 0)
          ? sale.items.reduce((sum, it) => sum + (Number(costById.get(String(it.productId)) || 0) * Number(it.quantity || 0)), 0)
          : ((Number(costById.get(String(sale.productId)) || 0) * Number(sale.quantity || 0)) || 0);

        // try to find the original COGS expense created for this sale
        const orig = await Expense.findOne({ category: 'Cost of Goods Sold', notes: new RegExp(String(sale._id)) });
        if (orig) {
          const newAmount = Number(orig.amount || 0) - returnedCost;
          if (newAmount <= 0) {
            await Expense.findByIdAndDelete(orig._id);
          } else {
            orig.amount = newAmount;
            await orig.save();
          }
        } else if (returnedCost > 0) {
          // if no original expense found, create an adjustment (negative) so monthly reports decrease
          const adj = new Expense({ category: 'Cost of Goods Sold', amount: -returnedCost, date: sale.date || new Date(), notes: `Auto-adjust (return) for sale ${sale._id}` });
          await adj.save();
        }
      }
    } catch (e) {
      console.error('Failed to adjust COGS for returned sale', e);
    }

    sale.returned = true;
    await sale.save();

    res.json({ success: true, sale });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
