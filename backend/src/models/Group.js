const mongoose = require('mongoose');

const memberSlotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // null = slot reserved but not yet linked to a user account
  },
  name: {
    type: String,
    required: [true, 'Member name is required'],
    trim: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
  },
  turnOrder: {
    type: Number,
    required: true,
  },
  hasPaid: {
    type: Boolean,
    default: false,
  },
  hasCollected: {
    type: Boolean,
    default: false,
  },
  // For members who join mid-cycle — they owe catch-up contributions
  joinedMidCycle: {
    type: Boolean,
    default: false,
  },
  joinedAtCycle: {
    type: Number,
    default: 1,
  },
  adjustmentOwed: {
    type: Number,
    default: 0, // calculated: (joinedAtCycle - 1) * contributionAmount
  },
  adjustmentPaid: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    trim: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

const groupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      maxlength: [100, 'Group name cannot exceed 100 characters'],
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    contributionAmount: {
      type: Number,
      required: [true, 'Contribution amount is required'],
      min: [1, 'Contribution amount must be positive'],
    },
    currency: {
      type: String,
      default: 'NGN',
      enum: ['NGN', 'GBP', 'USD', 'EUR', 'GHS', 'KES'],
    },
    frequency: {
      type: String,
      required: [true, 'Frequency is required'],
      enum: ['weekly', 'biweekly', 'monthly'],
      default: 'monthly',
    },
    totalMembers: {
      type: Number,
      required: [true, 'Total members is required'],
      min: [2, 'Group must have at least 2 members'],
      max: [100, 'Group cannot exceed 100 members'],
    },
    // Auto-calculated: contributionAmount * totalMembers
    potTotal: {
      type: Number,
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date, // auto-calculated on save
    },
    currentCycle: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'paused'],
      default: 'draft',
    },
    // Lock turn order once group starts — no re-shuffling
    turnOrderLocked: {
      type: Boolean,
      default: false,
    },
    members: [memberSlotSchema],

    // Stats cache (updated on payment events)
    stats: {
      totalCollected: { type: Number, default: 0 },
      totalPending: { type: Number, default: 0 },
      paidCount: { type: Number, default: 0 },
      unpaidCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-calculate potTotal and endDate before saving
groupSchema.pre('save', function (next) {
  this.potTotal = this.contributionAmount * this.totalMembers;

  if (this.startDate && this.totalMembers) {
    const start = new Date(this.startDate);
    const cyclesMs = {
      weekly: 7 * 24 * 60 * 60 * 1000,
      biweekly: 14 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000,
    };
    this.endDate = new Date(
      start.getTime() + this.totalMembers * cyclesMs[this.frequency]
    );
  }

  // Recalculate stats
  if (this.members && this.members.length > 0) {
    this.stats.paidCount = this.members.filter((m) => m.hasPaid).length;
    this.stats.unpaidCount = this.members.filter((m) => !m.hasPaid).length;
    this.stats.totalCollected =
      this.stats.paidCount * this.contributionAmount;
    this.stats.totalPending =
      this.stats.unpaidCount * this.contributionAmount;
  }

  next();
});

// Virtual: current collector (whose turn it is this cycle)
groupSchema.virtual('currentCollector').get(function () {
  return this.members.find((m) => m.turnOrder === this.currentCycle) || null;
});

// Virtual: next collector
groupSchema.virtual('nextCollector').get(function () {
  return (
    this.members.find((m) => m.turnOrder === this.currentCycle + 1) || null
  );
});

groupSchema.set('toJSON', { virtuals: true });
groupSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Group', groupSchema);
