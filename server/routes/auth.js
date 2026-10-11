const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, updateMe, getUser } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);
router.get('/:id', protect, getUser);

module.exports = router;
