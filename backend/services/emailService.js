import nodemailer from 'nodemailer';
import fs from 'fs';

/**
 * Email service — wraps Nodemailer.
 * Configure via environment variables:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
 *
 * For Gmail: use an App Password (not your account password).
 * For production: swap to Resend, SendGrid, Postmark by changing env vars.
 */

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for port 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

/**
 * Send an OTP email to the given address.
 * @param {string} to — recipient email
 * @param {string} otp — the 6-digit OTP (only passed for sending, never logged)
 */
export const sendOtpEmail = async (to, otp) => {
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@zaevyul.com';

  const mailOptions = {
    from: `"Zaevyul" <${from}>`,
    to,
    subject: 'Your Zaevyul Login Code',
    text: `Your Zaevyul login code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; background: #FAF8F5; border: 1px solid #E6DED4; border-radius: 8px;">
        <h1 style="font-size: 24px; font-weight: 400; color: #1C1916; letter-spacing: 0.08em; margin-bottom: 8px;">ZAEVYUL</h1>
        <p style="font-family: sans-serif; font-size: 13px; color: #6B6560; margin-bottom: 32px;">Your login verification code</p>
        <div style="background: #fff; border: 1px solid #E6DED4; border-radius: 4px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 0.2em; color: #1C1916;">${otp}</span>
        </div>
        <p style="font-family: sans-serif; font-size: 12px; color: #8A857E; line-height: 1.6;">
          This code expires in <strong>10 minutes</strong>.<br>
          If you did not request this, you can safely ignore this email.
        </p>
      </div>
    `,
  };

  // If SMTP is not configured, log to console for development
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[EmailService] Dev OTP for ${to}: ${otp}`);
    } else {
      console.log(`[EmailService] SMTP not configured — OTP for ${to}: [REDACTED for security]`);
    }
    return;
  }

  await getTransporter().sendMail(mailOptions);
};

/**
 * Send Order Confirmation email to customer (AUD-023).
 */
export const sendOrderConfirmationEmail = async (order, to) => {
  if (!to || !to.includes('@')) return;

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@zaevyul.com';
  // Check for generated invoice PDF attachment
  const attachments = [];
  try {
    if (order.invoice?.invoiceNumber) {
      const year = new Date(order.createdAt || Date.now()).getFullYear();
      const pdfPath = `storage/invoices/${year}/${order.invoice.invoiceNumber}.pdf`;
      if (fs.existsSync(pdfPath)) {
        attachments.push({
          filename: `${order.invoice.invoiceNumber}.pdf`,
          path: pdfPath,
          contentType: 'application/pdf',
        });
      }
    }
  } catch {
    /* ignore attachment error */
  }

  const mailOptions = {
    from: `"Zaevyul" <${from}>`,
    to,
    subject: `Order Confirmed - #${order.orderNumber}`,
    attachments,
    html: `
      <div style="font-family: Georgia, serif; max-width: 540px; margin: 0 auto; padding: 40px 24px; background: #FAF8F5; border: 1px solid #E6DED4;">
        <h1 style="font-size: 26px; font-weight: 400; color: #1C1916; margin-bottom: 8px;">ZAEVYUL</h1>
        <p style="font-family: sans-serif; font-size: 14px; color: #6B6560; margin-bottom: 24px;">Thank you for your order, ${order.customerName}!</p>
        <div style="background: #fff; border: 1px solid #E6DED4; padding: 20px; margin-bottom: 20px;">
          <h2 style="font-size: 16px; margin-top: 0;">Order #${order.orderNumber}</h2>
          <p style="font-family: sans-serif; font-size: 13px; color: #1C1916;">Status: <strong>${order.status.toUpperCase()}</strong></p>
          <p style="font-family: sans-serif; font-size: 13px; color: #1C1916;">Total: <strong>₹${order.total.toLocaleString('en-IN')}</strong></p>
          ${order.invoice?.invoiceNumber ? `<p style="font-family: sans-serif; font-size: 12px; color: #B58A5B; margin-top: 12px;">Invoice No: <strong>${order.invoice.invoiceNumber}</strong> (Attached)</p>` : ''}
        </div>
        <p style="font-family: sans-serif; font-size: 12px; color: #8A857E;">We are preparing your items with artisanal care in Kashmir.</p>
      </div>
    `,
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EmailService] [Dev Order Confirmation] Order #${order.orderNumber} placed for ${to}`);
    return;
  }

  try {
    await getTransporter().sendMail(mailOptions);
  } catch (err) {
    console.error('[EmailService] sendOrderConfirmationEmail error:', err.message);
  }
};

/**
 * Send Order Status Update email to customer (AUD-023).
 */
export const sendOrderStatusEmail = async (order, to) => {
  if (!to || !to.includes('@')) return;

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@zaevyul.com';
  const mailOptions = {
    from: `"Zaevyul" <${from}>`,
    to,
    subject: `Order Update - #${order.orderNumber}`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 540px; margin: 0 auto; padding: 40px 24px; background: #FAF8F5; border: 1px solid #E6DED4;">
        <h1 style="font-size: 26px; font-weight: 400; color: #1C1916; margin-bottom: 8px;">ZAEVYUL</h1>
        <p style="font-family: sans-serif; font-size: 14px; color: #6B6560;">Your order #${order.orderNumber} status has been updated to: <strong>${order.status.toUpperCase()}</strong></p>
        ${order.trackingNumber ? `<p style="font-family: sans-serif; font-size: 13px; color: #1C1916; margin-top: 16px;">Tracking Number: <strong>${order.trackingNumber}</strong></p>` : ''}
      </div>
    `,
  };

  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`[EmailService] [Dev Status Update] Order #${order.orderNumber} status updated to ${order.status}`);
    return;
  }

  try {
    await getTransporter().sendMail(mailOptions);
  } catch (err) {
    console.error('[EmailService] sendOrderStatusEmail error:', err.message);
  }
};
