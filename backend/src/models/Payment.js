const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    memberId: {
      type: mongoose.Schema.Types.ObjectId, // refers to the memberSlot _id inside Group.members
      required: true,
    },
    memberName: {
      type: String,
      required: true, // denormalized for fast display
    },
    cycle: {
      type: Number,
      required: true, // which Ajo cycle this payment covers
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [1, 'Amount must be positive'],
    },
    type: {
      type: String,
      enum: ['contribution', 'adjustment'], // adjustment = mid-cycle catch-up
      default: 'contribution',
    },
    method: {
      type: String,
      enum: ['cash', 'bank_transfer', 'mobile_money', 'other'],
      default: 'cash',
    },
    reference: {
      type: String,
      trim: true, // bank transfer ref, receipt number etc.
    },
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'verified', // admin records it = auto-verified
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true, // admin who logged this payment
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [300, 'Notes cannot exceed 300 characters'],
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookups: "all payments for group X in cycle Y"
paymentSchema.index({ groupId: 1, cycle: 1 });
paymentSchema.index({ groupId: 1, memberId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
