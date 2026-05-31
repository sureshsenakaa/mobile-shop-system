const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { requireAuth } = require('../middleware/auth');

router.post('/', requireAuth, saleController.createSale);
router.get('/', saleController.getSales);
router.get('/daily', saleController.getDailySales);
router.get('/summary', saleController.getSummary);
router.post('/:id/return', requireAuth, saleController.returnSale);
router.delete('/:id', requireAuth, saleController.deleteSale);

module.exports = router;
