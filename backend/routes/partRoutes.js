const express = require('express');
const router = express.Router();
const partController = require('../controllers/partController');
const { requireAuth } = require('../middleware/auth');
const { injectShopFilter } = require('../middleware/shopScope');

router.use(requireAuth, injectShopFilter);

router.post('/', partController.createPart);
router.get('/', partController.getParts);
router.put('/:id', partController.updatePart);
router.delete('/:id', partController.deletePart);

module.exports = router;
