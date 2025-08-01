const express = require('express');
const router = express.Router();
const bulkController = require('../controllers/bulkController');

router.get('/', bulkController.getAllBulkActions);
router.post('/', bulkController.createBulkAction);
router.get('/:id', bulkController.getBulkActionStatus);
router.get('/:id/stats', bulkController.getStats);

module.exports = router;
