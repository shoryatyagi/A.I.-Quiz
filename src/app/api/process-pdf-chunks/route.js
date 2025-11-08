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
 * Split text into random chunks from the entire PDF
 * Creates many small chunks then randomly selects the needed number
 */
function createChunks(text, numberOfQuestions) {
  // Clean the text
  const cleanedText = text
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\n+/g, "\n") // Normalize newlines
    .trim();

  // Split into sentences first
  const sentences = cleanedText.match(/[^.!?]+[.!?]+/g) || [cleanedText];
  
  if (sentences.length === 0) {
    return [cleanedText];
  }

  // Create many small chunks (3-5 sentences each)
  const allChunks = [];
  const sentencesPerChunk = 4; // Average chunk size
  
  for (let i = 0; i < sentences.length; i += sentencesPerChunk) {
    const chunkSentences = sentences.slice(i, i + sentencesPerChunk);
    const chunk = chunkSentences.join(" ").trim();
    if (chunk.length > 50) { // Only include meaningful chunks
      allChunks.push(chunk);
    }
  }

  // If we don't have enough chunks, split larger
  if (allChunks.length < numberOfQuestions) {
    const minChunkSize = 200; // Minimum characters per chunk
    const tempChunks = [];
    
    for (let i = 0; i < cleanedText.length; i += minChunkSize) {
      const chunk = cleanedText.substring(i, i + minChunkSize).trim();
      if (chunk.length > 50) {
        tempChunks.push(chunk);
      }
    }
    
    if (tempChunks.length > allChunks.length) {
      allChunks.length = 0;
      allChunks.push(...tempChunks);
    }
  }

  // Randomly select numberOfQuestions chunks
  const selectedChunks = [];
  const availableIndices = Array.from({ length: allChunks.length }, (_, i) => i);
  
  // Fisher-Yates shuffle to get random indices
  for (let i = availableIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableIndices[i], availableIndices[j]] = [availableIndices[j], availableIndices[i]];
  }

  // Select the first numberOfQuestions indices
  const selectedIndices = availableIndices.slice(0, Math.min(numberOfQuestions, allChunks.length));
  
  // Get chunks in their original order (sorted by index) for better context
  selectedIndices.sort((a, b) => a - b);
  
  for (const index of selectedIndices) {
    selectedChunks.push(allChunks[index]);
  }

  // If we still don't have enough, pad with the entire text
  while (selectedChunks.length < numberOfQuestions) {
    selectedChunks.push(cleanedText);
  }

  console.log(`📊 Created ${allChunks.length} total chunks, randomly selected ${selectedChunks.length}`);
  
  return selectedChunks;
}
