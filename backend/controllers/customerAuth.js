import { OAuth2Client } from 'google-auth-library';
import CustomerUser from '../model/CustomerUser.js';
import OtpRecord from '../model/OtpRecord.js';
import Newsletter from '../model/Newsletter.js';
import { sendOtpEmail } from '../services/emailService.js';
import { sendOtpSms, normalizePhone } from '../services/smsService.js';
import { signCustomerToken, setCustomerCookie } from '../middleware/customerAuth.js';
import { normalizeInternationalPhone } from '../utils/phone.js';
import { normalizeAddressForResponse } from '../utils/addressValidation.js';

const RESEND_COOLDOWN_SECONDS = 60;
const MAX_OTP_ATTEMPTS = 5;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatCustomer = (c) => ({
  id: c._id,
  name: c.name,
  email: c.email,
  phone: c.phone,
  phoneCountryCode: c.phoneCountryCode,
  profileImage: c.profileImage,
  emailVerified: c.emailVerified,
  phoneVerified: c.phoneVerified,
  addresses: (c.addresses || []).map(normalizeAddressForResponse),
  marketingPreferences: c.marketingPreferences || { emailUpdates: true },
  favoritesCount: c.favorites?.length ?? 0,
});

// ─── EMAIL OTP ────────────────────────────────────────────────────────────────

/**
 * POST /api/customer/auth/email/send-otp
 */
