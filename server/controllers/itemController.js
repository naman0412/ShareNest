const Item = require('../models/Item');

const getItems = async (req, res) => {
  try {
    const { q, category, area, minPrice, maxPrice, sort, owner, page = 1, limit = 10 } = req.query;
    
    let query = { isActive: true };
    if (owner) query.owner = owner;
    if (q) query.$text = { $search: q };
    if (category) query.category = category;
    if (area) query.area = area;
    if (minPrice || maxPrice) {
      query.feePerDay = {};
      if (minPrice) query.feePerDay.$gte = Number(minPrice);
      if (maxPrice) query.feePerDay.$lte = Number(maxPrice);
    }

    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc') sortObj = { feePerDay: 1 };
    if (sort === 'price_desc') sortObj = { feePerDay: -1 };

    const skip = (Number(page) - 1) * Number(limit);
    
    const items = await Item.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate('owner', 'name ratingAvg ratingCount avatar');
      
    const total = await Item.countDocuments(query);

    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('owner', 'name ratingAvg ratingCount avatar email phone area');
    if (!item) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found' } });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const createItem = async (req, res) => {
  try {
    const parsedData = { ...req.body };
    parsedData.feePerDay = Number(parsedData.feePerDay);
    parsedData.depositAmount = Number(parsedData.depositAmount);
    
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => ({ url: `/uploads/${file.filename}` }));
    } else if (req.body.images && typeof req.body.images === 'string') {
        images = JSON.parse(req.body.images);
    } else if (req.body.images && Array.isArray(req.body.images)) {
        images = req.body.images;
    }

    const item = await Item.create({
      ...parsedData,
      owner: req.user._id,
      images
    });
    res.status(201).json(item);
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found' } });
    if (item.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized' } });
    }

    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedItem);
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found' } });
    if (item.owner.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized' } });
    }

    item.isActive = false;
    await item.save();
    res.json({ message: 'Item deactivated' });
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const getAvailability = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found' } });
    
    // We fetch approved/picked_up requests to find blocked dates
    const BorrowRequest = require('../models/BorrowRequest');
    const requests = await BorrowRequest.find({
      item: item._id,
      status: { $in: ['approved', 'picked_up_pending_borrower_confirmation', 'picked_up', 'returned_pending_owner_confirmation'] }
    }).select('startDate endDate status');

    res.json({ availableFrom: item.availableFrom, availableTo: item.availableTo, blockedRanges: requests });
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

module.exports = { getItems, getItem, createItem, updateItem, deleteItem, getAvailability };
