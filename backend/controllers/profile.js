import Admin from '../model/Admin.js';

/** Minimum password complexity: 8+ chars, at least one uppercase, one lowercase, one digit (AUD-027) */
const passwordComplexityRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export const getProfile = (req, res) => {
  return res.status(200).json({ success: true, user: req.user });
};

export const updateProfile = async (req, res) => {
  const { name, email, avatar } = req.body;
  try {
    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) {
      admin.name = name;
      // Recalculate initials
      const parts = name.trim().split(/\s+/);
      admin.initials = parts.map(p => p[0]).join('').toUpperCase().slice(0, 3);
    }
    if (email) admin.email = email;
    if (avatar !== undefined) admin.avatar = avatar;

    await admin.save();
    return res.status(200).json({
      success: true,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        initials: admin.initials,
        lastLogin: admin.lastLogin
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new password' });
    }

    // AUD-027: Enforce password complexity before attempting DB update
    if (!passwordComplexityRe.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters and contain uppercase, lowercase, and a number',
      });
    }

    const admin = await Admin.findById(req.user._id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid current password' });
    }

    admin.password = newPassword;
    await admin.save();

    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
