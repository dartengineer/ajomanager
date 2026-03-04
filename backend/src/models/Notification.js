const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
    },
    recipientName: String,
    type: {
      type: String,
      enum: [
        'payment_reminder',    // "Hey, please pay your contribution"
        'turn_upcoming',       // "Your turn to collect is next month"
        'payment_received',    // "Your payment was recorded"
        'turn_collected',      // "Congrats, you've collected the pot"
        'group_started',       // "Your Ajo group has started"
        'cycle_advanced',      // "Cycle X has begun"
      ],
      required: true,
    },
    subject: String,
    message: String,
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },
    sentAt: Date,
    error: String, // if failed, store the error message
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Notification', notificationSchema);
