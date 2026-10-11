const express = require('express');
const router = express.Router();
const { createReview, getReviewsForUser } = require('../controllers/reviewController');
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

// Reviews
router.post('/reviews', protect, createReview);
router.get('/users/:id/reviews', protect, getReviewsForUser); // Wait, this is under users

// Wishlist
router.get('/wishlist', protect, getWishlist);
router.put('/wishlist/:itemId', protect, toggleWishlist);
router.delete('/wishlist/:itemId', protect, toggleWishlist);

module.exports = router;
