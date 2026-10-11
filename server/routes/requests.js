const express = require('express');
const router = express.Router();
const { createRequest, getMine, getReceived, getRequest, updateStatus } = require('../controllers/requestController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/', createRequest);
router.get('/mine', getMine);
router.get('/received', getReceived);
router.get('/:id', getRequest);
router.patch('/:id/:action', updateStatus); // action in enum: approve|decline|cancel|pickup|confirm-pickup|return|confirm-return

module.exports = router;
