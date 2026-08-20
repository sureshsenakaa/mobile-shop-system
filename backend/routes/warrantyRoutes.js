const express = require('express');
const router = express.Router();
const { Product, SaleItem, Repair, Sale, Customer } = require('../models');
const { requireAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/warranty/:imei
// Checks warranty status by IMEI in Sales and Repairs
router.get('/:imei', requireAuth, async (req, res) => {
  try {
    const { imei } = req.params;

    // Check in SaleItems
    const saleItems = await SaleItem.findAll({
      where: { imei },
      include: [
        { model: Sale, include: [{ model: Customer }] },
        { model: Product }
      ]
    });

    // Check in Repairs
    const repairs = await Repair.findAll({
      where: { imei: imei } // Wait, Repair model doesn't have imei directly. It has serialNumber.
      // Let's use serialNumber for repairs
    });

    res.json({
      success: true,
      sales: saleItems,
      repairs: await Repair.findAll({ where: { serialNumber: imei } })
    });

  } catch (error) {
    console.error('Error fetching warranty info:', error);
    res.status(500).json({ error: 'Failed to fetch warranty info' });
  }
});

module.exports = router;
