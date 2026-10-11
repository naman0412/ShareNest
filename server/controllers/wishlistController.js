const Wishlist = require('../models/Wishlist');

const getWishlist = async (req, res) => {
  try {
    const list = await Wishlist.find({ user: req.user._id }).populate({
      path: 'item',
      populate: { path: 'owner', select: 'name ratingAvg avatar' }
    });
    res.json(list.map(w => w.item));
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const { itemId } = req.params;
    const existing = await Wishlist.findOne({ user: req.user._id, item: itemId });
    
    if (existing) {
      await Wishlist.findByIdAndDelete(existing._id);
      res.json({ message: 'Removed from wishlist' });
    } else {
      await Wishlist.create({ user: req.user._id, item: itemId });
      res.status(201).json({ message: 'Added to wishlist' });
    }
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

module.exports = { getWishlist, toggleWishlist };
