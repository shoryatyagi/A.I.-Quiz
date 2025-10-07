"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Award,
  CheckCircle,
  XCircle,
  Home,
  Clock,
  Target,
} from "lucide-react";

export default function QuizResults({
  quiz,
  userAnswers,
  leaderboard = null,
  playerName = "",
  onPlayAgain,
  mode = "solo",
  roomCode = null,
  metadata = null,
}) {
  const { data: session } = useSession();
  const hasSavedRef = useRef(false); // Track if we've already saved

  // Find current player's data in multiplayer mode
  const getCurrentPlayerData = () => {
    if (!leaderboard || !playerName) {
      console.log("❌ No leaderboard or playerName:", {
        hasLeaderboard: !!leaderboard,
        playerName,
      });
      return null;
    }
    const found = leaderboard.find((p) => p.name === playerName);
    console.log("🔍 Finding player data:", {
      playerName,
      foundPlayer: !!found,
      leaderboardPlayers: leaderboard.map((p) => p.name),
    });
    return found;
  };

  const currentPlayerData = getCurrentPlayerData();

  const calculateScore = () => {
    if (leaderboard && currentPlayerData) {
      // For multiplayer, return the CURRENT player's correct answers
      return currentPlayerData.correctAnswers || 0;
    }

    // For solo mode, compare answer TEXT (since we now store text, not indices)
    let correct = 0;
    userAnswers.forEach((selectedAnswerText, index) => {
      const question = quiz[index];
      const correctAnswerText = question.options[question.correctAnswer];
      if (selectedAnswerText === correctAnswerText) {
        correct++;
      }
    });
    return correct;
  };

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const score = calculateScore();
  const totalQuestions = quiz.length;
  const percentage = Math.round((score / totalQuestions) * 100);

  // Save quiz history to MongoDB when results are shown (only once)
  useEffect(() => {
    const saveQuizHistory = async () => {
      // Check if already saved or no session or no user email
      if (!session?.user?.email || hasSavedRef.current) {
        console.log("⏭️ Skipping save:", {
          hasSession: !!session,
          hasEmail: !!session?.user?.email,
          alreadySaved: hasSavedRef.current,
        });
        return;
      }

      console.log("💾 Attempting to save quiz history...");

      // Mark as saving IMMEDIATELY to prevent duplicate calls
      hasSavedRef.current = true;

      // Prepare questions data with answers
      const questionsData = quiz.map((question, index) => {
        let userAnswerText;
        let isCorrect;

        if (leaderboard && currentPlayerData) {
          // Multiplayer mode
          const answerObj = currentPlayerData.answers?.find(
            (ans) => ans.questionText === question.question
          );
          userAnswerText = answerObj?.selectedAnswerText;
          isCorrect = answerObj?.isCorrect;
        } else {
          // Solo mode
          userAnswerText = userAnswers[index];
          const correctAnswerText = question.options[question.correctAnswer];
          isCorrect = userAnswerText === correctAnswerText;
        }

        return {
          questionText: question.question,
          selectedAnswerText: userAnswerText,
          correctAnswerText: question.options[question.correctAnswer],
          isCorrect: isCorrect,
          explanation: question.explanation || "",
        };
      });

      const historyData = {
        quizTitle: metadata?.topic || metadata?.filename || "Quiz",
        mode: mode,
        roomCode: roomCode,
        score: score,
        totalQuestions: totalQuestions,
        percentage: percentage,
        totalTime: leaderboard && leaderboard[0] ? leaderboard[0].totalTime : 0,
        questions: questionsData,
        metadata: metadata,
        leaderboard: leaderboard,
      };

      try {
        const response = await fetch("/api/quiz-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(historyData),
        });

        if (response.ok) {
          console.log("✅ Quiz history saved successfully");
          // Already marked as saved before the API call
        } else {
          console.error("❌ Failed to save quiz history");
          // Reset on failure so user can try again
          hasSavedRef.current = false;
        }
      } catch (error) {
        console.error("Error saving quiz history:", error);
        // Reset on error so user can try again
        hasSavedRef.current = false;
      }
    };

    saveQuizHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]); // Only run when user email is available

  const getRankIcon = (rank) => {
    switch (rank) {
      case 0:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 1:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 2:
        return <Award className="w-8 h-8 text-orange-600" />;
      default:
        return null;
    }
  };

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Quiz Results
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Great job! Here&apos;s a summary of your performance.
          </p>
        </div>

        {/* Score Display */}
        <div className="mb-12 flex justify-center">
          <div className="flex items-center gap-4 rounded-xl bg-[#135bec]/10 p-6">
            <p className="text-lg font-medium text-[#135bec]">Your Score</p>
            <p className="text-4xl font-bold text-[#135bec]">
              {score}/{totalQuestions}
            </p>
          </div>
        </div>

        {/* Leaderboard (Multiplayer Mode) */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="mb-8 rounded-lg border border-slate-200/80 bg-white/50 p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Leaderboard
            </h3>
            <div className="space-y-3">
              {leaderboard.map((player, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg flex items-center gap-4 ${
                    index === 0
                      ? "bg-yellow-50 border-2 border-yellow-300"
                      : "bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-center w-10 h-10">
                    {index === 0 ? (
                      <Trophy className="w-7 h-7 text-yellow-500" />
                    ) : index === 1 ? (
                      <Medal className="w-7 h-7 text-slate-400" />
                    ) : index === 2 ? (
                      <Award className="w-7 h-7 text-orange-600" />
                    ) : (
                      <span className="text-xl font-bold text-slate-600">
                        #{index + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-lg text-slate-800">
                      {player.name}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>
                          {player.correctAnswers}/{totalQuestions}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(player.totalTime)}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Answer Review */}
        <div className="space-y-6">
          {quiz.map((question, index) => {
            let userAnswerText;
            let isCorrect;

            if (leaderboard && currentPlayerData) {
              const answerObj = currentPlayerData.answers?.find(
                (ans) => ans.questionText === question.question
              );
              userAnswerText = answerObj?.selectedAnswerText;
              isCorrect = answerObj?.isCorrect;
            } else if (leaderboard && !currentPlayerData) {
              userAnswerText = userAnswers[index];
              const correctAnswerText =
                question.options[question.correctAnswer];
              isCorrect = userAnswerText === correctAnswerText;
            } else {
              userAnswerText = userAnswers[index];
              const correctAnswerText =
                question.options[question.correctAnswer];
              isCorrect = userAnswerText === correctAnswerText;
            }

            const correctAnswerText = question.options[question.correctAnswer];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-lg border border-slate-200/80 bg-white/50"
              >
                {/* Question */}
                <div className="p-6">
                  <p className="mb-1 text-sm font-medium text-slate-500">
                    Question {index + 1}
                  </p>
                  <p className="text-lg font-semibold text-slate-900">
                    {question.question}
                  </p>
                </div>

                {/* Answer Section */}
                {isCorrect ? (
                  <div className="rounded-b-lg border-t border-slate-200/80 bg-green-500/10 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700">Your Answer</p>
                        <p className="font-medium text-green-900">
                          {userAnswerText}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    </div>
                    {question.explanation && (
                      <p className="mt-3 text-sm text-slate-600 italic">
                        {question.explanation}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 rounded-b-lg border-t border-slate-200/80 px-6 py-4">
                    {/* Wrong Answer */}
                    <div className="flex items-center justify-between rounded-md bg-red-500/10 p-3">
                      <div>
                        <p className="text-sm text-red-700">
                          Your Answer (Incorrect)
                        </p>
                        <p className="font-medium text-red-900 line-through">
                          {userAnswerText}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white">
                        <XCircle className="w-5 h-5" />
                      </div>
                    </div>
                    {/* Correct Answer */}
                    <div className="flex items-center justify-between rounded-md bg-green-500/10 p-3">
                      <div>
                        <p className="text-sm text-green-700">Correct Answer</p>
                        <p className="font-medium text-green-900">
                          {correctAnswerText}
                        </p>
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-white">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    </div>
                    {question.explanation && (
                      <p className="text-sm text-slate-600 italic">
                        {question.explanation}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Back to Dashboard Button */}
        <div className="mt-12 text-center">
          <button
            onClick={onPlayAgain}
            className="rounded-full bg-[#135bec] px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#135bec]/80 cursor-pointer transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
