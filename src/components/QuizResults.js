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
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto p-8"
    >
      {/* Score Card */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-2xl p-8 mb-8 text-white text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring" }}
        >
          <Trophy className="w-20 h-20 mx-auto mb-4" />
        </motion.div>
        <h2 className="text-4xl font-bold mb-4">Quiz Completed!</h2>
        <div className="text-6xl font-bold mb-2">
          {score}/{totalQuestions}
        </div>
        <div className="text-xl opacity-90 mb-4">{percentage}% Correct</div>
        {leaderboard && leaderboard[0] && (
          <div className="text-lg opacity-90">
            Total Time: {formatTime(leaderboard[0].totalTime)}
          </div>
        )}
      </div>

      {/* Leaderboard (Multiplayer) */}
      {leaderboard && leaderboard.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Leaderboard
          </h3>
          <div className="space-y-4">
            {leaderboard.map((player, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl flex items-center gap-4 ${
                  index === 0
                    ? "bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-400"
                    : "bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-center w-12 h-12">
                  {getRankIcon(index) || (
                    <span className="text-2xl font-bold text-gray-600">
                      #{index + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-lg text-gray-800">
                    {player.name}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      <span>
                        {player.correctAnswers}/{totalQuestions} correct
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(player.totalTime)} total</span>
                    </div>
                    <div className="text-xs opacity-75">
                      (avg: {formatTime(player.avgTime)}/question)
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Answer Review */}
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">Answer Review</h3>
        <div className="space-y-6">
          {quiz.map((question, index) => {
            let userAnswerText;
            let isCorrect;

            if (leaderboard && currentPlayerData) {
              // Multiplayer mode - match answer by QUESTION TEXT, not by index
              // This is crucial because the client has a randomized quiz order
              const answerObj = currentPlayerData.answers?.find(
                (ans) => ans.questionText === question.question
              );
              userAnswerText = answerObj?.selectedAnswerText;
              isCorrect = answerObj?.isCorrect;

              console.log(`📝 Question ${index} (Multiplayer):`, {
                question: question.question.substring(0, 50),
                userAnswerText,
                correctAnswerText: answerObj?.correctAnswerText,
                isCorrect,
                hasAnswerObj: !!answerObj,
              });
            } else if (leaderboard && !currentPlayerData) {
              // Multiplayer but player not found - use local userAnswers as fallback
              console.warn(
                `⚠️ Player not found in leaderboard! Using local answers.`
              );
              userAnswerText = userAnswers[index];
              const correctAnswerText =
                question.options[question.correctAnswer];
              isCorrect = userAnswerText === correctAnswerText;

              console.log(`📝 Question ${index} (Multiplayer Fallback):`, {
                question: question.question.substring(0, 50),
                userAnswerText,
                correctAnswerText,
                isCorrect,
              });
            } else {
              // Solo mode - userAnswers contains answer text
              userAnswerText = userAnswers[index];
              const correctAnswerText =
                question.options[question.correctAnswer];
              isCorrect = userAnswerText === correctAnswerText;

              console.log(`📝 Question ${index} (Solo):`, {
                question: question.question.substring(0, 50),
                userAnswerText,
                correctAnswerText,
                isCorrect,
              });
            }

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-6 rounded-xl border-2 ${
                  isCorrect
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  {isCorrect ? (
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800 mb-2">
                      {index + 1}. {question.question}
                    </div>
                    <div className="space-y-1 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">
                          Your answer:{" "}
                        </span>
                        <span
                          className={
                            isCorrect ? "text-green-700" : "text-red-700"
                          }
                        >
                          {userAnswerText}
                        </span>
                      </div>
                      {!isCorrect && (
                        <div>
                          <span className="font-medium text-gray-700">
                            Correct answer:{" "}
                          </span>
                          <span className="text-green-700">
                            {question.options[question.correctAnswer]}
                          </span>
                        </div>
                      )}
                      <div className="text-gray-600 mt-2 italic">
                        {question.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onPlayAgain}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
      >
        <Home className="w-5 h-5" />
        Back to Home
      </button>
    </motion.div>
  );
}
