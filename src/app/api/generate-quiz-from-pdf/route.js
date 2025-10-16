import { NextResponse } from "next/server";
import { parsePDF } from "@/lib/pdfParser";
import { generateQuizFromText } from "@/lib/openai";
import {
  downloadPDFFromCloudinary,
  deletePDFFromCloudinary,
} from "@/lib/cloudinary";

export const maxDuration = 60; // 60 seconds for large PDFs

export async function POST(request) {
  try {
    const { pdfUrl, quizName, numberOfQuestions, aiModel } = await request.json();

    if (!pdfUrl) {
      return NextResponse.json(
        { error: "PDF URL is required" },
        { status: 400 }
      );
    }

    // Validate it's a Cloudinary URL
    if (!pdfUrl.includes("cloudinary.com")) {
      return NextResponse.json(
        { error: "Invalid PDF URL. Must be a Cloudinary URL." },
        { status: 400 }
      );
    }

    // Validate number of questions (minimum 5, no maximum)
    const numQuestions = parseInt(numberOfQuestions) || 10;
    if (numQuestions < 5) {
      return NextResponse.json(
        { error: "Number of questions must be at least 5" },
        { status: 400 }
      );
    }

    // Validate AI model selection
    const selectedModel = aiModel || "deepseek"; // Default to deepseek
    if (!["deepseek", "gemini"].includes(selectedModel)) {
      return NextResponse.json(
        { error: "Invalid AI model selection" },
        { status: 400 }
      );
    }

    console.log(`🤖 Generating quiz from Cloudinary PDF using ${selectedModel.toUpperCase()}: ${pdfUrl}`);

    // Download PDF from Cloudinary with retry logic
    const buffer = await downloadPDFFromCloudinary(pdfUrl);

    // Parse PDF to extract text
    console.log("📄 Parsing PDF to extract text...");
    const { text, numPages } = await parsePDF(buffer);

    // Generate quiz using AI with selected model
    console.log(`✨ Generating ${numQuestions} questions using ${selectedModel.toUpperCase()} AI...`);
    const quiz = await generateQuizFromText(text, numQuestions, selectedModel);

    // Extract filename from URL for metadata
    const urlParts = pdfUrl.split("/");
    const filename = urlParts[urlParts.length - 1];
    const originalName = filename
      .replace(/^\d+-/, "")
      .replace(/\.(pdf|PDF)$/, "");

    console.log(`✅ Quiz generated successfully: ${quiz.length} questions`);

    // Extract public_id from Cloudinary URL and delete the PDF
    // Cloudinary URL format: https://res.cloudinary.com/{cloud_name}/raw/upload/v{version}/{folder}/{public_id}
    try {
      const folderName = process.env.CLOUDINARY_FOLDER_NAME || "quiz-app";
      const publicId = `${folderName}/${filename.replace(/\.(pdf|PDF)$/, "")}`;

      console.log(`🗑️ Deleting PDF from Cloudinary: ${publicId}`);
      await deletePDFFromCloudinary(publicId);
      console.log(`✅ PDF deleted from Cloudinary successfully`);
    } catch (deleteError) {
      // Log but don't fail the request if deletion fails
      console.error(
        "⚠️ Failed to delete PDF from Cloudinary:",
        deleteError.message
      );
      console.log(
        "Quiz generation successful, but PDF cleanup failed (non-critical)"
      );
    }

    return NextResponse.json({
      success: true,
      quiz,
      metadata: {
        quizName: (quizName && quizName.trim()) || originalName,
        fileName: originalName,
        numPages,
        numberOfQuestions: quiz.length,
        pdfDeleted: true, // Indicate PDF was deleted from cloud
      },
    });
  } catch (error) {
    console.error("❌ Error generating quiz from PDF:", error);

    // Specific error messages
    if (error.message.includes("timeout") || error.message.includes("abort")) {
      return NextResponse.json(
        {
          error:
            "PDF download timeout. The file might be too large. Please try again.",
        },
        { status: 504 }
      );
    }

    if (error.message.includes("not a valid PDF")) {
      return NextResponse.json(
        { error: "Invalid PDF file. Please upload the PDF again." },
        { status: 400 }
      );
    }

    if (error.message.includes("download")) {
      return NextResponse.json(
        {
          error:
            "Failed to download PDF from Cloudinary. Please try uploading again.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate quiz from PDF" },
      { status: 500 }
    );
  }
}
