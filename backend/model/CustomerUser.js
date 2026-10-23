import mongoose from 'mongoose';

const CustomerUserSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, default: null, sparse: true },
    phone: { type: String, default: null, sparse: true },
    phoneCountryCode: { type: String, default: null },
    profileImage: { type: String, default: null },

    // Google OAuth
    googleId: { type: String, default: null, sparse: true },

    // Verification flags
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },

    // Favorites — array of Product ObjectIds or string IDs
    favorites: [{ type: mongoose.Schema.Types.Mixed }],

    // Addresses
    addresses: [
      {
        label: { type: String, default: 'Home' },
        recipientName: { type: String, default: '' },
        name: { type: String, default: '' },
        country: { type: String, default: 'India' },
        countryCode: { type: String, default: 'IN' },
        phone: { type: String, default: '' },
        phoneCountryCode: { type: String, default: '' },
        addressLine1: { type: String, default: '' },
        addressLine2: { type: String, default: '' },
        addressLine: { type: String, default: '' },
        city: { type: String, default: '' },
        state: { type: String, default: '' },
        stateCode: { type: String, default: '' },
        postalCode: { type: String, default: '' },
        landmark: { type: String, default: '' },
        isDefault: { type: Boolean, default: false },
      }
    ],

    // Marketing Preferences
    marketingPreferences: {
      emailUpdates: { type: Boolean, default: true },
    },

    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

// Ensure at least one identifier exists
CustomerUserSchema.pre('save', function () {
  if (!this.email && !this.phone && !this.googleId) {
    throw new Error('CustomerUser must have at least one identifier (email, phone, or googleId)');
  }
});

export default mongoose.model('CustomerUser', CustomerUserSchema);
