const express = require('express');
const router = express.Router();
const { renderScanView, reportScanIssue, renderLookupPortal } = require('../controllers/scanController');

// Search Portal (e.g. http://localhost:5000/scan or /lookup)
router.get('/', renderLookupPortal);

// Mobile QR scan and Model Number landing page (e.g. http://localhost:5000/scan/MBMC-MOD-0001 or MBMC-AST-0001)
router.get('/:code', renderScanView);

// Submit condition check / damage report via scan view
router.post('/:code/report', express.urlencoded({ extended: true }), reportScanIssue);

module.exports = router;
