const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Report = require('../models/Report');
const { protect, admin } = require('../middleware/auth');
const Item = require('../models/Item');
const User = require('../models/User');

// Notifications
router.get('/notifications', protect, async (req, res) => {
  const notifs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });
  res.json({ notifications: notifs, unreadCount });
});

router.patch('/notifications/:id/read', protect, async (req, res) => {
  const notif = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isRead: true }, { new: true });
  res.json(notif);
});

// Reports
router.post('/reports', protect, async (req, res) => {
  const report = await Report.create({ ...req.body, reporter: req.user._id });
  res.status(201).json(report);
});

// Admin
router.get('/admin/reports', protect, admin, async (req, res) => {
  const reports = await Report.find().populate('reporter', 'name email').sort({ createdAt: -1 });
  res.json(reports);
});

router.patch('/admin/items/:id/status', protect, admin, async (req, res) => {
  const item = await Item.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  res.json(item);
});

router.patch('/admin/users/:id/status', protect, admin, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isActive: req.body.isActive }, { new: true });
  res.json(user);
});

module.exports = router;
