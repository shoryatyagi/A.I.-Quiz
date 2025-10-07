"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Trophy,
  Target,
  Users,
  User,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";

export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      fetchHistory();
    }
  }, [status, router]);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/quiz-history");
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuizDetails = async (quizId) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quiz-history?id=${quizId}`);
      const data = await response.json();

      if (data.success) {
        setSelectedQuiz(data.history);
      }
    } catch (error) {
      console.error("Error fetching quiz details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your quiz history...</p>
        </div>
      </div>
    );
  }

  // Show quiz details view
  if (selectedQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="max-w-4xl mx-auto p-4 sm:p-8">
          {/* Back Button */}
          <button
            onClick={() => setSelectedQuiz(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to History</span>
          </button>

          {/* Quiz Summary Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              {selectedQuiz.quizTitle}
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <Trophy className="w-4 h-4" />
                  <span className="text-xs font-semibold">Score</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {selectedQuiz.score}/{selectedQuiz.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedQuiz.percentage}%
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-semibold">Time</span>
                </div>
                <div className="text-2xl font-bold text-gray-800">
                  {formatTime(selectedQuiz.totalTime)}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-semibold">Mode</span>
                </div>
                <div className="text-lg font-bold text-gray-800 capitalize">
                  {selectedQuiz.mode}
                </div>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-orange-600 mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-semibold">Date</span>
                </div>
                <div className="text-sm font-bold text-gray-800">
                  {formatDate(selectedQuiz.completedAt)}
                </div>
              </div>
            </div>

            {selectedQuiz.roomCode && (
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">Room Code:</p>
                <p className="text-2xl font-bold text-gray-800">
                  {selectedQuiz.roomCode}
                </p>
              </div>
            )}
          </div>

          {/* Questions Review */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-6">
              Questions Review
            </h3>

            <div className="space-y-6">
              {selectedQuiz.questions.map((question, index) => {
                const isCorrect = question.isCorrect;

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
                        <div className="font-semibold text-gray-800 mb-3">
                          {index + 1}. {question.questionText}
                        </div>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">
                              Your answer:{" "}
                            </span>
                            <span
                              className={
                                isCorrect ? "text-green-700" : "text-red-700"
                              }
                            >
                              {question.selectedAnswerText}
                            </span>
                          </div>
                          {!isCorrect && (
                            <div>
                              <span className="font-medium text-gray-700">
                                Correct answer:{" "}
                              </span>
                              <span className="text-green-700">
                                {question.correctAnswerText}
                              </span>
                            </div>
                          )}
                          {question.explanation && (
                            <div className="text-gray-600 mt-2 italic">
                              {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard (if multiplayer) */}
          {selectedQuiz.leaderboard && selectedQuiz.leaderboard.length > 0 && (
            <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 mt-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                Final Leaderboard
              </h3>
              <div className="space-y-3">
                {selectedQuiz.leaderboard.map((player, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl flex items-center gap-4 ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-100 to-yellow-50 border-2 border-yellow-400"
                        : "bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center justify-center w-12 h-12">
                      {index === 0 && (
                        <Trophy className="w-8 h-8 text-yellow-500" />
                      )}
                      {index === 1 && (
                        <Trophy className="w-8 h-8 text-gray-400" />
                      )}
                      {index === 2 && (
                        <Trophy className="w-8 h-8 text-orange-600" />
                      )}
                      {index > 2 && (
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
                        <span>
                          {player.correctAnswers}/{selectedQuiz.totalQuestions}{" "}
                          correct
                        </span>
                        <span>{formatTime(player.totalTime)} total</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show history list view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
              Quiz History
            </h1>
            <p className="text-gray-600">
              Review your past quizzes and track your progress
            </p>
          </div>
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </button>
        </div>

        {/* Stats Cards */}
        {history.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {history.length}
              </div>
              <div className="text-sm text-gray-600">Total Quizzes</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {Math.round(
                  history.reduce((acc, q) => acc + q.percentage, 0) /
                    history.length
                )}
                %
              </div>
              <div className="text-sm text-gray-600">Avg Score</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {history.filter((q) => q.mode === "solo").length}
              </div>
              <div className="text-sm text-gray-600">Solo Quizzes</div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <div className="text-3xl font-bold text-orange-600 mb-1">
                {history.filter((q) => q.mode === "multiplayer").length}
              </div>
              <div className="text-sm text-gray-600">Multiplayer</div>
            </div>
          </div>
        )}

        {/* Quiz History List */}
        {history.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No Quiz History Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start playing quizzes to see your history here!
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Start a Quiz
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {history.map((quiz, index) => (
                <motion.div
                  key={quiz._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => fetchQuizDetails(quiz._id)}
                  className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">
                          {quiz.quizTitle}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            quiz.mode === "solo"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-purple-100 text-purple-700"
                          }`}
                        >
                          {quiz.mode === "solo" ? (
                            <User className="w-3 h-3 inline mr-1" />
                          ) : (
                            <Users className="w-3 h-3 inline mr-1" />
                          )}
                          {quiz.mode}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="font-semibold text-gray-800">
                            {quiz.score}/{quiz.totalQuestions}
                          </span>
                          <span>({quiz.percentage}%)</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(quiz.totalTime)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(quiz.completedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className="w-6 h-6 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
