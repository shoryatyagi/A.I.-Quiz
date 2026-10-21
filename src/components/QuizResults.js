"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { API_URL } from "@/lib/api";

export default function QuizResults({
  quiz = [],
  userAnswers = [],
  answerTimes = [], // Time spent on each question (solo mode)
  leaderboard: incomingLeaderboard = null,
  playerName = "",
  onPlayAgain,
  mode = "solo",
  roomCode = null,
  metadata = null,
}) {
  const { user, getIdToken } = useAuth();
  const safeQuiz = Array.isArray(quiz) ? quiz : [];
  const safeAnswers = Array.isArray(userAnswers) ? userAnswers : [];
  const leaderboard = Array.isArray(incomingLeaderboard)
    ? incomingLeaderboard.filter((player) => player && typeof player.name === "string")
    : null;
  const safeAnswerTimes = Array.isArray(answerTimes) ? answerTimes : [];
  const hasSavedRef = useRef(false); // Track if we've already saved
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentLeaderboardPage, setCurrentLeaderboardPage] = useState(0);
  const PLAYERS_PER_PAGE = 10; // Show 10 players per page

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
    safeAnswers.forEach((selectedAnswerText, index) => {
      const question = safeQuiz[index];
      if (!question?.options?.[question.correctAnswer]) return;
      const correctAnswerText = question.options[question.correctAnswer];
      if (selectedAnswerText === correctAnswerText) {
        correct++;
      }
    });
    return correct;
  };

  const formatTime = (ms) => {
    ms = Number.isFinite(Number(ms)) ? Math.max(0, Number(ms)) : 0;
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getTotalTime = () => {
    if (leaderboard && currentPlayerData) {
      // For multiplayer, get current player's total time
      return currentPlayerData.totalTime || 0;
    }
    // For solo mode, calculate total time from answerTimes array
    if (mode === "solo" && safeAnswerTimes.length > 0) {
      return safeAnswerTimes.reduce((total, time) => total + (Number(time) || 0), 0);
    }
    return 0;
  };

  const totalQuestions = safeQuiz.length;
  const score = Math.min(totalQuestions, Math.max(0, Number(calculateScore()) || 0));
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const totalTime = getTotalTime();

  // Get current player's rank
  const getCurrentPlayerRank = () => {
    if (!leaderboard || !currentPlayerData) return null;
    return (
      currentPlayerData.rank ||
      leaderboard.findIndex((p) => p.name === playerName) + 1
    );
  };

  const playerRank = getCurrentPlayerRank();

  const hasValidQuiz = safeQuiz.length > 0 && safeQuiz.every((question) =>
    question &&
    typeof question.question === "string" &&
    question.question.trim() &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every((option) => typeof option === "string" && option.trim()) &&
    Number.isInteger(question.correctAnswer) &&
    question.correctAnswer >= 0 &&
    question.correctAnswer < question.options.length
  );

  // Save quiz history to MongoDB when results are shown (only once)
  useEffect(() => {
    const saveQuizHistory = async () => {
      // Check if already saved or no user
      if (!user?.email || hasSavedRef.current) {
        console.log("⏭️ Skipping save:", {
          hasUser: !!user,
          hasEmail: !!user?.email,
          alreadySaved: hasSavedRef.current,
        });
        return;
      }

      if (safeQuiz.length === 0) return;

      console.log("💾 Attempting to save quiz history...");

      // Mark as saving IMMEDIATELY to prevent duplicate calls
      hasSavedRef.current = true;

      // Prepare questions data with answers
      const questionsData = safeQuiz.map((question, index) => {
        let userAnswerText;
        let isCorrect;

        if (leaderboard && currentPlayerData) {
          // Multiplayer mode
          const answerObj = (Array.isArray(currentPlayerData.answers) ? currentPlayerData.answers : []).find(
            (ans) => ans.questionText === question.question
          );
          userAnswerText = answerObj?.selectedAnswerText;
          isCorrect = answerObj?.isCorrect;
        } else {
          // Solo mode
          userAnswerText = safeAnswers[index];
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
        totalTime: totalTime,
        questions: questionsData,
        metadata: metadata,
        leaderboard: leaderboard,
      };

      try {
        // Get Firebase ID token for authentication
        const idToken = await getIdToken();

        const response = await fetch(`${API_URL}/api/quiz-history`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(idToken && { "Authorization": `Bearer ${idToken}` }),
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
  }, [user?.email]); // Only run when user email is available

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

  if (!hasValidQuiz) {
    return (
      <main className="flex-1 px-4 py-12 text-center" role="alert">
        <h1 className="text-2xl font-bold text-slate-900">Results unavailable</h1>
        <p className="mt-2 text-slate-600">The quiz data is incomplete. Return home to continue.</p>
        <button
          type="button"
          onClick={onPlayAgain}
          className="mt-6 rounded-lg bg-[#7438dc] px-6 py-3 font-semibold text-white"
        >
          Return home
        </button>
      </main>
    );
  }

  return (
    <main className="flex-1">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
            Quiz Results
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Great job! Here&apos;s a summary of your performance.
          </p>
        </div>

        {/* Score Display */}
        <div className="mb-12 flex justify-center">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
            {playerRank && (
              <div className="flex items-center gap-4 rounded-xl bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 p-6">
                {playerRank === 1 ? (
                  <Trophy className="w-8 h-8 text-yellow-500" />
                ) : playerRank === 2 ? (
                  <Medal className="w-8 h-8 text-slate-400" />
                ) : playerRank === 3 ? (
                  <Award className="w-8 h-8 text-orange-600" />
                ) : (
                  <Target className="w-8 h-8 text-[#7438dc]" />
                )}
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    Your Rank
                  </p>
                  <p className="text-4xl font-bold text-slate-900">
                    #{playerRank}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-4 rounded-xl bg-[#7438dc]/10 p-6">
              <p className="text-lg font-medium text-[#7438dc]">Your Score</p>
              <p className="text-4xl font-bold text-[#7438dc]">
                {score}/{totalQuestions}
              </p>
            </div>
            {totalTime > 0 && (
              <div className="flex items-center gap-4 rounded-xl bg-[#7438dc]/10 p-6">
                <Clock className="w-6 h-6 text-[#7438dc]" />
                <div>
                  <p className="text-sm font-medium text-[#7438dc]">
                    Total Time
                  </p>
                  <p className="text-2xl font-bold text-[#7438dc]">
                    {formatTime(totalTime)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Leaderboard (Multiplayer Mode) */}
        {leaderboard && leaderboard.length > 0 && (
          <div className="mb-8 rounded-lg border border-slate-200/80 bg-white/50 p-4 sm:p-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Leaderboard
            </h3>
            <div className="space-y-3">
              {(() => {
                const startIndex = currentLeaderboardPage * PLAYERS_PER_PAGE;
                const endIndex = startIndex + PLAYERS_PER_PAGE;
                const playersToShow = leaderboard.slice(startIndex, endIndex);
                const totalPages = Math.ceil(
                  leaderboard.length / PLAYERS_PER_PAGE
                );

                return (
                  <>
                    {playersToShow.map((player, relativeIndex) => {
                      const index = startIndex + relativeIndex;
                      const rank = player.rank || index + 1;
                      const isCurrentPlayer = player.name === playerName;

                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: relativeIndex * 0.1 }}
                          className={`flex items-start gap-2 rounded-lg p-3 sm:items-center sm:gap-4 sm:p-4 ${
                            rank === 1
                              ? "bg-yellow-50 border-2 border-yellow-300"
                              : rank === 2
                              ? "bg-slate-100 border-2 border-slate-300"
                              : rank === 3
                              ? "bg-orange-50 border-2 border-orange-300"
                              : isCurrentPlayer
                              ? "bg-[#7438dc]/5 border-2 border-[#7438dc]/30"
                              : "bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center justify-center w-12 h-12">
                            {rank === 1 ? (
                              <Trophy className="w-8 h-8 text-yellow-500" />
                            ) : rank === 2 ? (
                              <Medal className="w-8 h-8 text-slate-400" />
                            ) : rank === 3 ? (
                              <Award className="w-8 h-8 text-orange-600" />
                            ) : (
                              <div className="flex items-center justify-center w-10 h-10 bg-slate-200 rounded-full">
                                <span className="text-lg font-bold text-slate-600">
                                  {rank}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              <span className="text-sm font-bold text-slate-500 min-w-[2rem]">
                                #{rank}
                              </span>
                              <span className="break-words text-base font-bold text-slate-800 sm:text-lg">
                                {player.name}
                              </span>
                              {isCurrentPlayer && (
                                <span className="text-xs font-semibold text-[#7438dc] bg-[#7438dc]/10 px-2 py-1 rounded-full">
                                  You
                                </span>
                              )}
                              {rank === 1 && (
                                <span className="text-xs font-semibold text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                                  Winner
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <Target className="w-4 h-4" />
                                <span className="font-medium">
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
                      );
                    })}

                    {/* Leaderboard Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="mt-6 pt-4 border-t border-slate-200 flex justify-between items-center">
                        <button
                          onClick={() =>
                            setCurrentLeaderboardPage(
                              currentLeaderboardPage - 1
                            )
                          }
                          disabled={currentLeaderboardPage === 0}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-[#7438dc]/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>

                        <span className="text-sm text-slate-500">
                          Page {currentLeaderboardPage + 1} of {totalPages} (
                          {leaderboard.length} players)
                        </span>

                        <button
                          onClick={() =>
                            setCurrentLeaderboardPage(
                              currentLeaderboardPage + 1
                            )
                          }
                          disabled={currentLeaderboardPage === totalPages - 1}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-[#7438dc]/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Answer Review with Pagination */}
        <div className="mb-8">
          {(() => {
            const question = safeQuiz[currentQuestionIndex];
            let userAnswerText;
            let isCorrect;

            if (leaderboard && currentPlayerData) {
              const answerObj = (Array.isArray(currentPlayerData.answers) ? currentPlayerData.answers : []).find(
                (ans) => ans.questionText === question.question
              );
              userAnswerText = answerObj?.selectedAnswerText;
              isCorrect = answerObj?.isCorrect;
            } else if (leaderboard && !currentPlayerData) {
              userAnswerText = safeAnswers[currentQuestionIndex];
              const correctAnswerText =
                question.options[question.correctAnswer];
              isCorrect = userAnswerText === correctAnswerText;
            } else {
              userAnswerText = safeAnswers[currentQuestionIndex];
              const correctAnswerText =
                question.options[question.correctAnswer];
              isCorrect = userAnswerText === correctAnswerText;
            }

            const correctAnswerText = question.options[question.correctAnswer];

            return (
              <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
                <div className="space-y-8">
                  <div>
                    <p className="text-lg font-semibold text-slate-800 mb-4">
                      {currentQuestionIndex + 1}. {question.question}
                    </p>

                    <div className="space-y-3">
                      {!isCorrect && (
                        <>
                          {/* Wrong Answer */}
                          <div className="flex items-start gap-4 p-4 rounded-lg bg-red-100 border border-red-200">
                            <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                            <div>
                              <p className="font-medium text-red-800">
                                Your Answer
                              </p>
                              <p className="text-slate-700">{userAnswerText ?? "No answer recorded."}</p>
                            </div>
                          </div>
                          {/* Correct Answer */}
                          <div className="flex items-start gap-4 p-4 rounded-lg bg-green-100 border border-green-200">
                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                            <div>
                              <p className="font-medium text-green-800">
                                Correct Answer
                              </p>
                              <p className="text-slate-700">
                                {correctAnswerText}
                              </p>
                            </div>
                          </div>
                        </>
                      )}

                      {isCorrect && (
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-green-100 border border-green-200">
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-medium text-green-800">
                              Your Answer (Correct)
                            </p>
                            <p className="text-slate-700">{userAnswerText ?? "No answer recorded."}</p>
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {question.explanation && (
                        <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-sm font-medium text-slate-700 mb-1">
                            Explanation:
                          </p>
                          <p className="text-sm text-slate-600 italic">
                            {question.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Navigation Controls */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-[#7438dc]/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-sm text-slate-500">
              Question {currentQuestionIndex + 1} of {safeQuiz.length}
            </span>

            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={currentQuestionIndex === safeQuiz.length - 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-[#7438dc]/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Back to Dashboard Button */}
        <div className="mt-12 text-center">
          <button
            onClick={onPlayAgain}
            className="rounded-full bg-[#7438dc] px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-[#7438dc]/80 cursor-pointer transition-all"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </main>
  );
}