export const sendEmailOtp = async (req, res) => {
  const { email } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check resend cooldown
    const existing = await OtpRecord.findOne({ identifier: normalizedEmail, type: 'email' });
    if (existing) {
      const secondsSinceLast = (Date.now() - existing.lastSentAt.getTime()) / 1000;
      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
          waitSeconds,
        });
      }
    }

    // Generate and hash OTP — plaintext only lives in this function scope
    const otpCode = OtpRecord.generateCode();
    const codeHash = OtpRecord.hashCode(otpCode);

    // Upsert OTP record (replace any existing for this identifier)
    await OtpRecord.findOneAndUpdate(
      { identifier: normalizedEmail, type: 'email' },
      {
        codeHash,
        attempts: 0,
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    // Send email (OTP passed to service, never returned in response)
    await sendOtpEmail(normalizedEmail, otpCode);

    return res.status(200).json({
      success: true,
      message: `A 6-digit code has been sent to ${normalizedEmail}.`,
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error('[customerAuth] sendEmailOtp error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to send OTP. Please try again.' });
  }
};

/**
 * POST /api/customer/auth/email/verify-otp
 */
export const verifyEmailOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const record = await OtpRecord.findOne({ identifier: normalizedEmail, type: 'email' });

    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP was sent to this email. Please request a new code.' });
    }

    if (record.expiresAt < new Date()) {
      await OtpRecord.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: 'This code has expired. Please request a new one.' });
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await OtpRecord.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new code.' });
    }

    const inputHash = OtpRecord.hashCode(otp);
    if (inputHash !== record.codeHash) {
      await OtpRecord.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } });
      const remaining = MAX_OTP_ATTEMPTS - (record.attempts + 1);
      return res.status(400).json({
        success: false,
        message: remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Too many incorrect attempts. Please request a new code.',
      });
    }

    // OTP is valid — delete it immediately
    await OtpRecord.deleteOne({ _id: record._id });

    // Find or create customer account
    let customer = await CustomerUser.findOne({ email: normalizedEmail });
    if (!customer) {
      customer = await CustomerUser.create({
        email: normalizedEmail,
        name: normalizedEmail.split('@')[0], // default name from email prefix
        emailVerified: true,
      });
    } else if (!customer.emailVerified) {
      customer.emailVerified = true;
      await customer.save();
    }

    customer.lastLogin = new Date();
    await customer.save();

    // Issue JWT and set cookie
    const token = signCustomerToken(customer._id);
    setCustomerCookie(res, token);

    return res.status(200).json({
      success: true,
      token,
      user: formatCustomer(customer),
    });
  } catch (error) {
    console.error('[customerAuth] verifyEmailOtp error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─── PHONE OTP ────────────────────────────────────────────────────────────────

/**
 * POST /api/customer/auth/phone/send-otp
 */
export const sendPhoneOtp = async (req, res) => {
  const { phone, countryCode } = req.body;

  if (!phone || !countryCode) {
    return res.status(400).json({ success: false, message: 'Phone number and country are required.' });
  }

  let normalizedPhone;
  try {
    normalizedPhone = normalizePhone(phone, countryCode);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }

  try {
    // Check resend cooldown
    const existing = await OtpRecord.findOne({ identifier: normalizedPhone, type: 'phone' });
    if (existing) {
      const secondsSinceLast = (Date.now() - existing.lastSentAt.getTime()) / 1000;
      if (secondsSinceLast < RESEND_COOLDOWN_SECONDS) {
        const waitSeconds = Math.ceil(RESEND_COOLDOWN_SECONDS - secondsSinceLast);
        return res.status(429).json({
          success: false,
          message: `Please wait ${waitSeconds} seconds before requesting a new code.`,
          waitSeconds,
        });
      }
    }

    const otpCode = OtpRecord.generateCode();
    const codeHash = OtpRecord.hashCode(otpCode);

    await OtpRecord.findOneAndUpdate(
      { identifier: normalizedPhone, type: 'phone' },
      {
        codeHash,
        attempts: 0,
        lastSentAt: new Date(),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
      { upsert: true, new: true }
    );

    await sendOtpSms(normalizedPhone, otpCode);

    return res.status(200).json({
      success: true,
      message: `A 6-digit code has been sent to ${normalizedPhone}.`,
      cooldownSeconds: RESEND_COOLDOWN_SECONDS,
    });
  } catch (error) {
    console.error('[customerAuth] sendPhoneOtp error:', error.message);
    return res.status(500).json({ success: false, message: error.message || 'Failed to send OTP.' });
  }
};

/**
 * POST /api/customer/auth/phone/verify-otp
 */
export const verifyPhoneOtp = async (req, res) => {
  const { phone, otp, countryCode } = req.body;

  if (!phone || !otp || !countryCode) {
    return res.status(400).json({ success: false, message: 'Phone number, country, and OTP are required.' });
  }

  let normalizedPhone;
  let parsedPhone;
  try {
    parsedPhone = normalizeInternationalPhone(phone, countryCode);
    normalizedPhone = parsedPhone.phone;
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }

  try {
    const record = await OtpRecord.findOne({ identifier: normalizedPhone, type: 'phone' });

    if (!record) {
      return res.status(400).json({ success: false, message: 'No OTP was sent to this number. Please request a new code.' });
    }

    if (record.expiresAt < new Date()) {
      await OtpRecord.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: 'This code has expired. Please request a new one.' });
    }

    if (record.attempts >= MAX_OTP_ATTEMPTS) {
      await OtpRecord.deleteOne({ _id: record._id });
      return res.status(400).json({ success: false, message: 'Too many incorrect attempts. Please request a new code.' });
    }

    const inputHash = OtpRecord.hashCode(otp);
    if (inputHash !== record.codeHash) {
      await OtpRecord.findByIdAndUpdate(record._id, { $inc: { attempts: 1 } });
      const remaining = MAX_OTP_ATTEMPTS - (record.attempts + 1);
      return res.status(400).json({
        success: false,
        message: remaining > 0
          ? `Incorrect code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
          : 'Too many incorrect attempts. Please request a new code.',
      });
    }

    await OtpRecord.deleteOne({ _id: record._id });

    // Find or create customer account by phone
    let customer = await CustomerUser.findOne({ phone: normalizedPhone });
    if (!customer) {
      customer = await CustomerUser.create({
        phone: normalizedPhone,
        phoneCountryCode: parsedPhone.phoneCountryCode,
        phoneVerified: true,
      });
    } else if (!customer.phoneVerified) {
      customer.phoneVerified = true;
      customer.phoneCountryCode = parsedPhone.phoneCountryCode;
      await customer.save();
    } else if (!customer.phoneCountryCode) {
      customer.phoneCountryCode = parsedPhone.phoneCountryCode;
      await customer.save();
    }

    customer.lastLogin = new Date();
    await customer.save();

    const token = signCustomerToken(customer._id);
    setCustomerCookie(res, token);

    return res.status(200).json({
      success: true,
      token,
      user: formatCustomer(customer),
    });
  } catch (error) {
    console.error('[customerAuth] verifyPhoneOtp error:', error.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};

// ─── GOOGLE LOGIN ─────────────────────────────────────────────────────────────

/**
 * POST /api/customer/auth/google
 * Body: { credential } — the ID token from Google Identity Services
 */
export const googleLogin = async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ success: false, message: 'Google credential is required.' });
  }

  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({ success: false, message: 'Google login is not configured on this server.' });
  }

  try {
    // Verify ID token server-side — never trust frontend-provided identity
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { sub: googleId, email, name, picture, email_verified } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google account must have an email address.' });
    }

    // Account linking: look for existing customer by googleId first, then by verified email
    let customer = await CustomerUser.findOne({ googleId });

    if (!customer && email_verified) {
      // Safe to link: email is Google-verified, find existing account
      customer = await CustomerUser.findOne({ email: email.toLowerCase() });
      if (customer) {
        // Link Google identity to existing account
        customer.googleId = googleId;
        if (!customer.emailVerified) customer.emailVerified = true;
        if (!customer.name && name) customer.name = name;
        if (!customer.profileImage && picture) customer.profileImage = picture;
        await customer.save();
      }
    }

    if (!customer) {
      // Create new customer account
      customer = await CustomerUser.create({
        googleId,
        email: email.toLowerCase(),
        name: name || '',
        profileImage: picture || null,
        emailVerified: !!email_verified,
      });
    }

    customer.lastLogin = new Date();
    await customer.save();

    const token = signCustomerToken(customer._id);
    setCustomerCookie(res, token);

    return res.status(200).json({
      success: true,
      token,
      user: formatCustomer(customer),
    });
  } catch (error) {
    console.error('[customerAuth] googleLogin error:', error.message);
    return res.status(401).json({ success: false, message: 'Google authentication failed. Please try again.' });
  }
};

// ─── SESSION ──────────────────────────────────────────────────────────────────

/**
 * GET /api/customer/auth/me
 */
export const getMe = (req, res) => {
  return res.status(200).json({ success: true, user: formatCustomer(req.customerUser) });
};

/**
 * POST /api/customer/auth/logout
 */
export const logout = (req, res) => {
  res.clearCookie('zae_customer_token');
  return res.status(200).json({ success: true, message: 'Logged out successfully.' });
};

// ─── PROFILE & DETAILS UPDATES ───────────────────────────────────────────────

/**
 * PUT /api/customer/auth/profile
 */
export const updateCustomerProfile = async (req, res) => {
  const { name, email, phone, phoneCountryCode, countryCode, profileImage } = req.body;
  try {
    const customer = await CustomerUser.findById(req.customerUser._id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    if (name !== undefined) customer.name = name;
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();
      if (normalizedEmail !== customer.email) {
        const existing = await CustomerUser.findOne({ email: normalizedEmail });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Email address is already in use.' });
        }
        customer.email = normalizedEmail;
      }
    }
    if (phone !== undefined) {
      if (!String(phone || '').trim()) {
        if (!customer.email && !customer.googleId) {
          return res.status(400).json({ success: false, message: 'Phone cannot be removed from this account.' });
        }
        customer.phone = null;
        customer.phoneCountryCode = null;
        customer.phoneVerified = false;
      } else {
      const parsedPhone = normalizeInternationalPhone(phone, countryCode || phoneCountryCode);
      if (parsedPhone.phone !== customer.phone) {
        const existing = await CustomerUser.findOne({ phone: parsedPhone.phone });
        if (existing && String(existing._id) !== String(customer._id)) {
          return res.status(400).json({ success: false, message: 'Phone number is already in use.' });
        }
        customer.phone = parsedPhone.phone;
        customer.phoneVerified = false;
      }
      customer.phoneCountryCode = parsedPhone.phoneCountryCode;
      }
    }
    if (profileImage !== undefined) customer.profileImage = profileImage;

    await customer.save();
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: formatCustomer(customer),
    });
  } catch (error) {
    console.error('[customerAuth] updateCustomerProfile error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

/**
 * PUT /api/customer/auth/marketing
 */
export const updateCustomerMarketing = async (req, res) => {
  const { emailUpdates } = req.body;
  try {
    const customer = await CustomerUser.findById(req.customerUser._id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found.' });
    }

    if (emailUpdates !== undefined) {
      const isSubscribed = !!emailUpdates;
      customer.marketingPreferences.emailUpdates = isSubscribed;

      if (customer.email) {
        if (isSubscribed) {
          await Newsletter.findOneAndUpdate(
            { email: customer.email.toLowerCase().trim() },
            {
              email: customer.email.toLowerCase().trim(),
              name: customer.name || '',
              status: 'active',
              subscribedAt: new Date(),
            },
            { upsert: true, new: true }
          );
        } else {
          await Newsletter.findOneAndUpdate(
            { email: customer.email.toLowerCase().trim() },
            { status: 'unsubscribed' }
          );
        }
      }
    }

    await customer.save();
    return res.status(200).json({
      success: true,
      message: 'Marketing preferences updated.',
      user: formatCustomer(customer),
    });
  } catch (error) {
    console.error('[customerAuth] updateCustomerMarketing error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to update marketing preferences.' });
  }
};

// ─── ADDRESS MANAGEMENT ──────────────────────────────────────────────────────
