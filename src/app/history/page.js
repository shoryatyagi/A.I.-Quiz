"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Trophy,
  Target,
  Search,
  TrendingUp,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Loader from "@/components/Loader";
import { API_URL } from "@/lib/api";

export default function HistoryPage() {
  const { user, status, getIdToken } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date"); // 'date' or 'score'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const fetchHistory = useCallback(async () => {
    try {
      const idToken = await getIdToken();
      const response = await fetch(`${API_URL}/api/quiz-history`, {
        headers: {
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
      });
      const data = await response.json();

      if (data.success) {
        setHistory(data.history);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  }, [getIdToken]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      fetchHistory();
    }
  }, [status, router, fetchHistory]);

  useEffect(() => {
    // Filter and sort history
    let filtered = history.filter((quiz) =>
      quiz.quizTitle.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === "date") {
      filtered.sort(
        (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
      );
    } else if (sortBy === "score") {
      filtered.sort((a, b) => b.percentage - a.percentage);
    }

    setFilteredHistory(filtered);
  }, [history, searchQuery, sortBy]);

  const fetchQuizDetails = async (quizId) => {
    try {
      setLoading(true);
      const idToken = await getIdToken();
      const response = await fetch(`${API_URL}/api/quiz-history?id=${quizId}`, {
        headers: {
          ...(idToken && { "Authorization": `Bearer ${idToken}` }),
        },
      });
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
      month: "2-digit",
      day: "2-digit",
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

  const getScoreBadgeColor = (percentage) => {
    if (percentage >= 80) {
      return "bg-green-100 text-green-800";
    } else if (percentage >= 60) {
      return "bg-yellow-100 text-yellow-800";
    } else {
      return "bg-red-100 text-red-800";
    }
  };

  if (loading) {
    return <Loader message="Loading your quiz history" />;
  }

  // Show quiz details view
  if (selectedQuiz) {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex];
    const isCorrect = currentQuestion?.isCorrect;

    return (
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-8">
            <button
              onClick={() => {
                setSelectedQuiz(null);
                setCurrentQuestionIndex(0);
              }}
              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#7438dc] cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to My Quizzes
            </button>
          </div>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <h2 className="text-3xl font-bold text-gray-900">
              Review: {selectedQuiz.quizTitle}
            </h2>
            <div className="flex items-center gap-2 text-lg font-semibold">
              <span className="text-green-600">Score:</span>
              <span
                className={`px-3 py-1 text-base font-medium rounded-full ${getScoreBadgeColor(
                  selectedQuiz.percentage
                )}`}
              >
                {selectedQuiz.percentage}%
              </span>
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
            <div className="space-y-8">
              {currentQuestion && (
                <div>
                  <p className="text-lg font-semibold text-gray-800 mb-4">
                    {currentQuestionIndex + 1}. {currentQuestion.questionText}
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
                            <p className="text-gray-700">
                              {currentQuestion.selectedAnswerText}
                            </p>
                          </div>
                        </div>
                        {/* Correct Answer */}
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-green-100 border border-green-200">
                          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                          <div>
                            <p className="font-medium text-green-800">
                              Correct Answer
                            </p>
                            <p className="text-gray-700">
                              {currentQuestion.correctAnswerText}
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
                          <p className="text-gray-700">
                            {currentQuestion.selectedAnswerText}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {currentQuestion.explanation && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium text-slate-700 mb-1">
                          Explanation:
                        </p>
                        <p className="text-sm text-slate-600 italic">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
              <button
                onClick={() =>
                  setCurrentQuestionIndex(currentQuestionIndex - 1)
                }
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-[#7438dc]/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <span className="text-sm text-gray-500">
                Question {currentQuestionIndex + 1} of{" "}
                {selectedQuiz.questions.length}
              </span>

              <button
                onClick={() =>
                  setCurrentQuestionIndex(currentQuestionIndex + 1)
                }
                disabled={
                  currentQuestionIndex === selectedQuiz.questions.length - 1
                }
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-[#7438dc]/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 text-violet-700 mb-1">
                <Trophy className="w-4 h-4" />
                <span className="text-xs font-semibold">Score</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {selectedQuiz.score}/{selectedQuiz.totalQuestions}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs font-semibold">Time</span>
              </div>
              <div className="text-2xl font-bold text-gray-800">
                {formatTime(selectedQuiz.totalTime)}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Target className="w-4 h-4" />
                <span className="text-xs font-semibold">Mode</span>
              </div>
              <div className="text-lg font-bold text-gray-800 capitalize">
                {selectedQuiz.mode}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-2 text-orange-600 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-semibold">Date</span>
              </div>
              <div className="text-sm font-bold text-gray-800">
                {formatDate(selectedQuiz.completedAt)}
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Show history list view
  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header with Search and Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold text-gray-900">My Quizzes</h2>
          <div className="flex w-full flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:gap-4 md:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-200 focus:ring-2 focus:ring-[#7438dc] focus:border-[#7438dc] transition-all"
                placeholder="Search quizzes..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 self-start sm:self-auto">
              <button
                onClick={() => setSortBy("date")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 transform hover:scale-105 cursor-pointer ${
                  sortBy === "date"
                    ? "bg-[#7438dc] text-white border-[#7438dc]"
                    : "text-gray-600 bg-white border-gray-200 hover:bg-[#7438dc]/10"
                }`}
              >
                <Calendar className="w-4 h-4" />
                Date
              </button>
              <button
                onClick={() => setSortBy("score")}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 transform hover:scale-105 cursor-pointer ${
                  sortBy === "score"
                    ? "bg-[#7438dc] text-white border-[#7438dc]"
                    : "text-gray-600 bg-white border-gray-200 hover:bg-[#7438dc]/10"
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                Score
              </button>
            </div>
          </div>
        </div>

        {/* Quiz Table */}
        {filteredHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {searchQuery ? "No quizzes found" : "No Quiz History Yet"}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Try a different search term"
                : "Start playing quizzes to see your history here!"}
            </p>
            {!searchQuery && (
              <button
                onClick={() => router.push("/")}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all duration-200 transform hover:scale-105 hover:shadow-lg cursor-pointer"
              >
                Start a Quiz
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-[1.5rem] border border-[#e9e0f7] bg-white shadow-[0_18px_50px_-34px_rgba(61,34,110,0.4)]">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-6 py-3" scope="col">
                      Quiz Title
                    </th>
                    <th className="px-6 py-3" scope="col">
                      Date Attempted
                    </th>
                    <th className="px-6 py-3 text-center" scope="col">
                      Score
                    </th>
                    <th className="px-6 py-3" scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {filteredHistory.map((quiz, index) => (
                      <motion.tr
                        key={quiz._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-white border-b border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                          {quiz.quizTitle}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(quiz.completedAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <span
                              className={`px-3 py-1 text-sm font-medium rounded-full ${getScoreBadgeColor(
                                quiz.percentage
                              )}`}
                            >
                              {quiz.percentage}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => {
                              const encodedName = encodeURIComponent(
                                quiz.quizTitle
                              );
                              router.push(
                                `/history/${quiz._id}?name=${encodedName}`
                              );
                            }}
                            className="text-primary hover:underline font-medium transition-all duration-200 hover:scale-105 transform inline-block cursor-pointer"
                          >
                            View Details
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
