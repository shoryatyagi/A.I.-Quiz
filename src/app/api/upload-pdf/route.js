import { NextResponse } from "next/server";
import { parsePDF } from "@/lib/pdfParser";
import { generateQuizFromText } from "@/lib/openai";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const quizName = formData.get("quizName") || "";
    const numberOfQuestions = parseInt(
      formData.get("numberOfQuestions") || "10"
    );

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

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 10MB" },
        { status: 400 }
      );
    }

    // Validate number of questions
    if (numberOfQuestions < 5 || numberOfQuestions > 50) {
      return NextResponse.json(
        { error: "Number of questions must be between 5 and 50" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse PDF
    const { text, numPages } = await parsePDF(buffer);

    // Generate quiz using LLM
    const quiz = await generateQuizFromText(text, numberOfQuestions);

    return NextResponse.json({
      success: true,
      quiz,
      metadata: {
        quizName: (quizName && quizName.trim()) || file.name.replace('.pdf', ''),
        fileName: file.name,
        numPages,
        numberOfQuestions: quiz.length,
      },
    });
  } catch (error) {
    console.error("Error processing PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process PDF" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
