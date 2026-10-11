const Review = require('../models/Review');
const BorrowRequest = require('../models/BorrowRequest');
const User = require('../models/User');

const createReview = async (req, res) => {
  try {
    const { request: requestId, rating, comment } = req.body;
    
    const request = await BorrowRequest.findById(requestId);
    if (!request || request.status !== 'completed') {
      return res.status(400).json({ error: { code: 'INVALID', message: 'Can only review completed requests' } });
    }

    const isBorrower = request.borrower.toString() === req.user._id.toString();
    const isOwner = request.owner.toString() === req.user._id.toString();
    
    if (!isBorrower && !isOwner) {
      return res.status(403).json({ error: { code: 'FORBIDDEN' } });
    }

    const revieweeId = isBorrower ? request.owner : request.borrower;

    const existing = await Review.findOne({ request: requestId, reviewer: req.user._id });
    if (existing) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Already reviewed' } });
    }

    const review = await Review.create({
      request: requestId,
      reviewer: req.user._id,
      reviewee: revieweeId,
      rating: Number(rating),
      comment
    });

    // Update reviewee stats
    const allReviews = await Review.find({ reviewee: revieweeId });
    const avg = allReviews.reduce((acc, curr) => acc + curr.rating, 0) / allReviews.length;
    
    await User.findByIdAndUpdate(revieweeId, {
      ratingAvg: avg,
      ratingCount: allReviews.length
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const getReviewsForUser = async (req, res) => {
  try {
    const reviews = await Review.find({ reviewee: req.params.id }).populate('reviewer', 'name avatar').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

module.exports = { createReview, getReviewsForUser };
