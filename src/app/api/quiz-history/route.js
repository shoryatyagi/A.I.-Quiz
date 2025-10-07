import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getQuizHistoryCollection } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quizData = await request.json();

    const collection = await getQuizHistoryCollection();

    // Create quiz history document with user reference (using email as ID)
    const historyDoc = {
      userId: session.user.email, // Reference to users collection by email
      userName: session.user.name,
      userEmail: session.user.email,
      userImage: session.user.image,
      quizTitle: quizData.quizTitle || "Untitled Quiz",
      mode: quizData.mode, // solo or multiplayer
      roomCode: quizData.roomCode || null,
      score: quizData.score,
      totalQuestions: quizData.totalQuestions,
      percentage: quizData.percentage,
      totalTime: quizData.totalTime || 0,
      metadata: quizData.metadata || {},
      // Store questions with answers efficiently
      questions: quizData.questions, // Array of questions with user answers
      leaderboard: quizData.leaderboard || null,
      completedAt: new Date(),
      createdAt: new Date(),
    };

    const result = await collection.insertOne(historyDoc);

    return NextResponse.json({
      success: true,
      historyId: result.insertedId.toString(),
    });
  } catch (error) {
    console.error("Error saving quiz history:", error);
    return NextResponse.json(
      { error: "Failed to save quiz history" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collection = await getQuizHistoryCollection();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const historyId = searchParams.get("id");

    if (historyId) {
      // Get specific quiz history with full details
      const history = await collection.findOne({
        _id: new ObjectId(historyId),
        userId: session.user.email, // Ensure user can only see their own history
      });

      if (!history) {
        return NextResponse.json({ error: "Quiz history not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        history: history,
      });
    } else {
      // Get all quiz history for the user (without full question details for list view)
      const histories = await collection
        .find({ userId: session.user.email })
        .sort({ completedAt: -1 })
        .project({
          // Only return summary fields for list view
          quizTitle: 1,
          mode: 1,
          roomCode: 1,
          score: 1,
          totalQuestions: 1,
          percentage: 1,
          totalTime: 1,
          'metadata.source': 1,
          'metadata.topic': 1,
          'metadata.difficulty': 1,
          completedAt: 1,
        })
        .limit(100) // Limit to last 100 quizzes
        .toArray();

      return NextResponse.json({
        success: true,
        history: histories,
      });
    }
  } catch (error) {
    console.error("Error fetching quiz history:", error);
    return NextResponse.json(
      { error: "Failed to fetch quiz history" },
      { status: 500 }
    );
  }
}
