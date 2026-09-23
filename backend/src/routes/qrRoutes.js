const express = require('express');
const router = express.Router();
const { getQrImage, getPrintableLabel, getBatchLabels } = require('../controllers/qrController');

// Batch printable labels sheet (e.g. /api/qr/batch-labels?limit=30)
router.get('/batch-labels', getBatchLabels);

// Single label printable card
router.get('/:code/label', getPrintableLabel);

// Dynamic PNG image streaming
router.get('/:code/image', getQrImage);

module.exports = router;
