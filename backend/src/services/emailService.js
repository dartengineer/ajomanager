const nodemailer = require('nodemailer');
const Notification = require('../models/Notification');

// Create transporter — swap this for Resend if preferred
const createTransporter = () => {
  if (process.env.RESEND_API_KEY) {
    // Using Resend SMTP relay
    return nodemailer.createTransport({
      host: 'smtp.resend.com',
      port: 465,
      secure: true,
      auth: {
        user: 'resend',
        pass: process.env.RESEND_API_KEY,
      },
    });
  }

  // Fallback: Gmail or any SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const FROM = process.env.EMAIL_FROM || 'Ajo Manager <noreply@ajomanager.com>';

/**
 * Core send function — logs to DB regardless of success/failure
 */
const sendEmail = async ({ to, subject, html, notificationId }) => {
  const transporter = createTransporter();
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });

    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, {
        status: 'sent',
        sentAt: new Date(),
      });
    }
    return true;
  } catch (error) {
    console.error(`❌ Email failed to ${to}:`, error.message);
    if (notificationId) {
      await Notification.findByIdAndUpdate(notificationId, {
        status: 'failed',
        error: error.message,
      });
    }
    return false;
  }
};

// ─── Email Templates ───────────────────────────────────────────────────────

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; }
    .header { background: #0D0D0D; padding: 28px 32px; }
    .header h1 { color: #E8A838; font-size: 22px; margin: 0; }
    .header p { color: #7A7670; font-size: 13px; margin: 4px 0 0; }
    .body { padding: 32px; }
    .body p { color: #333; line-height: 1.6; font-size: 15px; }
    .highlight { background: #FFF9EC; border-left: 4px solid #E8A838; padding: 16px 20px; border-radius: 4px; margin: 20px 0; }
    .highlight strong { color: #c47f10; font-size: 22px; display: block; }
    .highlight span { color: #666; font-size: 13px; }
    .btn { display: inline-block; background: #E8A838; color: #0D0D0D; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; margin: 16px 0; }
    .footer { padding: 20px 32px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ajo Manager</h1>
      <p>Savings Circle Platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>This is an automated message from Ajo Manager. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send payment reminder to a member
 */
const sendPaymentReminder = async ({ to, name, groupName, amount, currency, cycle, dueDate, notificationId }) => {
  const subject = `⏰ Reminder: Your Ajo contribution is due — ${groupName}`;
  const html = baseTemplate(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>This is a reminder that your contribution for <strong>${groupName}</strong> is due.</p>
    <div class="highlight">
      <span>Amount Due</span>
      <strong>${currency} ${Number(amount).toLocaleString()}</strong>
      <span>Cycle ${cycle}${dueDate ? ` · Due by ${new Date(dueDate).toDateString()}` : ''}</span>
    </div>
    <p>Please make your payment as soon as possible. Contact your Ajo organiser if you have any questions.</p>
  `);
  return sendEmail({ to, subject, html, notificationId });
};

/**
 * Notify a member that their turn to collect is coming up
 */
const sendTurnUpcomingNotice = async ({ to, name, groupName, amount, currency, cycle, collectDate, notificationId }) => {
  const subject = `🎉 Your turn to collect is coming up — ${groupName}`;
  const html = baseTemplate(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>Great news! Your turn to collect the Ajo pot is coming up in <strong>${groupName}</strong>.</p>
    <div class="highlight">
      <span>You will collect</span>
      <strong>${currency} ${Number(amount).toLocaleString()}</strong>
      <span>Cycle ${cycle}${collectDate ? ` · On or around ${new Date(collectDate).toDateString()}` : ''}</span>
    </div>
    <p>Make sure you've made all your contributions. Your organiser will confirm collection once all members have paid.</p>
  `);
  return sendEmail({ to, subject, html, notificationId });
};

/**
 * Confirm to a member that their payment was recorded
 */
const sendPaymentConfirmation = async ({ to, name, groupName, amount, currency, cycle, method, notificationId }) => {
  const subject = `✅ Payment recorded — ${groupName}`;
  const html = baseTemplate(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your contribution for <strong>${groupName}</strong> has been recorded successfully.</p>
    <div class="highlight">
      <span>Amount Recorded</span>
      <strong>${currency} ${Number(amount).toLocaleString()}</strong>
      <span>Cycle ${cycle} · via ${method}</span>
    </div>
    <p>Thank you for keeping up with your contributions!</p>
  `);
  return sendEmail({ to, subject, html, notificationId });
};

/**
 * Notify admin when a new cycle begins
 */
const sendCycleAdvancedNotice = async ({ to, adminName, groupName, newCycle, collectorName, currency, amount, notificationId }) => {
  const subject = `🔄 Cycle ${newCycle} has started — ${groupName}`;
  const html = baseTemplate(`
    <p>Hi <strong>${adminName}</strong>,</p>
    <p>Cycle <strong>${newCycle}</strong> has begun for <strong>${groupName}</strong>.</p>
    <div class="highlight">
      <span>This cycle's collector</span>
      <strong>${collectorName}</strong>
      <span>Pot: ${currency} ${Number(amount).toLocaleString()}</span>
    </div>
    <p>Payment reminders have been sent to all members. Log in to track contributions.</p>
  `);
  return sendEmail({ to, subject, html, notificationId });
};

module.exports = {
  sendPaymentReminder,
  sendTurnUpcomingNotice,
  sendPaymentConfirmation,
  sendCycleAdvancedNotice,
};
