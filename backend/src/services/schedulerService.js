const cron = require('node-cron');
const Group = require('../models/Group');
const Notification = require('../models/Notification');
const { sendPaymentReminder, sendTurnUpcomingNotice } = require('./emailService');

/**
 * schedulerService.js
 * Runs background cron jobs to send automated reminders.
 *
 * Jobs:
 * 1. Daily at 9am — remind unpaid members in active groups
 * 2. Monthly on the 25th — "your turn is next month" notice
 */

const startScheduler = () => {
  console.log('⏰ Scheduler started');

  // ── Job 1: Daily payment reminders (9:00 AM) ──────────────────────────────
  // Sends reminders to members who haven't paid in the current cycle
  cron.schedule('0 9 * * *', async () => {
    console.log('🔔 Running daily payment reminder job...');

    try {
      const activeGroups = await Group.find({ status: 'active' });

      for (const group of activeGroups) {
        const unpaidMembers = group.members.filter(
          (m) => !m.hasPaid && m.email
        );

        for (const member of unpaidMembers) {
          // Avoid spamming — check if we already sent a reminder today
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const alreadySent = await Notification.findOne({
            groupId: group._id,
            recipientEmail: member.email,
            type: 'payment_reminder',
            createdAt: { $gte: today },
          });

          if (alreadySent) continue;

          // Create notification record
          const notification = await Notification.create({
            groupId: group._id,
            recipientEmail: member.email,
            recipientName: member.name,
            type: 'payment_reminder',
            subject: `Ajo payment reminder — ${group.name}`,
            status: 'pending',
          });

          // Send email
          await sendPaymentReminder({
            to: member.email,
            name: member.name,
            groupName: group.name,
            amount: group.contributionAmount,
            currency: group.currency,
            cycle: group.currentCycle,
            notificationId: notification._id,
          });
        }
      }

      console.log('✅ Payment reminders sent');
    } catch (error) {
      console.error('❌ Payment reminder job failed:', error.message);
    }
  });

  // ── Job 2: "Your turn is next month" notice (25th of each month, 10am) ───
  // Runs monthly. Finds who collects next cycle and notifies them.
  cron.schedule('0 10 25 * *', async () => {
    console.log('🔔 Running upcoming turn notification job...');

    try {
      const activeGroups = await Group.find({
        status: 'active',
        frequency: 'monthly',
      });

      for (const group of activeGroups) {
        const nextCycle = group.currentCycle + 1;
        if (nextCycle > group.totalMembers) continue;

        const nextCollector = group.members.find(
          (m) => m.turnOrder === nextCycle
        );

        if (!nextCollector || !nextCollector.email) continue;

        const notification = await Notification.create({
          groupId: group._id,
          recipientEmail: nextCollector.email,
          recipientName: nextCollector.name,
          type: 'turn_upcoming',
          subject: `Your Ajo collection is next month — ${group.name}`,
          status: 'pending',
        });

        await sendTurnUpcomingNotice({
          to: nextCollector.email,
          name: nextCollector.name,
          groupName: group.name,
          amount: group.potTotal,
          currency: group.currency,
          cycle: nextCycle,
          notificationId: notification._id,
        });
      }

      console.log('✅ Upcoming turn notices sent');
    } catch (error) {
      console.error('❌ Upcoming turn job failed:', error.message);
    }
  });
};

module.exports = { startScheduler };
