"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2 } from "lucide-react";

// Minimum questions required is 5, no maximum limit
const MIN_QUESTIONS = 5;

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
    const numQuestions = parseInt(numberOfQuestions) || MIN_QUESTIONS;
    if (numQuestions < MIN_QUESTIONS) {
      setError(`Please enter at least ${MIN_QUESTIONS} questions`);
      setNumberOfQuestions(MIN_QUESTIONS);
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
          quizName: quizName.trim(),
          topic: topic.trim(),
          numberOfQuestions: numQuestions,
          difficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz");
      }

      onQuizGenerated(data.quiz, data.metadata);
    } catch (err) {
      setError(err.message);
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
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#135bec] focus:border-[#135bec] placeholder:text-slate-400 p-3 transition-all"
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
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#135bec] focus:border-[#135bec] placeholder:text-slate-400 resize-none p-3 transition-all"
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
          value={numberOfQuestions}
          onChange={(e) => {
            const value = e.target.value;
            // Allow empty string while typing
            if (value === "") {
              setNumberOfQuestions("");
              return;
            }
            // Parse and validate
            const numValue = parseInt(value);
            if (!isNaN(numValue)) {
              setNumberOfQuestions(numValue);
            }
          }}
          onBlur={(e) => {
            // Ensure minimum value on blur
            const value = parseInt(e.target.value);
            if (isNaN(value) || value < MIN_QUESTIONS) {
              setNumberOfQuestions(MIN_QUESTIONS);
            }
          }}
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#135bec] focus:border-[#135bec] p-3 transition-all"
          disabled={loading}
        />
        <p className="mt-1 text-xs text-slate-500">
          Minimum {MIN_QUESTIONS} questions (no maximum)
        </p>
      </div>

      {/* Difficulty Level */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Difficulty Level
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setDifficulty("easy")}
            disabled={loading}
            className={`py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
              difficulty === "easy"
                ? "bg-[#135bec] text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Easy
          </button>
          <button
            type="button"
            onClick={() => setDifficulty("medium")}
            disabled={loading}
            className={`py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
              difficulty === "medium"
                ? "bg-[#135bec] text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Medium
          </button>
          <button
            type="button"
            onClick={() => setDifficulty("hard")}
            disabled={loading}
            className={`py-2.5 px-4 rounded-lg font-semibold transition-all duration-200 cursor-pointer ${
              difficulty === "hard"
                ? "bg-[#135bec] text-white shadow-md"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Hard
          </button>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Powered by Groq AI (LLaMA 3.3 70B)
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
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
        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#135bec] text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
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
        </button>
      </div>
    </form>
  );
}
