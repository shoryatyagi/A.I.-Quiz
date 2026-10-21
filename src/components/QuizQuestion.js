"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sparkles } from "lucide-react";

export default function QuizQuestion({
  question,
  questionNumber,
  totalQuestions,
  onAnswer,
  waitingForResponse = false,
  onExit,
  showFeedback = false,
}) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const startTimeRef = useRef(Date.now());
  const answeredRef = useRef(false);
  const [answered, setAnswered] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswered(false);
    answeredRef.current = false;
    startTimeRef.current = Date.now();
    setTimeSpent(0);
  }, [questionNumber]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Math.max(0, Date.now() - startTimeRef.current));
    }, 100);

    return () => clearInterval(timer);
  }, [questionNumber]);

  const handleAnswer = (answerIndex) => {
    if (answeredRef.current || answered) return;
    if (!Number.isInteger(answerIndex) || answerIndex < 0 || answerIndex >= question.options.length) return;

    answeredRef.current = true;
    setSelectedAnswer(answerIndex);
    setAnswered(true);

    const elapsed = Math.max(0, Date.now() - startTimeRef.current);
    setTimeSpent(elapsed);
    try {
      const accepted = onAnswer?.(answerIndex, elapsed);
      if (accepted === false) {
        answeredRef.current = false;
        setSelectedAnswer(null);
        setAnswered(false);
      }
    } catch (error) {
      console.error("Failed to submit answer:", error);
      answeredRef.current = false;
      setSelectedAnswer(null);
      setAnswered(false);
    }
  };

  const getOptionClass = (index) => {
    if (!answered) {
      return "bg-white hover:bg-violet-50 border-[#e6def2] hover:border-[#a98ae8]";
    }

    if (index === selectedAnswer) {
      return "bg-[#eee7ff] border-[#7438dc] text-[#4d248f]";
    }

    return "bg-gray-100 border-gray-300";
  };

  // ✅ Check for empty options before rendering
  const validQuestion =
    question &&
    typeof question.question === "string" &&
    question.question.trim() &&
    Array.isArray(question.options) &&
    question.options.length === 4 &&
    question.options.every((option) => typeof option === "string" && option.trim()) &&
    Number.isInteger(question.correctAnswer) &&
    question.correctAnswer >= 0 &&
    question.correctAnswer < question.options.length;
  const safeTotalQuestions = Number.isFinite(totalQuestions) && totalQuestions > 0
    ? totalQuestions
    : 1;

  if (!validQuestion) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto w-full max-w-3xl px-4 py-5 sm:p-6 md:p-8"
      >
        <div className="rounded-2xl border-2 border-red-400 bg-red-50 p-5 text-center shadow-xl sm:p-8" role="alert">
          <h3 className="text-xl font-bold text-red-600 mb-2">Question unavailable</h3>
          <p className="text-red-700 mb-4">
            This question has incomplete data and cannot be answered.
          </p>
          <p className="text-sm text-red-600 mb-4">
            Return home and try generating or joining the quiz again.
          </p>
          {onExit && (
            <button type="button" onClick={onExit} className="rounded-lg bg-[#7438dc] px-5 py-2.5 font-semibold text-white">
              Return home
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mx-auto w-full max-w-3xl px-4 py-5 sm:p-6 md:p-8"
    >
      <div className="rounded-[1.75rem] border border-[#e9e0f7] bg-white p-4 shadow-[0_22px_58px_-34px_rgba(61,34,110,0.5)] sm:p-6 md:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <div className="text-sm font-extrabold text-[#766d8e]">
            Question {questionNumber} of {totalQuestions}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">
              {(timeSpent / 1000).toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Progress Bar */}
          <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-[#eee8f7]">
          <motion.div
            role="progressbar"
            aria-label="Quiz progress"
            aria-valuemin={0}
            aria-valuemax={safeTotalQuestions}
            aria-valuenow={Math.min(questionNumber, safeTotalQuestions)}
            initial={{ width: 0 }}
            animate={{
              width: `${(questionNumber / safeTotalQuestions) * 100}%`,
            }}
            className="h-full bg-gradient-to-r from-[#8c54eb] to-[#6630c3]"
          />
        </div>

        {/* Question */}
        <h3 className="mb-6 text-xl font-bold text-gray-800 sm:mb-8 sm:text-2xl">
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-4 mb-6">
          {question.options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={!answered ? { scale: 1.02 } : {}}
              whileTap={!answered ? { scale: 0.98 } : {}}
              animate={{ scale: answered && selectedAnswer === index ? [1, 1.035, 1] : 1 }}
              transition={{ duration: 0.24 }}
              onClick={() => handleAnswer(index)}
              disabled={answered}
              aria-pressed={selectedAnswer === index}
              className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-left transition-all sm:items-center sm:p-4 ${getOptionClass(
                index
              )}`}
            >
              <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-semibold">
                {String.fromCharCode(65 + index)}
              </div>
              <span className="flex-1 font-medium text-gray-800">
                {option && option.trim() ? option : "(Empty option - Data Error)"}
              </span>
            </motion.button>
          ))}
        </div>

        {/* Moving to next question message */}
        {answered && (
          <motion.div
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 5, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="mx-auto flex w-fit items-center gap-2 rounded-full bg-[#f2edfb] px-4 py-2 text-sm font-bold text-[#5f378e]"
          >
            <Sparkles className="h-4 w-4 text-[#ad73eb]" aria-hidden="true" />
            {waitingForResponse ? "Answer sent — checking in…" : "Nice! Next question coming up…"}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
