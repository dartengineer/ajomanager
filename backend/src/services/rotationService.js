/**
 * rotationService.js
 * Core business logic for Ajo rotation, turn assignment,
 * mid-cycle joins, and adjustment calculations.
 */

/**
 * Auto-assign turn orders to members.
 * If turnOrder is already set on a member, respect it.
 * Fill in the rest sequentially.
 * @param {Array} members - Array of member objects
 * @returns {Array} members with turnOrder assigned
 */
const assignTurnOrders = (members) => {
  const assigned = new Set(
    members.filter((m) => m.turnOrder).map((m) => m.turnOrder)
  );

  let nextOrder = 1;
  return members.map((member) => {
    if (member.turnOrder) return member;

    while (assigned.has(nextOrder)) nextOrder++;
    assigned.add(nextOrder);
    return { ...member, turnOrder: nextOrder++ };
  });
};

/**
 * Shuffle turn order randomly (for fair randomisation).
 * @param {Array} members
 * @returns {Array} members with randomised turnOrder
 */
const shuffleTurnOrders = (members) => {
  const shuffled = [...members];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.map((member, index) => ({
    ...member,
    turnOrder: index + 1,
  }));
};

/**
 * Swap turn orders between two members.
 * @param {Array} members
 * @param {String} memberIdA
 * @param {String} memberIdB
 * @returns {Array} updated members
 */
const swapTurnOrders = (members, memberIdA, memberIdB) => {
  const a = members.find((m) => m._id.toString() === memberIdA);
  const b = members.find((m) => m._id.toString() === memberIdB);

  if (!a || !b) throw new Error('One or both members not found.');

  const tempOrder = a.turnOrder;
  a.turnOrder = b.turnOrder;
  b.turnOrder = tempOrder;

  return members;
};

/**
 * Calculate adjustment owed by a mid-cycle joiner.
 * When someone joins after cycle 1, they owe contributions
 * for cycles they missed (since they'll still collect the full pot).
 *
 * Example: Group with ₦50,000/month. Member joins at cycle 3.
 * They missed cycles 1 and 2 → adjustmentOwed = 2 × ₦50,000 = ₦100,000
 *
 * @param {Number} joinedAtCycle - which cycle the member joined
 * @param {Number} contributionAmount
 * @returns {Number} total amount owed as adjustment
 */
const calculateAdjustmentOwed = (joinedAtCycle, contributionAmount) => {
  if (joinedAtCycle <= 1) return 0;
  return (joinedAtCycle - 1) * contributionAmount;
};

/**
 * Get the member whose turn it is to collect for a given cycle.
 * @param {Array} members
 * @param {Number} cycle
 * @returns {Object|null} member or null
 */
const getCollectorForCycle = (members, cycle) => {
  return members.find((m) => m.turnOrder === cycle) || null;
};

/**
 * Get the next collector after the current cycle.
 * @param {Array} members
 * @param {Number} currentCycle
 * @returns {Object|null}
 */
const getNextCollector = (members, currentCycle) => {
  return members.find((m) => m.turnOrder === currentCycle + 1) || null;
};

/**
 * Advance the group to the next cycle.
 * Resets all hasPaid flags, marks current collector as hasCollected.
 * @param {Object} group - Mongoose group document
 * @returns {Object} updated group
 */
const advanceCycle = (group) => {
  const currentCollector = getCollectorForCycle(group.members, group.currentCycle);

  if (currentCollector) {
    const member = group.members.find(
      (m) => m._id.toString() === currentCollector._id.toString()
    );
    if (member) member.hasCollected = true;
  }

  // Reset hasPaid for all members for the new cycle
  group.members.forEach((m) => {
    m.hasPaid = false;
  });

  group.currentCycle += 1;

  // If we've gone past the total members, mark group as completed
  if (group.currentCycle > group.totalMembers) {
    group.status = 'completed';
  }

  return group;
};

/**
 * Generate a dashboard summary for a group.
 * @param {Object} group - populated Mongoose group document
 * @returns {Object} summary stats
 */
const getGroupSummary = (group) => {
  const members = group.members || [];
  const paidMembers = members.filter((m) => m.hasPaid);
  const unpaidMembers = members.filter((m) => !m.hasPaid);
  const collectedMembers = members.filter((m) => m.hasCollected);
  const pendingMembers = members.filter((m) => !m.hasCollected);
  const adjustmentOwed = members.filter(
    (m) => m.joinedMidCycle && !m.adjustmentPaid
  );

  return {
    totalMembers: members.length,
    currentCycle: group.currentCycle,
    totalCycles: group.totalMembers,
    potTotal: group.potTotal,
    contributionAmount: group.contributionAmount,
    frequency: group.frequency,
    status: group.status,

    payments: {
      paid: paidMembers.length,
      unpaid: unpaidMembers.length,
      paidAmount: paidMembers.length * group.contributionAmount,
      pendingAmount: unpaidMembers.length * group.contributionAmount,
    },

    collections: {
      collected: collectedMembers.length,
      pending: pendingMembers.length,
    },

    currentCollector: getCollectorForCycle(members, group.currentCycle),
    nextCollector: getNextCollector(members, group.currentCycle),

    adjustments: {
      membersOwing: adjustmentOwed.length,
      totalOwed: adjustmentOwed.reduce((sum, m) => sum + m.adjustmentOwed, 0),
    },

    progressPercent: Math.round(
      ((group.currentCycle - 1) / group.totalMembers) * 100
    ),
  };
};

/**
 * Validate that a new member can be added to the group.
 * @param {Object} group
 * @param {Object} newMemberData
 * @returns {{ valid: Boolean, error: String|null }}
 */
const validateNewMember = (group, newMemberData) => {
  if (group.status === 'completed') {
    return { valid: false, error: 'Cannot add members to a completed group.' };
  }

  if (group.members.length >= group.totalMembers) {
    return {
      valid: false,
      error: `Group is full. Maximum members: ${group.totalMembers}.`,
    };
  }

  // Check duplicate by phone or email
  if (newMemberData.phone) {
    const duplicate = group.members.find(
      (m) => m.phone === newMemberData.phone
    );
    if (duplicate) {
      return {
        valid: false,
        error: `A member with phone ${newMemberData.phone} already exists in this group.`,
      };
    }
  }

  if (newMemberData.email) {
    const duplicate = group.members.find(
      (m) => m.email === newMemberData.email
    );
    if (duplicate) {
      return {
        valid: false,
        error: `A member with email ${newMemberData.email} already exists in this group.`,
      };
    }
  }

  // Check turn order conflict
  if (newMemberData.turnOrder) {
    const conflict = group.members.find(
      (m) => m.turnOrder === newMemberData.turnOrder
    );
    if (conflict) {
      return {
        valid: false,
        error: `Turn order ${newMemberData.turnOrder} is already taken by ${conflict.name}.`,
      };
    }

    // If turn order locked, can't use a past turn
    if (group.turnOrderLocked && newMemberData.turnOrder < group.currentCycle) {
      return {
        valid: false,
        error: `Turn ${newMemberData.turnOrder} has already passed. The group is on cycle ${group.currentCycle}.`,
      };
    }
  }

  return { valid: true, error: null };
};

module.exports = {
  assignTurnOrders,
  shuffleTurnOrders,
  swapTurnOrders,
  calculateAdjustmentOwed,
  getCollectorForCycle,
  getNextCollector,
  advanceCycle,
  getGroupSummary,
  validateNewMember,
};
