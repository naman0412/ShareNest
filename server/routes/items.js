const express = require('express');
const router = express.Router();
const { getItems, getItem, createItem, updateItem, deleteItem, getAvailability } = require('../controllers/itemController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.route('/')
  .get(getItems)
  .post(protect, upload.array('images', 4), createItem);

router.route('/:id')
  .get(getItem)
  .patch(protect, updateItem)
  .delete(protect, deleteItem);

router.get('/:id/availability', getAvailability);

module.exports = router;
