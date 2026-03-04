const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const Group = require('../models/Group');
const { protect, groupAdmin } = require('../middleware/auth');
const { sendPaymentReminder, sendTurnUpcomingNotice } = require('../services/emailService');

// @desc    Get all notifications for a group
// @route   GET /api/notifications/group/:groupId
router.get('/group/:groupId', protect, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ groupId: req.params.groupId })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, count: notifications.length, notifications });
  } catch (error) {
    next(error);
  }
});

// @desc    Manually send payment reminder to a specific member
// @route   POST /api/notifications/remind
router.post('/remind', protect, async (req, res, next) => {
  try {
    const { groupId, memberId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });
    if (group.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const member = group.members.id(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    if (!member.email) {
      return res.status(400).json({ success: false, message: `${member.name} has no email on file.` });
    }

    const notification = await Notification.create({
      groupId,
      recipientEmail: member.email,
      recipientName: member.name,
      type: 'payment_reminder',
      status: 'pending',
    });

    await sendPaymentReminder({
      to: member.email,
      name: member.name,
      groupName: group.name,
      amount: group.contributionAmount,
      currency: group.currency,
      cycle: group.currentCycle,
      notificationId: notification._id,
    });

    res.json({ success: true, message: `Reminder sent to ${member.name}.` });
  } catch (error) {
    next(error);
  }
});

// @desc    Send "your turn is coming" notification
// @route   POST /api/notifications/turn-notice
router.post('/turn-notice', protect, async (req, res, next) => {
  try {
    const { groupId, memberId } = req.body;

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found.' });

    const member = group.members.id(memberId);
    if (!member) return res.status(404).json({ success: false, message: 'Member not found.' });
    if (!member.email) {
      return res.status(400).json({ success: false, message: `${member.name} has no email on file.` });
    }

    const notification = await Notification.create({
      groupId,
      recipientEmail: member.email,
      recipientName: member.name,
      type: 'turn_upcoming',
      status: 'pending',
    });

    await sendTurnUpcomingNotice({
      to: member.email,
      name: member.name,
      groupName: group.name,
      amount: group.potTotal,
      currency: group.currency,
      cycle: member.turnOrder,
      notificationId: notification._id,
    });

    res.json({ success: true, message: `Turn notice sent to ${member.name}.` });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
