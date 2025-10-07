"use client";

import { motion } from "framer-motion";
import { Clock, Users, Trophy, Target, Award } from "lucide-react";

export default function WaitingForResults({ roomCode, playerStats }) {
  const {
    correctAnswers = 0,
    totalQuestions = 10,
    totalTime = 0,
    avgTime = 0,
  } = playerStats || {};

  const percentage =
    totalQuestions > 0
      ? Math.round((correctAnswers / totalQuestions) * 100)
      : 0;

  const formatTime = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };

  const getPerformanceMessage = () => {
    if (percentage >= 90)
      return { text: "Outstanding! 🌟", color: "text-green-600" };
    if (percentage >= 75)
      return { text: "Great Job! 🎯", color: "text-blue-600" };
    if (percentage >= 60)
      return { text: "Good Effort! 👍", color: "text-purple-600" };
    return { text: "Keep Practicing! 💪", color: "text-orange-600" };
  };

  const performance = getPerformanceMessage();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto p-8"
    >
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-6"
        >
          <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-12 h-12 text-green-600" />
          </div>
        </motion.div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Quiz Completed! 🎉
        </h2>

        <p className={`text-2xl font-bold mb-6 ${performance.color}`}>
          {performance.text}
        </p>

        {/* Score Display */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl p-8 mb-6 text-white">
          <div className="text-6xl font-bold mb-2">{percentage}%</div>
          <div className="text-2xl mb-4">
            {correctAnswers} out of {totalQuestions} correct
          </div>
          <div className="flex items-center justify-center gap-6 text-sm opacity-90">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Total: {formatTime(totalTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <span>Avg: {formatTime(avgTime)}/q</span>
            </div>
          </div>
        </div>

        {/* Waiting Animation */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <Users className="w-6 h-6 text-purple-600" />
          <div className="flex gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0 }}
              className="w-3 h-3 bg-purple-600 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
              className="w-3 h-3 bg-purple-600 rounded-full"
            />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
              className="w-3 h-3 bg-purple-600 rounded-full"
            />
          </div>
        </div>

        <p className="text-gray-500 text-sm mb-8">
          Waiting for other players to finish...
        </p>

        {/* Info Card */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <Award className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <p className="text-blue-900 font-medium mb-2">
            Final ranking will be shown when all players complete
          </p>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>✓ Ranked by correct answers</li>
            <li>✓ Tiebreaker: Fastest time wins</li>
          </ul>
        </div>

        {/* Room Code */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">Room Code</p>
          <p className="text-lg font-mono font-bold text-gray-700">
            {roomCode}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
