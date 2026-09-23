const express = require('express');
const router = express.Router();
const {
  getItems,
  getItemById,
  getItemByCode,
  getItemByModel,
  lookupItem,
  createItem,
  updateItem,
  patchStatus,
  deleteItem,
  getDepartments,
  getBuildings,
} = require('../controllers/itemController');

// Metadata endpoints
router.get('/departments', getDepartments);
router.get('/buildings', getBuildings);

// Code and Model-based lookups
router.get('/code/:code', getItemByCode);
router.get('/model/:modelNumber', getItemByModel);
router.get('/lookup/:query', lookupItem);

// Standard CRUD
router.route('/').get(getItems).post(createItem);

router.route('/:id').get(getItemById).put(updateItem).delete(deleteItem);

router.patch('/:id/status', patchStatus);

module.exports = router;
