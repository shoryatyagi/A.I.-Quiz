import { NextResponse } from "next/server";
import { uploadPDFToCloudinary } from "@/lib/cloudinary";

export async function POST(request) {
  try {
    // Validate Cloudinary configuration
    if (!process.env.CLOUDINARY_CLOUD_NAME || 
        !process.env.CLOUDINARY_API_KEY || 
        !process.env.CLOUDINARY_API_SECRET) {
      console.error("❌ Cloudinary credentials missing in environment variables");
      return NextResponse.json(
        { 
          error: "Server configuration error: Cloudinary credentials not configured",
          details: "Please check CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET environment variables"
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Please upload a valid PDF file" },
        { status: 400 }
      );
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 50MB" },
        { status: 400 }
      );
    }

    console.log(
      `📤 Uploading PDF to Cloudinary: ${file.name} (${(
        file.size /
        1024 /
        1024
      ).toFixed(2)} MB)`
    );

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const cloudinaryResult = await uploadPDFToCloudinary(buffer, file.name);

    return NextResponse.json({
      success: true,
      pdfUrl: cloudinaryResult.url,
      publicId: cloudinaryResult.publicId,
      fileName: file.name,
      fileSize: file.size,
      cloudinaryBytes: cloudinaryResult.bytes,
    });
  } catch (error) {
    console.error("❌ Error uploading PDF:", error);
    
    // Always return JSON, even for unexpected errors
    return NextResponse.json(
      { 
        error: error.message || "Failed to upload PDF",
        details: error.stack ? error.stack.split("\n")[0] : "Unknown error"
      },
      { status: 500 }
    );
  }
}
