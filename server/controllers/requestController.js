const BorrowRequest = require('../models/BorrowRequest');
const Item = require('../models/Item');
const Notification = require('../models/Notification');

const createNotification = async (userId, type, message, relatedItem, relatedRequest) => {
  await Notification.create({ user: userId, type, message, relatedItem, relatedRequest });
};

const createRequest = async (req, res) => {
  try {
    const { item: itemId, startDate, endDate, borrowerNote } = req.body;
    const item = await Item.findById(itemId);
    
    if (!item || !item.isActive) {
      return res.status(400).json({ error: { code: 'INVALID', message: 'Item not found or inactive' } });
    }
    if (item.owner.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: { code: 'INVALID', message: 'Owner cannot borrow own item' } });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) return res.status(400).json({ error: { code: 'INVALID', message: 'Invalid dates' } });
    if (start < new Date(item.availableFrom) || end > new Date(item.availableTo)) {
      return res.status(400).json({ error: { code: 'INVALID', message: 'Dates outside availability window' } });
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
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'Dates conflict with an existing approved request' } });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalFee = days * item.feePerDay;

    const request = await BorrowRequest.create({
      item: itemId,
      borrower: req.user._id,
      owner: item.owner,
      startDate,
      endDate,
      totalFee,
      depositAmount: item.depositAmount,
      borrowerNote
    });

    await createNotification(item.owner, 'request_created', `New borrow request for ${item.title}`, item._id, request._id);

    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ error: { code: 'INVALID', message: error.message } });
  }
};

const getMine = async (req, res) => {
  const requests = await BorrowRequest.find({ borrower: req.user._id }).populate('item').sort({ createdAt: -1 });
  res.json(requests);
};

const getReceived = async (req, res) => {
  const requests = await BorrowRequest.find({ owner: req.user._id }).populate('item borrower', 'name avatar').sort({ createdAt: -1 });
  res.json(requests);
};

const getRequest = async (req, res) => {
  const request = await BorrowRequest.findById(req.params.id)
    .populate('item')
    .populate('borrower', 'name email phone avatar')
    .populate('owner', 'name email phone avatar');
  
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
};

// Transition Service logic embedded for conciseness
const updateStatus = async (req, res) => {
  try {
    const { action } = req.params;
    const request = await BorrowRequest.findById(req.params.id).populate('item');
    if (!request) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Not found' } });

    const isOwner = request.owner.toString() === req.user._id.toString();
    const isBorrower = request.borrower.toString() === req.user._id.toString();

    let newStatus = '';
    
    switch (action) {
      case 'approve':
        if (!isOwner) return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only owner can approve' } });
        if (request.status !== 'requested') return res.status(409).json({ error: { code: 'CONFLICT', message: 'Invalid state transition' } });
        
        // Recheck conflict atomically using update condition
        const conflict = await BorrowRequest.findOne({
          item: request.item._id,
          _id: { $ne: request._id },
          status: { $in: ['approved', 'picked_up_pending_borrower_confirmation', 'picked_up', 'returned_pending_owner_confirmation'] },
          $and: [{ startDate: { $lt: request.endDate } }, { endDate: { $gt: request.startDate } }]
        });
        if (conflict) return res.status(409).json({ error: { code: 'CONFLICT', message: 'Dates conflict with an existing approved request' } });
        
        newStatus = 'approved';
        await createNotification(request.borrower, 'request_approved', `Your request for ${request.item.title} was approved`, request.item._id, request._id);
        break;

      case 'decline':
        if (!isOwner) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
        if (request.status !== 'requested') return res.status(409).json({ error: { code: 'CONFLICT' } });
        newStatus = 'declined';
        await createNotification(request.borrower, 'request_declined', `Your request for ${request.item.title} was declined`, request.item._id, request._id);
        break;

      case 'cancel':
        if (!isBorrower && !isOwner) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
        if (request.status !== 'requested' && request.status !== 'approved') return res.status(409).json({ error: { code: 'CONFLICT' } });
        newStatus = 'cancelled';
        request.cancellationReason = req.body.reason || 'User cancelled';
        const otherParty = isOwner ? request.borrower : request.owner;
        await createNotification(otherParty, 'request_cancelled', `Request for ${request.item.title} was cancelled`, request.item._id, request._id);
        break;

      case 'pickup':
        if (!isOwner) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
        if (request.status !== 'approved') return res.status(409).json({ error: { code: 'CONFLICT' } });
        newStatus = 'picked_up_pending_borrower_confirmation';
        request.pickupMarkedAt = new Date();
        await createNotification(request.borrower, 'pickup_marked', `Owner marked ${request.item.title} as handed over. Please confirm.`, request.item._id, request._id);
        break;

      case 'confirm-pickup':
        if (!isBorrower) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
        if (request.status !== 'picked_up_pending_borrower_confirmation') return res.status(409).json({ error: { code: 'CONFLICT' } });
        newStatus = 'picked_up';
        request.pickupConfirmedAt = new Date();
        await createNotification(request.owner, 'pickup_confirmed', `Borrower confirmed pickup of ${request.item.title}`, request.item._id, request._id);
        break;

      case 'return':
        if (!isBorrower) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
        if (request.status !== 'picked_up') return res.status(409).json({ error: { code: 'CONFLICT' } });
        newStatus = 'returned_pending_owner_confirmation';
        request.returnedMarkedAt = new Date();
        await createNotification(request.owner, 'return_marked', `Borrower returned ${request.item.title}. Please confirm.`, request.item._id, request._id);
        break;

      case 'confirm-return':
        if (!isOwner) return res.status(403).json({ error: { code: 'FORBIDDEN' } });
        if (request.status !== 'returned_pending_owner_confirmation') return res.status(409).json({ error: { code: 'CONFLICT' } });
        newStatus = 'completed';
        request.returnConfirmedAt = new Date();
        request.returnCondition = req.body.condition || 'Good';
        await createNotification(request.borrower, 'return_confirmed', `Owner confirmed return of ${request.item.title}. Request completed.`, request.item._id, request._id);
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
