const express = require('express');
const router = express.Router();
const { Return, Product, Expense, Sale } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');
const { Op } = require('sequelize');

router.use(requireAuth, injectShopFilter);

// GET /api/returns
router.get('/', async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const returns = await Return.findAll({
      where: { shopId: req.shopId },
      order: [['dateCreated', 'DESC']],
      ...opts
    });
    res.json(returns);
  } catch (err) {
    console.error('Failed to fetch returns:', err);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

// POST /api/returns
router.post('/', async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    
    const rma = await Return.create({
      ...req.body,
      shopId: req.shopId
    }, opts);

    let restockedCost = 0;
    let damagedCost = 0;

    // Handle stock logic: return to stock or mark as defective
    // Assume itemsReturned is [{ productId, quantity, imei, returnToStock: true }]
    if (req.body.itemsReturned && Array.isArray(req.body.itemsReturned)) {
      for (const item of req.body.itemsReturned) {
        if (item.productId) {
          const product = await Product.findOne({
            where: { id: item.productId, shopId: req.shopId },
            ...opts
          });

          if (product) {
            const itemQty = Number(item.quantity) || 1;
            const itemCost = Number(product.cost) || 0;

            if (item.returnToStock) {
              // Return item to shelf inventory
              product.stock += itemQty;
              if (item.imei) {
                const currentImeis = Array.isArray(product.imeiList) ? product.imeiList : [];
                if (!currentImeis.includes(item.imei)) {
                  product.imeiList = [...currentImeis, item.imei];
                }
              }
              await product.save(opts);
              restockedCost += itemCost * itemQty;
            } else {
              // Damaged/Defective item that cannot be restocked
              damagedCost += itemCost * itemQty;
            }
          }
        }
      }
    }

    // Reverse COGS for restocked items (Restored stock is an asset, not a COGS expense)
    if (restockedCost > 0 && req.body.saleId) {
      const origCogs = await Expense.findOne({
        where: {
          category: 'Cost of Goods Sold',
          notes: { [Op.like]: `%sale ${req.body.saleId}%` },
          shopId: req.shopId
        },
        ...opts
      });

      if (origCogs) {
        const newAmount = Number(origCogs.amount || 0) - restockedCost;
        if (newAmount <= 0) {
          await origCogs.destroy(opts);
        } else {
          await origCogs.update({ amount: newAmount }, opts);
        }
      } else {
        await Expense.create({
          category: 'Cost of Goods Sold',
          amount: -restockedCost,
          date: new Date(),
          notes: `COGS reversal for return on Sale ${req.body.saleId}`,
          shopId: req.shopId
        }, opts);
      }
    }

    // If item was damaged/scrapped, recognize the lost item cost as a loss
    if (damagedCost > 0 && req.body.saleId) {
      await Expense.create({
        category: 'Damaged Goods Loss',
        amount: damagedCost,
        date: new Date(),
        notes: `Scrapped/Damaged item return for Sale ID: ${req.body.saleId}`,
        shopId: req.shopId
      }, opts);
    }
    
    // Log customer refund for cash drawer tracking
    if (req.body.totalRefund > 0) {
      await Expense.create({
        category: 'Customer Refund',
        amount: Number(req.body.totalRefund),
        date: new Date(),
        notes: `Refund for Sale ID: ${req.body.saleId}`,
        shopId: req.shopId
      }, opts);
    }

    // Update sale: mark as returned (or deduct refunded amount if partial)
    if (req.body.saleId) {
      const sale = await Sale.findOne({
        where: { id: req.body.saleId, shopId: req.shopId },
        ...opts
      });

      if (sale) {
        const refundAmt = Number(req.body.totalRefund || 0);
        if (refundAmt >= Number(sale.total || 0)) {
          sale.returned = true;
        } else {
          // Partial return
          sale.total = Math.max(0, Number(sale.total || 0) - refundAmt);
          sale.subtotal = Math.max(0, Number(sale.subtotal || 0) - refundAmt);
        }
        await sale.save(opts);
      }
    }

    res.status(201).json(rma);
  } catch (err) {
    console.error('Error creating return:', err);
    res.status(500).json({ error: 'Failed to create return: ' + err.message });
  }
});

module.exports = router;
