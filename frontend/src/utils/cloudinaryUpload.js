import api from "../api/axiosInstance";

/**
 * Compresses an image file or blob using Canvas before uploading
 */
export const compressImage = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.82) => {
  return new Promise((resolve, reject) => {
    if (typeof file === "string") {
      return resolve(file);
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => resolve(e.target.result); // Fallback to raw data URL
    };
    reader.onerror = (err) => reject(err);
  });
};

/**
 * Uploads an image file or base64 data string to Cloudinary.
 * Compress image first, attempts client direct unsigned upload if preset exists,
 * and falls back to backend /api/upload/cloudinary.
 *
 * @param {File | Blob | string} fileOrData - Image File object, Blob, or base64 data URL
 * @returns {Promise<string>} Cloudinary or processed image URL
 */
export const uploadToCloudinary = async (fileOrData) => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "demo";
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "farm_fusion";

  // Step 1: Compress image if it's a file
  let base64String = null;
  if (typeof fileOrData === "string") {
    base64String = fileOrData;
  } else if (fileOrData instanceof File || fileOrData instanceof Blob) {
    base64String = await compressImage(fileOrData);
  }

  // Step 2: Attempt Direct Cloudinary REST API Unsigned Upload
  if (
    import.meta.env.VITE_CLOUDINARY_CLOUD_NAME &&
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  ) {
    try {
      const formData = new FormData();
      formData.append("file", base64String);
      formData.append("upload_preset", uploadPreset);
      formData.append("folder", "crops");

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.secure_url) {
          return data.secure_url;
        }
      }
    } catch (err) {
      console.warn("Direct Cloudinary upload notice, using backend route fallback:", err);
    }
  }

  // Step 3: Backend Upload Route Fallback (/api/upload/cloudinary)
  try {
    const { data } = await api.post("/upload/cloudinary", {
      image: base64String,
      folder: "crops",
    });

    if (data && data.imageUrl) {
      return data.imageUrl;
    }
  } catch (err) {
    console.error("Backend upload endpoint notice:", err);
  }

  // Final fallback: return optimized data URL
  if (base64String) {
    return base64String;
  }

  throw new Error("Unable to process image upload. Please try another image.");
};
