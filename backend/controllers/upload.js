import { uploadToCloudinary } from "../services/cloudinaryService.js";

/**
 * POST /api/admin/upload
 * Uploads single or multiple image(s) to Cloudinary and returns secure HTTPS URLs.
 */
export const uploadImage = async (req, res) => {
  const { image, images, file, folder = "zaevyul/general" } = req.body;
  const imageSource = image || file;

  try {
    // Single image upload
    if (imageSource) {
      const result = await uploadToCloudinary(imageSource, { folder });
      return res.status(200).json({
        success: true,
        url: result.url,
        public_id: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
      });
    }

    // Batch images upload
    if (images && Array.isArray(images) && images.length > 0) {
      const uploadPromises = images.map((img) =>
        uploadToCloudinary(img, { folder }),
      );
      const results = await Promise.all(uploadPromises);

      const urls = results.map((r) => r.url);
      return res.status(200).json({
        success: true,
        urls,
        data: results,
      });
    }

    return res.status(400).json({
      success: false,
      message: "No image file or base64 data provided in request body.",
    });
  } catch (error) {
    console.error("[uploadController] uploadImage error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Cloudinary image upload failed.",
    });
  }
};
