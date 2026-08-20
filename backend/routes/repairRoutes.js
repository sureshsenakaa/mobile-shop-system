const express = require('express');
const router = express.Router();
const repairController = require('../controllers/repairController');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

router.use(requireAuth, injectShopFilter);

router.post('/', repairController.createRepair);
router.get('/', repairController.getRepairs);
router.put('/:id', repairController.updateRepair);
router.delete('/:id', repairController.deleteRepair);

module.exports = router;
