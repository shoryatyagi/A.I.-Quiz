"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock } from "lucide-react";

export default function QuizQuestion({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
  showFeedback = false,
}) {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [answered, setAnswered] = useState(false);

  // Reset state when question changes
  useEffect(() => {
    setSelectedAnswer(null);
    setAnswered(false);
    setStartTime(Date.now());
    setTimeSpent(0);
  }, [questionIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeSpent(Date.now() - startTime);
    }, 100);

    return () => clearInterval(timer);
  }, [startTime]);

  const handleAnswer = (answerIndex) => {
    if (answered) return;

    setSelectedAnswer(answerIndex);
    setAnswered(true);

    // Call onAnswer callback which will handle navigation
    onAnswer(answerIndex, timeSpent);
  };

  const getOptionClass = (index) => {
    if (!answered) {
      return "bg-white hover:bg-blue-50 border-gray-300 hover:border-blue-400";
    }

    if (index === selectedAnswer) {
      return "bg-blue-100 border-blue-500";
    }

    return "bg-gray-100 border-gray-300";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-3xl mx-auto p-8"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm font-semibold text-gray-600">
            Question {questionIndex + 1} of {totalQuestions}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">
              {(timeSpent / 1000).toFixed(1)}s
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{
              width: `${((questionIndex + 1) / totalQuestions) * 100}%`,
            }}
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          />
        </div>

        {/* Question */}
        <h3 className="text-2xl font-bold text-gray-800 mb-8">
          {question.question}
        </h3>

        {/* Options */}
        <div className="space-y-4 mb-6">
          {question.options.map((option, index) => (
            <motion.button
              key={index}
              whileHover={!answered ? { scale: 1.02 } : {}}
              whileTap={!answered ? { scale: 0.98 } : {}}
              onClick={() => handleAnswer(index)}
              disabled={answered}
              className={`w-full p-4 border-2 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer ${getOptionClass(
                index
              )}`}
            >
              <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-semibold">
                {String.fromCharCode(65 + index)}
              </div>
              <span className="flex-1 font-medium text-gray-800">{option}</span>
            </motion.button>
          ))}
        </div>

        {/* Moving to next question message */}
        {answered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-gray-600 text-sm"
          >
            Moving to next question...
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
