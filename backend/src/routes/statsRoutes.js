const express = require('express');
const router = express.Router();
const {
  getOverview,
  getByBuilding,
  getByDepartment,
  getByCategory,
} = require('../controllers/statsController');

router.get('/overview', getOverview);
router.get('/by-building', getByBuilding);
router.get('/by-department', getByDepartment);
router.get('/by-category', getByCategory);

module.exports = router;
