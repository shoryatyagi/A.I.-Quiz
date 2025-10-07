import { NextResponse } from "next/server";
import { generateQuizFromPrompt } from "@/lib/openai";

export async function POST(request) {
  try {
    const { topic, numberOfQuestions, difficulty } = await request.json();

    // Validate inputs
    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    if (numberOfQuestions < 5 || numberOfQuestions > 20) {
      return NextResponse.json(
        { error: "Number of questions must be between 5 and 20" },
        { status: 400 }
      );
    }

    if (!["easy", "medium", "hard"].includes(difficulty)) {
      return NextResponse.json(
        { error: "Invalid difficulty level" },
        { status: 400 }
      );
    }

    // Generate quiz using AI
    const quiz = await generateQuizFromPrompt(
      topic.trim(),
      numberOfQuestions,
      difficulty
    );

    return NextResponse.json({
      quiz,
      metadata: {
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
