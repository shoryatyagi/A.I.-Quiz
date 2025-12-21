import { NextResponse } from "next/server";
import { generateQuizFromPrompt } from "@/lib/openai";

export async function POST(request) {
  try {
    const { quizName, topic, numberOfQuestions, difficulty, model = "gemini" } =
      await request.json();

    // Validate inputs
    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Validate number of questions (minimum 5, no maximum)
    if (numberOfQuestions < 5) {
      return NextResponse.json(
        { error: "Number of questions must be at least 5" },
        { status: 400 }
      );
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty level" },
        { status: 400 }
      );
    }

    console.log(`🤖 Generating quiz using ${model === 'ollama' ? 'Ollama' : 'Gemini'} AI`);

    // Generate quiz using selected AI model
    const quiz = await generateQuizFromPrompt(
      topic.trim(),
      numberOfQuestions,
      difficulty,
      model
    );

    return NextResponse.json({
      quiz,
      metadata: {
        quizName: (quizName && quizName.trim()) || topic,
        topic,
        numberOfQuestions: quiz.length,
        difficulty,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return NextResponse.json(
      { error: "Failed to generate quiz. Please try again." },
      { status: 500 }
    );
  }
}
