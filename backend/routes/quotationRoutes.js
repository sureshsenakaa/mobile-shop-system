const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/quotationController');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

router.use(requireAuth, injectShopFilter);

router.post('/', ctrl.createQuotation);
router.get('/', ctrl.getQuotations);
router.get('/:id', ctrl.getQuotation);
router.put('/:id', ctrl.updateQuotation);
router.delete('/:id', ctrl.deleteQuotation);
router.post('/:id/convert', ctrl.convertToSale);

module.exports = router;
