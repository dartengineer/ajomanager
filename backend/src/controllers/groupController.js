const Group = require('../models/Group');
const User = require('../models/User');
const {
  assignTurnOrders,
  shuffleTurnOrders,
  calculateAdjustmentOwed,
  advanceCycle,
  getGroupSummary,
  validateNewMember,
} = require('../services/rotationService');

// @desc    Create a new Ajo group
// @route   POST /api/groups
// @access  Private (admin)
const createGroup = async (req, res, next) => {
  try {
    const group = await Group.create({
      ...req.body,
      adminId: req.user._id,
    });

    // Add group reference to user
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { groups: group._id },
    });

    res.status(201).json({ success: true, group });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all groups for the logged-in admin
// @route   GET /api/groups
// @access  Private
const getMyGroups = async (req, res, next) => {
  try {
    const groups = await Group.find({ adminId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: groups.length, groups });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single group with full details
// @route   GET /api/groups/:id
// @access  Private
const getGroup = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    // Attach summary stats
    const summary = getGroupSummary(group);
    res.json({ success: true, group, summary });
  } catch (error) {
    next(error);
  }
};

// @desc    Update group details (before it starts)
// @route   PATCH /api/groups/:id
// @access  Private (group admin)
const updateGroup = async (req, res, next) => {
  try {
    const group = req.group; // set by groupAdmin middleware

    if (group.turnOrderLocked && (req.body.contributionAmount || req.body.totalMembers)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change contribution amount or member count after the group has started.',
      });
    }

    Object.assign(group, req.body);
    await group.save();

    res.json({ success: true, group });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a group (only if draft)
// @route   DELETE /api/groups/:id
// @access  Private (group admin)
const deleteGroup = async (req, res, next) => {
  try {
    const group = req.group;

    if (group.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft groups can be deleted. Archive an active group instead.',
      });
    }

    await group.deleteOne();
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { groups: group._id },
    });

    res.json({ success: true, message: 'Group deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Start the group — locks turn order and sets status to active
// @route   POST /api/groups/:id/start
// @access  Private (group admin)
const startGroup = async (req, res, next) => {
  try {
    const group = req.group;

    if (group.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: `Group cannot be started. Current status: ${group.status}.`,
      });
    }

    if (group.members.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Add at least 2 members before starting the group.',
      });
    }

    // Auto-fill any missing turn orders
    const membersWithOrders = assignTurnOrders(group.members);
    group.members = membersWithOrders;
    group.status = 'active';
    group.turnOrderLocked = true;
    group.currentCycle = 1;

    await group.save();
    res.json({ success: true, message: 'Group started! Turn order is now locked.', group });
  } catch (error) {
    next(error);
  }
};

// @desc    Shuffle turn order (only before group starts)
// @route   POST /api/groups/:id/shuffle-turns
// @access  Private (group admin)
const shuffleTurns = async (req, res, next) => {
  try {
    const group = req.group;

    if (group.turnOrderLocked) {
      return res.status(400).json({
        success: false,
        message: 'Turn order is locked. Cannot shuffle after group has started.',
      });
    }

    group.members = shuffleTurnOrders(group.members);
    await group.save();

    res.json({ success: true, message: 'Turn order shuffled.', members: group.members });
  } catch (error) {
    next(error);
  }
};

// @desc    Advance to next cycle
// @route   POST /api/groups/:id/advance-cycle
// @access  Private (group admin)
const advanceToNextCycle = async (req, res, next) => {
  try {
    const group = req.group;

    if (group.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active groups can be advanced.',
      });
    }

    const updatedGroup = advanceCycle(group);
    await updatedGroup.save();

    res.json({
      success: true,
      message: `Advanced to cycle ${updatedGroup.currentCycle}.`,
      group: updatedGroup,
      summary: getGroupSummary(updatedGroup),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard summary for a group
// @route   GET /api/groups/:id/dashboard
// @access  Private
const getGroupDashboard = async (req, res, next) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Group not found.' });
    }

    const summary = getGroupSummary(group);
    res.json({ success: true, summary, group });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGroup,
  getMyGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  startGroup,
  shuffleTurns,
  advanceToNextCycle,
  getGroupDashboard,
};
