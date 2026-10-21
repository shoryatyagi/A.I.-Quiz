"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Trophy,
  Target,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Loader from "@/components/Loader";
import { API_URL } from "@/lib/api";

export default function QuizDetailsPage() {
  const { user, status, getIdToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const quizId = params.quizId;
  const quizName = searchParams.get("name") || "Quiz";

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const fetchQuizDetails = async () => {
    try {
      setLoading(true);
      const idToken = await getIdToken();
      const response = await fetch(`${API_URL}/api/quiz-history?id=${quizId}`, {
        headers: {
          ...(idToken && { Authorization: `Bearer ${idToken}` }),
        },
      });
      const data = await response.json();

      if (data.success) {
        setQuiz(data.history);
      } else {
        // Quiz not found, redirect to history
        router.push("/history");
      }
    } catch (error) {
      console.error("Error fetching quiz details:", error);
      router.push("/history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated" && quizId) {
      fetchQuizDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, quizId]);

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (ms) => {
    if (!ms || ms === 0) return "Not recorded";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getScoreBadgeColor = (percentage) => {
    if (percentage >= 80) return "bg-green-100 text-green-800";
    if (percentage >= 60) return "bg-blue-100 text-blue-800";
    if (percentage >= 40) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  if (status === "loading" || loading) {
    return <Loader message="Loading quiz details" />;
  }

  if (!quiz) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-xl text-gray-600">Quiz not found</div>
      </div>
    );
  }

  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-xl text-gray-600">No quiz data available</div>
      </div>
    );
  }

  const currentQuestion = quiz.questions?.[currentQuestionIndex];
  const isCorrect = currentQuestion?.isCorrect;
  const correctAnswers = quiz.score || 0;

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.push("/history")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#135bec] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </button>

        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="mb-2 break-words text-2xl font-bold text-gray-900 sm:text-3xl">
                {quiz.quizTitle}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(quiz.completedAt)}
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {formatTime(quiz.totalTime)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              <span
                className={`px-4 py-2 text-lg font-semibold rounded-full ${getScoreBadgeColor(
                  quiz.percentage,
                )}`}
              >
                {quiz.percentage}%
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Total Questions</p>
              <p className="text-2xl font-bold text-gray-900">
                {quiz.totalQuestions}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Correct</p>
              <p className="text-2xl font-bold text-green-600">
                {correctAnswers}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Incorrect</p>
              <p className="text-2xl font-bold text-red-600">
                {quiz.totalQuestions - correctAnswers}
              </p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Accuracy</p>
              <p className="text-2xl font-bold text-blue-600">
                {quiz.percentage}%
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Time Taken</p>
              <p className="text-xl font-bold text-purple-600">
                {formatTime(quiz.totalTime)}
              </p>
            </div>
          </div>
        </div>

        {/* Question Navigation Indicator */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                Question {currentQuestionIndex + 1} of {quiz.totalQuestions}
              </p>
              <p className="text-xs text-gray-500">
                Tap numbers to jump to questions
              </p>
            </div>

            {/* Scrollable question buttons container */}
            <div className="relative">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {quiz.questions?.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`min-w-[40px] h-10 flex-shrink-0 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      idx === currentQuestionIndex
                        ? "bg-[#135bec] text-white scale-105 shadow-lg"
                        : q.isCorrect
                          ? "bg-green-100 text-green-700 hover:bg-green-200 hover:scale-105"
                          : "bg-red-100 text-red-700 hover:bg-red-200 hover:scale-105"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
            <div
              className="bg-[#135bec] h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  ((currentQuestionIndex + 1) / quiz.totalQuestions) * 100
                }%`,
              }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-xl shadow-md p-6 md:p-8"
        >
          <div className="space-y-6">
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
                        <p className="font-medium text-red-800">Your Answer</p>
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
          </div>

          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between items-center">
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-[#135bec]/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <span className="text-sm text-gray-500">
              {currentQuestionIndex + 1} / {quiz.totalQuestions}
            </span>

            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
              disabled={currentQuestionIndex === quiz.totalQuestions - 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-[#135bec]/10 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Summary Section */}
        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Correct Answers</p>
                <p className="text-xl font-bold text-green-600">
                  {correctAnswers}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-lg">
              <XCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-gray-600">Wrong Answers</p>
                <p className="text-xl font-bold text-red-600">
                  {quiz.totalQuestions - correctAnswers}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Target className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-xl font-bold text-blue-600">
                  {quiz.percentage}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
