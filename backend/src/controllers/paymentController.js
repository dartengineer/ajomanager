const Payment = require('../models/Payment');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const { sendPaymentConfirmation } = require('../services/emailService');

// @desc    Record a payment
// @route   POST /api/payments
// @access  Private (admin)
const recordPayment = async (req, res, next) => {
  try {
    const { groupId, memberId, cycle, amount, type, method, reference, notes, paidAt } = req.body;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    // Verify group belongs to this admin
    if (group.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const member = group.members.id(memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found in this group.' });
    }

    // Check for duplicate payment
    const existing = await Payment.findOne({ groupId, memberId, cycle, type });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `${member.name} already has a ${type} recorded for cycle ${cycle}.`,
      });
    }

    // Create payment record
    const payment = await Payment.create({
      groupId,
      memberId,
      memberName: member.name,
      cycle,
      amount,
      type,
      method,
      reference,
      notes,
      paidAt: paidAt || new Date(),
      recordedBy: req.user._id,
    });

    // Update member's hasPaid flag (for current cycle contributions)
    if (type === 'contribution' && cycle === group.currentCycle) {
      member.hasPaid = true;
    }

    // Update member's adjustmentPaid flag
    if (type === 'adjustment') {
      member.adjustmentPaid = true;
    }

    await group.save();

    // Send confirmation email if member has email
    if (member.email) {
      const notification = await Notification.create({
        groupId,
        recipientEmail: member.email,
        recipientName: member.name,
        type: 'payment_received',
        status: 'pending',
      });

      sendPaymentConfirmation({
        to: member.email,
        name: member.name,
        groupName: group.name,
        amount,
        currency: group.currency,
        cycle,
        method,
        notificationId: notification._id,
      }).catch(console.error); // fire and forget
    }

    res.status(201).json({
      success: true,
      message: `Payment of ${group.currency} ${amount.toLocaleString()} recorded for ${member.name}.`,
      payment,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments for a group
// @route   GET /api/payments/group/:groupId
// @access  Private
const getGroupPayments = async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { cycle, memberId, type } = req.query;

    const filter = { groupId };
    if (cycle) filter.cycle = parseInt(cycle);
    if (memberId) filter.memberId = memberId;
    if (type) filter.type = type;

    const payments = await Payment.find(filter)
      .populate('recordedBy', 'name email')
      .sort({ paidAt: -1 });

    res.json({ success: true, count: payments.length, payments });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment summary for a cycle
// @route   GET /api/payments/group/:groupId/cycle/:cycle
// @access  Private
const getCycleSummary = async (req, res, next) => {
  try {
    const { groupId, cycle } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const payments = await Payment.find({ groupId, cycle: parseInt(cycle) });

    const paidMemberIds = new Set(payments.map((p) => p.memberId.toString()));

    const summary = group.members.map((m) => ({
      memberId: m._id,
      name: m.name,
      phone: m.phone,
      turnOrder: m.turnOrder,
      paid: paidMemberIds.has(m._id.toString()),
      payment: payments.find((p) => p.memberId.toString() === m._id.toString()) || null,
    }));

    res.json({
      success: true,
      cycle: parseInt(cycle),
      totalMembers: group.members.length,
      paidCount: paidMemberIds.size,
      unpaidCount: group.members.length - paidMemberIds.size,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/void a payment (admin only)
// @route   DELETE /api/payments/:id
// @access  Private (admin)
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    const group = await Group.findById(payment.groupId);
    if (!group || group.adminId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    // Revert hasPaid on the member
    const member = group.members.id(payment.memberId);
    if (member && payment.type === 'contribution' && payment.cycle === group.currentCycle) {
      member.hasPaid = false;
      await group.save();
    }

    await payment.deleteOne();

    res.json({ success: true, message: 'Payment voided and removed.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { recordPayment, getGroupPayments, getCycleSummary, deletePayment };
