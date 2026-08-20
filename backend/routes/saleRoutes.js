const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

router.use(requireAuth, injectShopFilter);

router.post('/', saleController.createSale);
router.get('/', saleController.getSales);
router.get('/daily', saleController.getDailySales);
router.get('/summary', saleController.getSummary);
router.post('/:id/return', saleController.returnSale);
router.delete('/:id', saleController.deleteSale);

module.exports = router;
