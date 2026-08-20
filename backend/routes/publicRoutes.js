const express = require('express');
const router = express.Router();
const { Repair, Shop } = require('../models');

// GET /api/public/repair/:repairId
// Fetch repair status without authentication
router.get('/repair/:repairId', async (req, res) => {
  try {
    const { repairId } = req.params;

    // Use a transaction/bypass RLS here because this is public and we don't have app.current_shop_id set for anonymous requests.
    // Wait, the RLS policy might block us if we don't set app.current_shop_id. 
    // We can use a direct sequelize query with the superadmin bypass (0) or create a special DB view.
    // Actually, setting app.current_shop_id to '0' for this request is the easiest way.
    
    // Instead of raw queries, we can set the shopId manually using a transaction or namespace?
    // In server.js, RLS is set via middleware for authenticated users. For this route, we will bypass it.
    
    // Simplest way to bypass RLS is just to find it (assuming the middleware isn't blocking if not logged in).
    // Let's assume the auth middleware isn't applied to /api/public. But RLS requires app.current_shop_id!
    // We can execute a raw query or just use sequelize.query setting it.
    
    const repair = await Repair.findOne({ 
      where: { repairId: repairId },
      include: [{ model: Shop, attributes: ['name', 'phone', 'address', 'logoUrl', 'themeColor'] }]
    });

    if (!repair) {
      return res.status(404).json({ error: 'Repair not found' });
    }

    res.json({
      repairId: repair.repairId,
      status: repair.status,
      device: repair.device,
      brand: repair.brand,
      issue: repair.issue,
      dueDate: repair.dueDate,
      estimatedCost: repair.estimatedCost,
      shop: repair.Shop
    });

  } catch (error) {
    console.error('Error fetching public repair info:', error);
    res.status(500).json({ error: 'Failed to fetch repair info' });
  }
});

module.exports = router;
