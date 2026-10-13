const BorrowRequest = require('../models/BorrowRequest');
const Item = require('../models/Item');
const Notification = require('../models/Notification');

const createNotification = async (userId, type, message, relatedItem, relatedRequest) => {
  try {
    if (userId) {
      await Notification.create({ user: userId, type, message, relatedItem, relatedRequest });
    }
  } catch (err) {
    console.error('Notification creation non-fatal error:', err.message);
  }
};

const createRequest = async (req, res) => {
  try {
    const itemId = req.body.item || req.body.itemId;
    if (!itemId) {
      return res.status(400).json({ error: { code: 'INVALID', message: 'Item ID is required' } });
    }

    const item = await Item.findById(itemId);
    
    if (!item || !item.isActive) {
      return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Item not found or inactive' } });
    }
    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: { code: 'INVALID', message: 'Owner cannot borrow own item' } });
    }

    const { startDate, endDate, borrowerNote } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: { code: 'INVALID', message: 'Pickup and return dates are required' } });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).json({ error: { code: 'INVALID', message: 'Return date must be after pickup date' } });
    }

    // Availability window check
    if (item.availableFrom) {
      const availStart = new Date(item.availableFrom);
      availStart.setHours(0, 0, 0, 0);
      const bookingStart = new Date(start);
      bookingStart.setHours(23, 59, 59, 999);
      if (bookingStart < availStart) {
        return res.status(400).json({ error: { code: 'INVALID', message: 'Pickup date is before item availability date' } });
      }
    }
    if (item.availableTo) {
      const availEnd = new Date(item.availableTo);
      availEnd.setHours(23, 59, 59, 999);
      const bookingEnd = new Date(end);
      bookingEnd.setHours(0, 0, 0, 0);
      if (bookingEnd > availEnd) {
        return res.status(400).json({ error: { code: 'INVALID', message: 'Return date is after item availability date' } });
      }
    }

    // Check conflict against approved/picked_up statuses
    const conflict = await BorrowRequest.findOne({
      item: itemId,
      status: { $in: ['approved', 'picked_up_pending_borrower_confirmation', 'picked_up', 'returned_pending_owner_confirmation'] },
      $and: [
        { startDate: { $lt: end } },
        { endDate: { $gt: start } }
      ]
    });

    if (conflict) {
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Dates conflict with an existing approved rental for this item' } });
    }

    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const totalFee = days * (item.feePerDay || 0);

    const request = await BorrowRequest.create({
      item: itemId,
      borrower: req.user._id,
      owner: item.owner,
      startDate,
      endDate,
      totalFee,
      depositAmount: item.depositAmount || 0,
      borrowerNote: borrowerNote || ''
    });

    await createNotification(item.owner, 'request_created', `New borrow request for ${item.title}`, item._id, request._id);

    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const getMine = async (req, res) => {
  try {
    const requests = await BorrowRequest.find({ borrower: req.user._id })
      .populate('item')
      .populate('owner', 'name email phone avatar area')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const getReceived = async (req, res) => {
  try {
    const requests = await BorrowRequest.find({ owner: req.user._id })
      .populate('item')
      .populate('borrower', 'name email phone avatar area')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const getRequest = async (req, res) => {
  try {
    const request = await BorrowRequest.findById(req.params.id)
      .populate('item')
      .populate('borrower', 'name email phone avatar area')
      .populate('owner', 'name email phone avatar area');
    
    if (!request) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });
    if (request.borrower._id.toString() !== req.user._id.toString() && request.owner._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized' } });
    }

    // Mask sensitive info if not approved yet
    if (request.status === 'requested' || request.status === 'declined' || request.status === 'cancelled') {
      if (request.borrower._id.toString() !== req.user._id.toString()) {
         request.borrower.phone = undefined;
         request.borrower.email = undefined;
      }
      if (request.owner._id.toString() !== req.user._id.toString()) {
         request.owner.phone = undefined;
         request.owner.email = undefined;
      }
    }

    res.json(request);
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

// Transition Service logic embedded for conciseness
const updateStatus = async (req, res) => {
  try {
    const { action } = req.params;
    const request = await BorrowRequest.findById(req.params.id).populate('item');
    if (!request) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });

    const isOwner = request.owner.toString() === req.user._id.toString();
    const isBorrower = request.borrower.toString() === req.user._id.toString();
    const itemTitle = request.item?.title || 'your requested item';
    const itemId = request.item?._id || request.item;

    let newStatus = '';
    
    switch (action) {
      case 'approve':
        if (!isOwner) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only owner can approve' } });
        if (request.status !== 'requested') return res.status(409).json({ error: { code: 'CONFLICT', message: 'Invalid state transition' } });
        
        // Recheck conflict atomically using update condition
        const conflict = await BorrowRequest.findOne({
          item: itemId,
          _id: { $ne: request._id },
          status: { $in: ['approved', 'picked_up_pending_borrower_confirmation', 'picked_up', 'returned_pending_owner_confirmation'] },
          $and: [{ startDate: { $lt: request.endDate } }, { endDate: { $gt: request.startDate } }]
        });
        if (conflict) return res.status(409).json({ error: { code: 'CONFLICT', message: 'Dates conflict with an existing approved request' } });
        
        newStatus = 'approved';
        await createNotification(request.borrower, 'request_approved', `Your request for ${itemTitle} was approved`, itemId, request._id);
        break;

      case 'decline':
        if (!isOwner) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only owner can decline' } });
        if (request.status !== 'requested') return res.status(409).json({ error: { code: 'CONFLICT' } });
        newStatus = 'declined';
        await createNotification(request.borrower, 'request_declined', `Your request for ${itemTitle} was declined`, itemId, request._id);
        break;

      case 'cancel':
        if (!isBorrower && !isOwner) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Not authorized to cancel' } });
        if (request.status !== 'requested' && request.status !== 'approved') return res.status(409).json({ error: { code: 'CONFLICT' } });
        newStatus = 'cancelled';
        request.cancellationReason = req.body.reason || 'User cancelled';
        const otherParty = isOwner ? request.borrower : request.owner;
        await createNotification(otherParty, 'request_cancelled', `Request for ${itemTitle} was cancelled`, itemId, request._id);
        break;

      case 'pickup':
        if (!isOwner) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only owner can mark item handed over' } });
        if (request.status !== 'approved') return res.status(409).json({ error: { code: 'CONFLICT' } });
        newStatus = 'picked_up_pending_borrower_confirmation';
        request.pickupMarkedAt = new Date();
        await createNotification(request.borrower, 'pickup_marked', `Owner marked ${itemTitle} as handed over. Please confirm.`, itemId, request._id);
        break;

      case 'confirm-pickup':
        if (!isBorrower) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only borrower can confirm pickup' } });
        if (request.status !== 'picked_up_pending_borrower_confirmation') return res.status(409).json({ error: { code: 'CONFLICT' } });
        newStatus = 'picked_up';
        request.pickupConfirmedAt = new Date();
        await createNotification(request.owner, 'pickup_confirmed', `Borrower confirmed pickup of ${itemTitle}`, itemId, request._id);
        break;

      case 'return':
        if (!isBorrower) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only borrower can mark item returned' } });
        if (request.status !== 'picked_up') return res.status(409).json({ error: { code: 'CONFLICT' } });
        newStatus = 'returned_pending_owner_confirmation';
        request.returnedMarkedAt = new Date();
        await createNotification(request.owner, 'return_marked', `Borrower returned ${itemTitle}. Please confirm.`, itemId, request._id);
        break;

      case 'confirm-return':
        if (!isOwner) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only owner can confirm return' } });
        if (request.status !== 'returned_pending_owner_confirmation') return res.status(409).json({ error: { code: 'CONFLICT' } });
        newStatus = 'completed';
        request.returnConfirmedAt = new Date();
        request.returnCondition = req.body.condition || 'Good';
        await createNotification(request.borrower, 'return_confirmed', `Owner confirmed return of ${itemTitle}. Request completed.`, itemId, request._id);
        break;

      default:
        return res.status(400).json({ error: { code: 'INVALID', message: 'Unknown action' } });
    }

    request.status = newStatus;
    await request.save();
    res.json(request);
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

module.exports = { createRequest, getMine, getReceived, getRequest, updateStatus };
