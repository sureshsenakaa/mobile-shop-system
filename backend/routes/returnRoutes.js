const express = require('express');
const router = express.Router();
const { Return, Product, Expense } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

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

    // Handle stock logic: return to stock or mark as defective
    // Assume itemsReturned is [{ productId, quantity, imei, returnToStock: true }]
    if (req.body.itemsReturned && Array.isArray(req.body.itemsReturned)) {
      for (const item of req.body.itemsReturned) {
        if (item.returnToStock) {
          const product = await Product.findOne({
             where: { id: item.productId, shopId: req.shopId },
             ...opts
          });
          if (product) {
            product.stock += item.quantity;
            if (item.imei) {
              product.imeiList = [...(product.imeiList || []), item.imei];
            }
            await product.save(opts);
          }
        }
      }
    }
    
    // Log the refund as an expense (Loss/Refund)
    if (req.body.totalRefund > 0) {
      await Expense.create({
        category: 'Customer Refund',
        amount: req.body.totalRefund,
        date: new Date(),
        notes: `Refund for Sale ID: ${req.body.saleId}`,
        shopId: req.shopId
      }, opts);
    }

    res.status(201).json(rma);
  } catch (err) {
    console.error('Error creating return:', err);
    res.status(500).json({ error: 'Failed to create return' });
  }
});

module.exports = router;
