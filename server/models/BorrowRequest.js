const mongoose = require('mongoose');

const borrowRequestSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
    borrower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: [
        'requested',
        'approved',
        'picked_up_pending_borrower_confirmation',
        'picked_up',
        'returned_pending_owner_confirmation',
        'completed',
        'declined',
        'cancelled',
      ],
      default: 'requested',
    },
    totalFee: { type: Number, required: true },
    depositAmount: { type: Number, required: true }, // snapshot
    borrowerNote: { type: String, default: '' },
    pickupMarkedAt: { type: Date },
    pickupConfirmedAt: { type: Date },
    returnedMarkedAt: { type: Date },
    returnConfirmedAt: { type: Date },
    returnCondition: { type: String },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BorrowRequest', borrowRequestSchema);
