import Settings from '../model/Settings.js';
import { uploadToCloudinary } from '../services/cloudinaryService.js';

export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
      await settings.save();
    }
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Fetch settings error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const updateSettings = async (req, res) => {
  const { paymentGateways, logo, favicon, ...otherSettings } = req.body;
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }
    
    // Whitelist and assign standard settings
    Object.assign(settings, otherSettings);

    if (logo !== undefined) settings.logo = logo;
    if (favicon !== undefined) settings.favicon = favicon;

    // Restrict paymentGateways settings update to super_admin role
    if (paymentGateways !== undefined) {
      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Only super_admin can modify payment gateway settings.' });
      }
      settings.paymentGateways = {
        ...settings.paymentGateways,
        ...paymentGateways
      };
    }

    await settings.save();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    console.error('Update settings error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const getBranding = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
      await settings.save();
    }
    return res.status(200).json({
      success: true,
      logo: settings.logo || "",
      favicon: settings.favicon || "",
      storeName: settings.storeName || "Zaevyul",
      tagline: settings.tagline || "Timeless · Authentic · Handcrafted",
    });
  } catch (error) {
    console.error('Get branding error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const uploadLogo = async (req, res) => {
  try {
    const { image, file } = req.body;
    const imageSource = image || file;

    if (!imageSource) {
      return res.status(400).json({ success: false, message: 'No logo image file or data provided.' });
    }

    // Type/format check for data URI
    if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
      const mime = imageSource.substring(imageSource.indexOf(':') + 1, imageSource.indexOf(';'));
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
      if (!validTypes.includes(mime)) {
        return res.status(400).json({ success: false, message: 'Invalid file format. Supported formats: PNG, JPG, JPEG, SVG, WebP.' });
      }
    }

    const uploadRes = await uploadToCloudinary(imageSource, { folder: 'zaevyul/branding' });
    if (!uploadRes.url) {
      return res.status(500).json({ success: false, message: 'Logo upload failed.' });
    }

    let settings = await Settings.findOne();
    if (!settings) settings = new Settings({});

    settings.logo = uploadRes.url;
    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Logo updated successfully.',
      logo: settings.logo,
      settings,
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Logo upload failed.' });
  }
};

export const uploadFavicon = async (req, res) => {
  try {
    const { image, file } = req.body;
    const imageSource = image || file;

    if (!imageSource) {
      return res.status(400).json({ success: false, message: 'No favicon image file or data provided.' });
    }

    // Type/format check for data URI
    if (typeof imageSource === 'string' && imageSource.startsWith('data:')) {
      const mime = imageSource.substring(imageSource.indexOf(':') + 1, imageSource.indexOf(';'));
      const validTypes = ['image/png', 'image/x-icon', 'image/vnd.microsoft.icon', 'image/jpeg', 'image/jpg', 'image/svg+xml', 'image/webp'];
      if (!validTypes.includes(mime)) {
        return res.status(400).json({ success: false, message: 'Invalid file format. Supported formats: PNG, ICO, SVG, WebP, JPG.' });
      }
    }

    const uploadRes = await uploadToCloudinary(imageSource, { folder: 'zaevyul/branding' });
    if (!uploadRes.url) {
      return res.status(500).json({ success: false, message: 'Favicon upload failed.' });
    }

    let settings = await Settings.findOne();
    if (!settings) settings = new Settings({});

    settings.favicon = uploadRes.url;
    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Favicon updated successfully.',
      favicon: settings.favicon,
      settings,
    });
  } catch (error) {
    console.error('Upload favicon error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Favicon upload failed.' });
  }
};

export const deleteLogo = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings({});

    settings.logo = "";
    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Logo reset to default successfully.',
      logo: "",
      settings,
    });
  } catch (error) {
    console.error('Delete logo error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const deleteFavicon = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) settings = new Settings({});

    settings.favicon = "";
    await settings.save();

    return res.status(200).json({
      success: true,
      message: 'Favicon reset to default successfully.',
      favicon: "",
      settings,
    });
  } catch (error) {
    console.error('Delete favicon error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

