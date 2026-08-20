const express = require('express');
const router = express.Router();
const { PurchaseOrder, Supplier, Product } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

router.use(requireAuth, injectShopFilter);

// GET /api/purchase-orders
router.get('/', async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const pos = await PurchaseOrder.findAll({
      where: { shopId: req.shopId },
      order: [['dateCreated', 'DESC']],
      ...opts
    });
    res.json(pos);
  } catch (err) {
    console.error('PO GET error:', err);
    res.status(500).json({ error: 'Failed to fetch POs: ' + err.message });
  }
});

// POST /api/purchase-orders
router.post('/', async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const po = await PurchaseOrder.create({
      ...req.body,
      shopId: req.shopId || (req.user && req.user.shopId) || 1
    }, opts);
    res.status(201).json(po);
  } catch (err) {
    console.error('PO create error:', err);
    res.status(500).json({ error: 'Failed to create PO: ' + err.message });
  }
});

// PUT /api/purchase-orders/:id
router.put('/:id', async (req, res) => {
  try {
    const opts = req._rlsTransaction ? { transaction: req._rlsTransaction } : {};
    const po = await PurchaseOrder.findOne({ where: { id: req.params.id, shopId: req.shopId }, ...opts });
    if (!po) return res.status(404).json({ error: 'PO not found' });
    
    const wasReceived = po.status === 'Received';
    const isReceiving = req.body.status === 'Received';
    
    await po.update(req.body, opts);
    
    // Handle receiving goods
    if (!wasReceived && isReceiving) {
        // Get the updated items from request body (contains imeiList per phone item)
        const receivedItems = req.body.items && Array.isArray(req.body.items) ? req.body.items : (po.items || []);

        if (receivedItems && Array.isArray(receivedItems)) {
            for (const item of receivedItems) {
                const prod = await Product.findOne({ where: { id: item.productId, shopId: req.shopId }, ...opts });
                if (prod) {
                    const oldStock = Number(prod.stock) || 0;
                    const oldCost = Number(prod.cost) || 0;
                    const isPhoneItem = item.isPhone === true || item.productType === 'Phone' || prod.type === 'Phone';
                    
                    // For phones, actual qty received = imeiList.length; for accessories = item.quantity
                    const incomingImeis = (item.imeiList && Array.isArray(item.imeiList)) ? item.imeiList : [];
                    const batchQty = isPhoneItem ? incomingImeis.length : (Number(item.quantity) || 0);
                    const batchCost = item.cost !== undefined && item.cost !== null ? Number(item.cost) : oldCost;

                    if (batchQty === 0) continue;

                    // Weighted Average Cost
                    if (oldStock <= 0) {
                        prod.cost = batchCost;
                    } else if (batchCost >= 0) {
                        const totalVal = (oldStock * oldCost) + (batchQty * batchCost);
                        const totalUnits = oldStock + batchQty;
                        prod.cost = Math.round((totalVal / totalUnits) * 100) / 100;
                    }

                    // Update IMEI list for phones
                    if (isPhoneItem && incomingImeis.length > 0) {
                        const existingImeis = Array.isArray(prod.imeiList) ? prod.imeiList : [];
                        prod.imeiList = [...existingImeis, ...incomingImeis];
                    }

                    prod.stock += batchQty;
                    await prod.save(opts);
                }
            }
        }
        
        if (po.supplierId) {
            const supplier = await Supplier.findOne({ where: { id: po.supplierId, shopId: req.shopId }, ...opts });
            if (supplier) {
                await supplier.increment('outstandingBalance', { by: po.totalAmount, ...opts });
                await supplier.increment('totalStock', { by: receivedItems.reduce((sum, item) => sum + (item.quantity || 0), 0), ...opts });
            }
        }
    } 
    
    res.json(po);
  } catch (err) {
    console.error('Failed to update PO:', err);
    res.status(500).json({ error: 'Failed to update PO: ' + err.message });
  }
});

module.exports = router;
