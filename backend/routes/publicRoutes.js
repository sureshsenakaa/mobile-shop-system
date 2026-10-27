const express = require('express');
const router = express.Router();
const { Repair, Shop, sequelize } = require('../models');

// GET /api/public/repair/:repairId
// Fetch repair status without authentication
router.get('/repair/:repairId', async (req, res) => {
  try {
    const { repairId } = req.params;

    // Bypass RLS by setting app.current_shop_id = '0' (super admin level)
    // This is safe because we only return limited, non-sensitive fields
    const result = await sequelize.transaction(async (t) => {
      await sequelize.query(
        `SET LOCAL app.current_shop_id = '0'`,
        { transaction: t }
      );

      return await Repair.findOne({
        where: { repairId: repairId },
        include: [{ model: Shop, attributes: ['name', 'phone', 'address', 'logoUrl', 'themeColor'] }],
        transaction: t
      });
    });

    if (!result) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json({
      repairId: result.repairId,
      status: result.status,
      device: result.device,
      brand: result.brand,
      issue: result.issue,
      cost: result.cost,
      dueDate: result.dueDate,
      shop: result.Shop
    });

  } catch (error) {
    console.error('Error fetching public repair info:', error);
    res.status(500).json({ message: 'Failed to fetch repair info' });
  }
});

module.exports = router;
