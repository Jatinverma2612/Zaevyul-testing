import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary SDK
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dzy8p7l4x";
const apiKey = process.env.CLOUDINARY_API_KEY || "871249581948275";
const apiSecret = process.env.CLOUDINARY_API_SECRET || "zaevyul_cloudinary_secret_key_8472";

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

/**
 * Uploads an image (file path, base64 data URI, or buffer) to Cloudinary.
 * @param {String|Buffer} fileData - Base64 Data URI, file path, or image URL
 * @param {Object} options - Upload options (folder, public_id, etc.)
 */
export const uploadToCloudinary = async (fileData, options = {}) => {
  const folder = options.folder || "zaevyul/uploads";

  try {
    const uploadOptions = {
      folder,
      resource_type: "auto",
      overwrite: true,
      invalidate: true,
      ...options,
    };

    const result = await cloudinary.uploader.upload(fileData, uploadOptions);

    return {
      success: true,
      url: result.secure_url || result.url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  } catch (error) {
    console.error("[CloudinaryService] Upload error:", error);
    
    // Fallback URL generation if Cloudinary keys are invalid/unreachable in dev
    if (typeof fileData === "string" && fileData.startsWith("http")) {
      return { success: true, url: fileData, public_id: `fallback-${Date.now()}` };
    }
    
    throw new Error(error.message || "Failed to upload image to Cloudinary.");
  }
};

/**
 * Deletes an image from Cloudinary by public_id.
 * @param {String} publicId
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return { success: result.result === "ok", result };
  } catch (error) {
    console.error("[CloudinaryService] Delete error:", error);
    return { success: false, error: error.message };
  }
};

export default {
  uploadToCloudinary,
  deleteFromCloudinary,
  cloudinary,
};
