"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";

const MAX_QUESTIONS = parseInt(process.env.NEXT_PUBLIC_MAX_QUESTIONS_PDF) || 50;

export default function PDFUploader({ onQuizGenerated }) {
  const [file, setFile] = useState(null);
  const [quizName, setQuizName] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile);
        setError("");
      } else {
        setError("Please upload a PDF file");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        setError("");
      } else {
        setError("Please upload a PDF file");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("quizName", quizName);
      formData.append("numberOfQuestions", numberOfQuestions.toString());

      const response = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quiz Name Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2" htmlFor="quiz-name">
          Quiz Name
        </label>
        <input
          type="text"
          id="quiz-name"
          value={quizName}
          onChange={(e) => setQuizName(e.target.value)}
          placeholder="Enter a name for your quiz (optional)"
          className="w-full rounded-lg border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-[#135bec] focus:border-[#135bec] placeholder:text-slate-400 p-3 transition-all"
        />
      </div>

      {/* Drag and Drop Area */}
      <div
        className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-12 text-center transition-all ${
          dragActive
            ? "border-[#135bec] bg-[#135bec]/5"
            : "border-slate-300 hover:border-slate-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="w-8 h-8 text-[#135bec]" />
            <span className="text-slate-700 font-medium">{file.name}</span>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="ml-2 text-red-500 hover:text-red-700 text-sm underline cursor-pointer"
            >
              Remove
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-lg font-semibold text-slate-700">
              Drag and drop your PDF here
            </p>
            <p className="mt-1 text-sm text-slate-500">or</p>
            <input
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              id="pdf-upload"
            />
            <label
              htmlFor="pdf-upload"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#135bec]/10 text-[#135bec] font-semibold rounded-lg hover:bg-[#135bec]/20 transition-colors cursor-pointer"
            >
              Browse Files
            </label>
          </>
        )}
      </div>

      {/* Number of Questions Slider */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Number of Questions:{" "}
          <span className="text-[#135bec] font-bold">{numberOfQuestions}</span>
        </label>
        <input
          type="range"
          min="5"
          max={MAX_QUESTIONS}
          step="5"
          value={numberOfQuestions}
          onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>5</span>
          <span>{Math.floor(MAX_QUESTIONS * 0.5)}</span>
          <span>{MAX_QUESTIONS}</span>
        </div>
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

      {/* Submit Button */}
      <div className="flex flex-col items-end gap-2">
        {!file && (
          <p className="text-xs text-slate-500 italic">
            Please upload a PDF file to continue
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !file}
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
