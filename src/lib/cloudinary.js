import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload PDF to Cloudinary
 * @param {Buffer} fileBuffer - PDF file buffer
 * @param {string} originalFilename - Original filename
 * @returns {Promise<{url: string, publicId: string, bytes: number}>}
 */
export async function uploadPDFToCloudinary(fileBuffer, originalFilename) {
  try {
    // Get folder name from env (default to 'quiz-app')
    const folderName = process.env.CLOUDINARY_FOLDER_NAME || "quiz-app";

    // Convert buffer to base64 for Cloudinary upload
    const base64File = `data:application/pdf;base64,${fileBuffer.toString(
      "base64"
    )}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64File, {
      resource_type: "raw", // For non-image files like PDFs
      folder: folderName, // Store in specified folder
      public_id: `${Date.now()}-${originalFilename
        .replace(/[^a-zA-Z0-9.-]/g, "_")
        .replace(".pdf", "")}`,
      access_mode: "public", // Make publicly accessible
      type: "upload",
    });

    console.log("✅ PDF uploaded to Cloudinary:", result.secure_url);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      bytes: result.bytes,
      format: result.format,
    };
  } catch (error) {
    console.error("❌ Cloudinary upload error:", error);
    throw new Error(`Failed to upload PDF to Cloudinary: ${error.message}`);
  }
}

/**
 * Download PDF from Cloudinary URL
 * @param {string} cloudinaryUrl - Cloudinary URL
 * @returns {Promise<Buffer>}
 */
export async function downloadPDFFromCloudinary(cloudinaryUrl, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(
        `📥 Downloading PDF from Cloudinary (attempt ${i + 1}/${retries})...`
      );

      // Set timeout for large files
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds

      const response = await fetch(cloudinaryUrl, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Verify content type
      const contentType = response.headers.get("content-type");
      if (
        contentType &&
        !contentType.includes("pdf") &&
        !contentType.includes("octet-stream")
      ) {
        console.warn("⚠️ Unexpected content type:", contentType);
      }

      // Download buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Validate buffer
      if (buffer.length === 0) {
        throw new Error("Downloaded file is empty");
      }

      // Validate PDF magic bytes
      const magicBytes = buffer.slice(0, 5).toString();
      if (magicBytes !== "%PDF-") {
        throw new Error("Downloaded file is not a valid PDF");
      }

      console.log(
        `✅ PDF downloaded successfully: ${(
          buffer.length /
          1024 /
          1024
        ).toFixed(2)} MB`
      );
      return buffer;
    } catch (error) {
      console.error(`❌ Download attempt ${i + 1} failed:`, error.message);

      if (i === retries - 1) {
        throw new Error(
          `Failed to download PDF after ${retries} attempts: ${error.message}`
        );
      }

      // Exponential backoff: 1s, 2s, 4s
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, i))
      );
    }
  }
}

/**
 * Delete PDF from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 */
export async function deletePDFFromCloudinary(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });
    console.log("🗑️ PDF deleted from Cloudinary:", publicId);
    return result;
  } catch (error) {
    console.error("❌ Failed to delete PDF:", error);
    throw error;
  }
}

export default cloudinary;
