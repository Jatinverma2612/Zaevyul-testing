import { normalizeInternationalPhone } from '../utils/phone.js';

/**
 * SMS Service - clean abstraction layer for sending OTP SMS messages.
 *
 * Environment variables:
 *   SMS_PROVIDER - 'fast2sms' | 'twilio' | 'console' (dev)
 *   FAST2SMS_API_KEY - Fast2SMS API key
 *   TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER - for Twilio
 */

/**
 * Normalize a phone number to E.164.
 * Accepts either an E.164 number or a national number plus ISO country code.
 */
export const normalizePhone = (raw, countryCode) =>
  normalizeInternationalPhone(raw, countryCode).phone;

/**
 * Send an OTP via SMS.
 * @param {string} phone - normalized E.164 number
 * @param {string} otp - the 6-digit OTP (never logged)
 */
export const sendOtpSms = async (phone, otp) => {
  const provider = process.env.SMS_PROVIDER || 'console';

  if (provider === 'fast2sms') {
    await sendViaFast2SMS(phone, otp);
  } else if (provider === 'twilio') {
    await sendViaTwilio(phone, otp);
  } else {
    consoleDev(phone, otp);
  }
};

async function sendViaFast2SMS(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) throw new Error('FAST2SMS_API_KEY is not set in environment variables.');
  if (!phone.startsWith('+91')) {
    throw new Error('Fast2SMS only supports Indian phone numbers. Use SMS_PROVIDER=twilio for international OTP delivery.');
  }

  const message = `Your Zaevyul login code is ${otp}. Valid for 10 minutes. Do not share.`;
  const nationalNumber = phone.replace(/^\+91/, '');

  const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
    method: 'POST',
    headers: {
      authorization: apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      route: 'q',
      message,
      language: 'english',
      flash: 0,
      numbers: nationalNumber,
    }),
  });

  const data = await res.json();
  if (!data.return) {
    throw new Error(data.message?.[0] || 'Failed to send SMS via Fast2SMS');
  }
}

async function sendViaTwilio(phone, otp) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    throw new Error('Twilio credentials are not set in environment variables.');
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const body = new URLSearchParams({
    To: phone,
    From: TWILIO_FROM_NUMBER,
    Body: `Your Zaevyul login code is ${otp}. Valid for 10 minutes.`,
  });

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  const data = await res.json();
  if (data.error_code) {
    throw new Error(data.message || 'Failed to send SMS via Twilio');
  }
}

function consoleDev(phone, otp) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SmsService] Dev OTP for ${phone}: ${otp}`);
  } else {
    console.log(`[SmsService] SMS_PROVIDER=console - OTP sent to ${phone}: [REDACTED for security]`);
  }
}
