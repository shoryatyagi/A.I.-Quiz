import { NextResponse } from "next/server";
import pdf from "pdf-parse-fork";

export const maxDuration = 30;

/**
 * Process PDF and extract text chunks
 * POST /api/process-pdf-chunks
 */
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const numberOfQuestions = parseInt(formData.get("numberOfQuestions")) || 10;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Please upload a valid PDF file" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    console.log(`📄 Processing PDF: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse PDF
    const pdfData = await pdf(buffer);
    const fullText = pdfData.text;

    if (!fullText || fullText.trim().length === 0) {
      return NextResponse.json(
        { error: "No text found in PDF. The PDF might be empty or contain only images." },
        { status: 400 }
      );
    }

    console.log(`📝 Extracted ${fullText.length} characters from PDF`);

    // Split text into chunks (one chunk per question)
    const chunks = createChunks(fullText, numberOfQuestions);

    console.log(`✂️ Created ${chunks.length} chunks for ${numberOfQuestions} questions`);

    return NextResponse.json({
      success: true,
      chunks,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        totalText: fullText.length,
        chunksCount: chunks.length,
      },
    });
  } catch (error) {
    console.error("❌ Error processing PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process PDF" },
      { status: 500 }
    );
  }
}

/**
 * Split text into chunks
 * Creates equal-sized chunks, one per question
 */
function createChunks(text, numberOfQuestions) {
  // Clean the text
  const cleanedText = text
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\n+/g, "\n") // Normalize newlines
    .trim();

  // Calculate chunk size
  const totalLength = cleanedText.length;
  const chunkSize = Math.ceil(totalLength / numberOfQuestions);

  const chunks = [];
  let startIndex = 0;

  for (let i = 0; i < numberOfQuestions; i++) {
    let endIndex = startIndex + chunkSize;

    // For the last chunk, take everything remaining
    if (i === numberOfQuestions - 1) {
      endIndex = totalLength;
    } else {
      // Try to break at a sentence or word boundary
      // Look for period, question mark, or exclamation within next 100 chars
      const searchEnd = Math.min(endIndex + 100, totalLength);
      const substring = cleanedText.substring(endIndex, searchEnd);
      const sentenceEnd = substring.search(/[.!?]\s/);
      
      if (sentenceEnd !== -1) {
        endIndex = endIndex + sentenceEnd + 1;
      } else {
        // If no sentence boundary, try to break at a space
        const spaceIndex = substring.indexOf(" ");
        if (spaceIndex !== -1) {
          endIndex = endIndex + spaceIndex;
        }
      }
    }

    const chunk = cleanedText.substring(startIndex, endIndex).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }

    startIndex = endIndex;
  }

  return chunks;
}
