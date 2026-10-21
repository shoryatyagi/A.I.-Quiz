"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 20;

export default function AIQuizGenerator({ onQuizGenerated }) {
  const [quizName, setQuizName] = useState("");
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

    // Ensure numberOfQuestions is a valid number
    const numQuestions = Number(numberOfQuestions);
    if (!Number.isInteger(numQuestions) || numQuestions < MIN_QUESTIONS || numQuestions > MAX_QUESTIONS) {
      setError(`Choose a whole number from ${MIN_QUESTIONS} to ${MAX_QUESTIONS}`);
      return;
    }

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quizName: quizName.trim(),
          topic: topic.trim(),
          numberOfQuestions: numQuestions,
          difficulty,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz");
      }

      if (!Array.isArray(data.quiz) || data.quiz.length !== numQuestions) {
        throw new Error("The server returned an incomplete quiz. Please try again.");
      }

      onQuizGenerated(data.quiz, data.metadata);
    } catch (err) {
      setError(err.message || "Unable to generate the quiz. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleGenerate} className="space-y-6">
      {/* Quiz Name Input */}
      <div>
        <label
          className="block text-sm font-medium text-slate-700 mb-2"
          htmlFor="quiz-name-ai"
        >
          Quiz Name
        </label>
        <input
          type="text"
          id="quiz-name-ai"
          value={quizName}
          onChange={(e) => setQuizName(e.target.value)}
          placeholder="Enter a name for your quiz (optional)"
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#7438dc] focus:border-[#7438dc] placeholder:text-slate-400 p-3 transition-all"
          disabled={loading}
        />
      </div>

      {/* AI Prompt */}
      <div>
        <label
          className="block text-sm font-medium text-slate-700 mb-2"
          htmlFor="ai-prompt"
        >
          Topic / Description
        </label>
        <textarea
          id="ai-prompt"
          name="ai-prompt"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g., 'Java programming language' or 'History of the internet' or 'Photosynthesis in plants'"
          rows="4"
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#7438dc] focus:border-[#7438dc] placeholder:text-slate-400 resize-none p-3 transition-all"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-slate-500">
          Enter the topic you want to create a quiz about. Don&apos;t include
          the number of questions here.
        </p>
      </div>

      {/* Number of Questions */}
      <div>
        <label
          className="block text-sm font-medium text-slate-700 mb-2"
          htmlFor="num-questions-ai"
        >
          Number of Questions
        </label>
        <input
          type="number"
          id="num-questions-ai"
          min={MIN_QUESTIONS}
          max={MAX_QUESTIONS}
          step={1}
          value={numberOfQuestions}
          onChange={(e) => {
            const value = e.target.value;
            // Allow empty string while typing
            if (value === "") {
              setNumberOfQuestions("");
              return;
            }
            // Parse and validate
            const numValue = Number(value);
            if (Number.isInteger(numValue)) {
              setNumberOfQuestions(numValue);
            }
          }}
          onBlur={(e) => {
            // Ensure minimum value on blur
            const value = parseInt(e.target.value);
            if (isNaN(value) || value < MIN_QUESTIONS) {
              setNumberOfQuestions(MIN_QUESTIONS);
            } else if (value > MAX_QUESTIONS) {
              setNumberOfQuestions(MAX_QUESTIONS);
            }
          }}
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#7438dc] focus:border-[#7438dc] p-3 transition-all"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-slate-500">
          Choose {MIN_QUESTIONS}–{MAX_QUESTIONS} questions
        </p>
      </div>

      {/* Difficulty Level */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Difficulty Level
        </label>
        <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3">
          <motion.button
            type="button"
            whileHover={!loading ? { y: -2 } : undefined}
            whileTap={!loading ? { scale: 0.97 } : undefined}
            aria-pressed={difficulty === "easy"}
            onClick={() => setDifficulty("easy")}
            disabled={loading}
            className={`py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
              difficulty === "easy"
                ? "bg-[#7438dc] text-white shadow-md"
                : "bg-[#f2edfb] text-[#5f5872] hover:bg-[#e8def8]"
            }`}
          >
            Easy
          </motion.button>
          <motion.button
            type="button"
            whileHover={!loading ? { y: -2 } : undefined}
            whileTap={!loading ? { scale: 0.97 } : undefined}
            aria-pressed={difficulty === "medium"}
            onClick={() => setDifficulty("medium")}
            disabled={loading}
            className={`py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
              difficulty === "medium"
                ? "bg-[#7438dc] text-white shadow-md"
                : "bg-[#f2edfb] text-[#5f5872] hover:bg-[#e8def8]"
            }`}
          >
            Medium
          </motion.button>
          <motion.button
            type="button"
            whileHover={!loading ? { y: -2 } : undefined}
            whileTap={!loading ? { scale: 0.97 } : undefined}
            aria-pressed={difficulty === "hard"}
            onClick={() => setDifficulty("hard")}
            disabled={loading}
            className={`py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
              difficulty === "hard"
                ? "bg-[#7438dc] text-white shadow-md"
                : "bg-[#f2edfb] text-[#5f5872] hover:bg-[#e8def8]"
            }`}
          >
            Hard
          </motion.button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Powered by Groq AI
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          role="alert"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
        >
          {error}
        </motion.div>
      )}

      {/* Generate Button */}
      <div className="flex flex-col items-end gap-2">
        {!topic.trim() && (
          <p className="text-xs text-slate-500 italic">
            Please enter an AI prompt to continue
          </p>
        )}
        <motion.button
          type="submit"
          whileHover={!loading && topic.trim() ? { y: -2, scale: 1.015 } : undefined}
          whileTap={!loading && topic.trim() ? { scale: 0.98 } : undefined}
          disabled={loading || !topic.trim()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#7438dc] text-white font-extrabold rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-[0_12px_24px_-14px_rgba(88,37,172,0.75)]"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Quiz...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Quiz
            </>
          )}
        </motion.button>
      </div>
    </form>
  );
}
