import { NextResponse } from "next/server";
import { generateQuizFromText } from "@/lib/openai";

export const maxDuration = 60;

/**
 * Generate quiz from PDF chunks
 * POST /api/generate-quiz-from-pdf-chunks
 * Body: { chunks: string[], numberOfQuestions: number, quizName?: string }
 */
export async function POST(request) {
  try {
    const { chunks, numberOfQuestions, quizName } = await request.json();

    // Validate chunks
    if (!Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json(
        { error: "Chunks array is required and must not be empty" },
        { status: 400 }
      );
    }

    // Validate number of questions
    const numQuestions = parseInt(numberOfQuestions) || 10;
    if (numQuestions < 5) {
      return NextResponse.json(
        { error: "Number of questions must be at least 5" },
        { status: 400 }
      );
    }

    console.log(
      `🚀 Generating ${numQuestions} questions from ${chunks.length} PDF chunks...`
    );

    // Select the number of chunks equal to number of questions
    const selectedChunks = chunks.slice(0, numQuestions);

    // Combine selected chunks with clear separation
    const combinedText = selectedChunks
      .map((chunk, index) => `[Section ${index + 1}]\n${chunk}`)
      .join("\n\n---\n\n");

    console.log(
      `📊 Using ${selectedChunks.length} chunks (${combinedText.length} characters total)`
    );

    // Generate quiz using Groq
    const quiz = await generateQuizFromText(combinedText, numQuestions);

    console.log(`✅ Quiz generated successfully: ${quiz.length} questions`);

    return NextResponse.json({
      success: true,
      quiz,
      metadata: {
        quizName: quizName || "PDF Quiz",
        numberOfQuestions: quiz.length,
        chunksUsed: selectedChunks.length,
        source: "pdf-chunks",
      },
    });
  } catch (error) {
    console.error("❌ Error generating quiz from PDF chunks:", error);

    // Specific error messages
    if (error.message.includes("Groq API")) {
      return NextResponse.json(
        {
          error: "Groq API error. Please check your API key and try again.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (error.message.includes("Invalid API key")) {
      return NextResponse.json(
        {
          error:
            "Invalid Groq API key. Please check GROQ_API_KEY environment variable.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || "Failed to generate quiz from PDF chunks",
        details: "An unexpected error occurred during quiz generation",
      },
      { status: 500 }
    );
  }
}
