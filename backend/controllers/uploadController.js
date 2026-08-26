const cloudinary = require("cloudinary").v2;

// Helper to configure Cloudinary dynamically
const configureCloudinary = () => {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config();
    return true;
  }
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
  const apiKey    = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret && cloudName !== "your_cloud_name") {
    cloudinary.config({
      cloud_name: cloudName,
      api_key:    apiKey,
      api_secret: apiSecret,
    });
    return true;
  }
  return false;
};

// @desc Upload image to Cloudinary
// @route POST /api/upload/cloudinary
const uploadImageToCloudinary = async (req, res) => {
  try {
    const { image, folder = "crops" } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: "No image payload provided" });
    }

    const hasCloudinary = configureCloudinary();

    if (hasCloudinary) {
      const result = await cloudinary.uploader.upload(image, {
        folder: folder,
        resource_type: "auto",
      });

      return res.json({
        success: true,
        imageUrl: result.secure_url,
        public_id: result.public_id,
        source: "cloudinary",
      });
    }

    // Fallback: If Cloudinary keys are not set in env yet,
    // return the data URL / image URL directly so uploads never fail!
    return res.json({
      success: true,
      imageUrl: image,
      public_id: "crop_img_" + Date.now(),
      source: "local",
      message: "Image attached! (Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in backend/.env for Cloudinary CDN hosting)",
    });
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);

    // Even if Cloudinary API throws an error (e.g. invalid credentials), fallback to image URL
    if (req.body.image) {
      return res.json({
        success: true,
        imageUrl: req.body.image,
        public_id: "crop_img_fallback_" + Date.now(),
        message: "Cloudinary error: " + error.message + ". Fallback preview attached.",
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || "Failed to process image upload",
    });
  }
};

module.exports = { uploadImageToCloudinary };
