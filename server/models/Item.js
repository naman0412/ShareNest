const mongoose = require('mongoose');
const { CITIES } = require('../utils/constants');

const itemSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    images: [{ url: String }],
    condition: { type: String, required: true },
    feePerDay: { type: Number, required: true, min: 0 },
    depositAmount: { type: Number, required: true, min: 0 },
    area: { type: String, enum: CITIES, required: true, index: true },
    availableFrom: { type: Date, required: true },
    availableTo: { type: Date, required: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

itemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('Item', itemSchema);
