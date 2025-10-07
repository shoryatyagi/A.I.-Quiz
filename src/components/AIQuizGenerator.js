"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, Brain } from "lucide-react";

export default function AIQuizGenerator({ onQuizGenerated }) {
  const [topic, setTopic] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!topic.trim()) {
      setError("Please enter a topic");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic.trim(),
          numberOfQuestions,
          difficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz");
      }

      onQuizGenerated(data.quiz, {
        topic,
        numberOfQuestions,
        difficulty,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto p-8"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-3 rounded-xl">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              AI Quiz Generator
            </h2>
            <p className="text-sm text-gray-600">Powered by DeepSeek V3.1</p>
          </div>
        </div>

        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Topic Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Quiz Topic *
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Artificial Intelligence, World History, Python Programming..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter any topic you want to be quizzed on
            </p>
          </div>

          {/* Number of Questions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Number of Questions
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="20"
                value={numberOfQuestions}
                onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                className="flex-1"
                disabled={loading}
              />
              <span className="text-2xl font-bold text-purple-600 w-12 text-center">
                {numberOfQuestions}
              </span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5 questions</span>
              <span>20 questions</span>
            </div>
          </div>

          {/* Difficulty Level */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDifficulty("easy")}
                disabled={loading}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  difficulty === "easy"
                    ? "bg-green-500 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Easy
              </button>
              <button
                type="button"
                onClick={() => setDifficulty("medium")}
                disabled={loading}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  difficulty === "medium"
                    ? "bg-yellow-500 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setDifficulty("hard")}
                disabled={loading}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  difficulty === "hard"
                    ? "bg-red-500 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Hard
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              <strong>Easy:</strong> Basic concepts &nbsp;|&nbsp;
              <strong>Medium:</strong> Moderate complexity &nbsp;|&nbsp;
              <strong>Hard:</strong> Advanced topics
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            type="submit"
            disabled={loading || !topic.trim()}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 px-6 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5" />
                Generate Quiz with AI
              </>
            )}
          </button>

          <p className="text-xs text-gray-500 text-center">
            AI will create {numberOfQuestions} {difficulty} level questions
            about {topic || "your topic"}
          </p>
        </form>
      </div>
    </motion.div>
  );
}
