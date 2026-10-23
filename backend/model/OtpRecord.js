import mongoose from 'mongoose';
import crypto from 'crypto';

const OtpRecordSchema = new mongoose.Schema({
  // The identifier (email address or normalized phone number)
  identifier: { type: String, required: true, index: true },
  // 'email' or 'phone'
  type: { type: String, enum: ['email', 'phone'], required: true },
  // SHA-256 hash of the OTP — never store plaintext
  codeHash: { type: String, required: true },
  // Number of failed verification attempts
  attempts: { type: Number, default: 0 },
  // Timestamp of the last OTP send (for resend cooldown)
  lastSentAt: { type: Date, default: Date.now },
  // Expiry timestamp — TTL index auto-deletes the document after this
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  },
});

// MongoDB TTL index: automatically removes expired OTP documents
OtpRecordSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Static: hash an OTP code before storing / comparing
OtpRecordSchema.statics.hashCode = (code) =>
  crypto.createHash('sha256').update(String(code)).digest('hex');

// Static: generate a cryptographically secure 6-digit OTP
OtpRecordSchema.statics.generateCode = () => {
  const buf = crypto.randomBytes(4);
  // Produce a number in [0, 999999] and left-pad to 6 digits
  return String(buf.readUInt32BE(0) % 1000000).padStart(6, '0');
};

export default mongoose.model('OtpRecord', OtpRecordSchema);
