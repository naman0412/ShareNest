const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    relatedItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Item' },
    relatedRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'BorrowRequest' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
