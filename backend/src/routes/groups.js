const express = require('express');
const router = express.Router();
const {
  createGroup, getMyGroups, getGroup, updateGroup,
  deleteGroup, startGroup, shuffleTurns, advanceToNextCycle, getGroupDashboard,
} = require('../controllers/groupController');
const {
  addMember, getMembers, updateMember, removeMember,
  assignTurn, swapTurns, markAdjustmentPaid,
} = require('../controllers/memberController');
const { protect, groupAdmin } = require('../middleware/auth');
const { validate, createGroupSchema, updateGroupSchema, addMemberSchema, updateTurnSchema } = require('../middleware/validation');

// Group CRUD
router.post('/', protect, validate(createGroupSchema), createGroup);
router.get('/', protect, getMyGroups);
router.get('/:id', protect, getGroup);
router.patch('/:id', protect, groupAdmin, validate(updateGroupSchema), updateGroup);
router.delete('/:id', protect, groupAdmin, deleteGroup);

// Group lifecycle
router.post('/:id/start', protect, groupAdmin, startGroup);
router.post('/:id/shuffle-turns', protect, groupAdmin, shuffleTurns);
router.post('/:id/advance-cycle', protect, groupAdmin, advanceToNextCycle);
router.get('/:id/dashboard', protect, getGroupDashboard);

// Members (nested under groups)
router.post('/:groupId/members', protect, groupAdmin, validate(addMemberSchema), addMember);
router.get('/:groupId/members', protect, getMembers);
router.patch('/:groupId/members/swap-turns', protect, groupAdmin, swapTurns);
router.patch('/:groupId/members/:memberId', protect, groupAdmin, updateMember);
router.delete('/:groupId/members/:memberId', protect, groupAdmin, removeMember);
router.patch('/:groupId/members/:memberId/turn', protect, groupAdmin, validate(updateTurnSchema), assignTurn);
router.patch('/:groupId/members/:memberId/adjustment-paid', protect, groupAdmin, markAdjustmentPaid);

module.exports = router;
