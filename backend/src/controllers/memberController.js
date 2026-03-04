const Group = require('../models/Group');
const {
  calculateAdjustmentOwed,
  validateNewMember,
  assignTurnOrders,
} = require('../services/rotationService');

// @desc    Add a member to a group
// @route   POST /api/groups/:groupId/members
// @access  Private (group admin)
const addMember = async (req, res, next) => {
  try {
    const group = req.group;
    const memberData = req.body;

    // Validate
    const { valid, error } = validateNewMember(group, memberData);
    if (!valid) {
      return res.status(400).json({ success: false, message: error });
    }

    // Handle mid-cycle join
    const joinedMidCycle = group.status === 'active' && group.currentCycle > 1;
    const joinedAtCycle = group.currentCycle;

    const adjustmentOwed = joinedMidCycle
      ? calculateAdjustmentOwed(joinedAtCycle, group.contributionAmount)
      : 0;

    // Auto-assign turn order if not provided
    if (!memberData.turnOrder) {
      const usedOrders = new Set(group.members.map((m) => m.turnOrder));
      let nextOrder = 1;
      while (usedOrders.has(nextOrder)) nextOrder++;
      memberData.turnOrder = nextOrder;
    }

    group.members.push({
      ...memberData,
      joinedMidCycle,
      joinedAtCycle,
      adjustmentOwed,
    });

    await group.save();

    const newMember = group.members[group.members.length - 1];

    res.status(201).json({
      success: true,
      message: `${newMember.name} added${joinedMidCycle ? `. They owe ${group.currency} ${adjustmentOwed.toLocaleString()} as a catch-up adjustment.` : '.'}`,
      member: newMember,
      adjustmentOwed,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all members of a group
// @route   GET /api/groups/:groupId/members
// @access  Private
const getMembers = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    // Sort by turn order
    const members = [...group.members].sort((a, b) => a.turnOrder - b.turnOrder);
    res.json({ success: true, count: members.length, members });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a member's details
// @route   PATCH /api/groups/:groupId/members/:memberId
// @access  Private (group admin)
const updateMember = async (req, res, next) => {
  try {
    const group = req.group;
    const member = group.members.id(req.params.memberId);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const allowedUpdates = ['name', 'phone', 'email', 'notes'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) member[field] = req.body[field];
    });

    await group.save();
    res.json({ success: true, member });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove a member (only before group starts)
// @route   DELETE /api/groups/:groupId/members/:memberId
// @access  Private (group admin)
const removeMember = async (req, res, next) => {
  try {
    const group = req.group;

    if (group.turnOrderLocked) {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove members after the group has started.',
      });
    }

    const member = group.members.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    const memberName = member.name;
    member.deleteOne();
    await group.save();

    res.json({ success: true, message: `${memberName} has been removed from the group.` });
  } catch (error) {
    next(error);
  }
};

// @desc    Reassign a member's turn order
// @route   PATCH /api/groups/:groupId/members/:memberId/turn
// @access  Private (group admin)
const assignTurn = async (req, res, next) => {
  try {
    const group = req.group;
    const { turnOrder } = req.body;

    if (group.turnOrderLocked) {
      return res.status(400).json({
        success: false,
        message: 'Turn order is locked. Cannot reassign turns after the group has started.',
      });
    }

    // Check if turn order is already taken
    const conflict = group.members.find(
      (m) => m.turnOrder === turnOrder && m._id.toString() !== req.params.memberId
    );

    if (conflict) {
      return res.status(400).json({
        success: false,
        message: `Turn ${turnOrder} is already assigned to ${conflict.name}. Swap their turns instead.`,
      });
    }

    const member = group.members.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    member.turnOrder = turnOrder;
    await group.save();

    res.json({ success: true, message: `${member.name} is now turn ${turnOrder}.`, member });
  } catch (error) {
    next(error);
  }
};

// @desc    Swap turn orders between two members
// @route   POST /api/groups/:groupId/members/swap-turns
// @access  Private (group admin)
const swapTurns = async (req, res, next) => {
  try {
    const group = req.group;
    const { memberIdA, memberIdB } = req.body;

    if (group.turnOrderLocked) {
      return res.status(400).json({
        success: false,
        message: 'Turn order is locked after the group starts.',
      });
    }

    const memberA = group.members.id(memberIdA);
    const memberB = group.members.id(memberIdB);

    if (!memberA || !memberB) {
      return res.status(404).json({ success: false, message: 'One or both members not found.' });
    }

    const temp = memberA.turnOrder;
    memberA.turnOrder = memberB.turnOrder;
    memberB.turnOrder = temp;

    await group.save();

    res.json({
      success: true,
      message: `Swapped turns: ${memberA.name} (turn ${memberA.turnOrder}) ↔ ${memberB.name} (turn ${memberB.turnOrder}).`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark adjustment as paid for a mid-cycle member
// @route   PATCH /api/groups/:groupId/members/:memberId/adjustment-paid
// @access  Private (group admin)
const markAdjustmentPaid = async (req, res, next) => {
  try {
    const group = req.group;
    const member = group.members.id(req.params.memberId);

    if (!member) {
      return res.status(404).json({ success: false, message: 'Member not found.' });
    }

    if (!member.joinedMidCycle) {
      return res.status(400).json({
        success: false,
        message: 'This member did not join mid-cycle and has no adjustment owing.',
      });
    }

    member.adjustmentPaid = true;
    await group.save();

    res.json({ success: true, message: `Adjustment marked as paid for ${member.name}.`, member });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addMember,
  getMembers,
  updateMember,
  removeMember,
  assignTurn,
  swapTurns,
  markAdjustmentPaid,
};
