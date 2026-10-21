"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Loader2, Sparkles, AlertCircle } from "lucide-react";

const MIN_QUESTIONS = 5;
const MAX_QUESTIONS = 50;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function PDFChunkUploader({ onQuizGenerated }) {
  const [file, setFile] = useState(null);
  const [quizName, setQuizName] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile) => {
    if (!selectedFile) {
      setError("Please select a file");
      return false;
    }

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please select a PDF file");
      return false;
    }

    if (selectedFile.size === 0) {
      setError("This file is empty. Please select a different PDF.");
      return false;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("File size cannot exceed 5MB");
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    // Clear the native input so selecting the same file again triggers change.
    e.target.value = "";
    if (!selectedFile || loading) return;
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setError("");
    } else {
      setFile(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (loading) return;

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setError("");
    } else if (droppedFile) {
      setFile(null);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError("");

    if (!file) {
      setError("Please select a PDF file");
      return;
    }

    const numQuestions = Number(numberOfQuestions);
    if (!Number.isInteger(numQuestions) || numQuestions < MIN_QUESTIONS || numQuestions > MAX_QUESTIONS) {
      setError(`Choose a whole number from ${MIN_QUESTIONS} to ${MAX_QUESTIONS}`);
      return;
    }

    if (loading) return;
    setLoading(true);
    setUploadProgress(20);

    try {
      // Create FormData for PDF upload
      const formData = new FormData();
      formData.append("file", file);
      formData.append("numberOfQuestions", numQuestions.toString());

      setUploadProgress(40);

      // Upload PDF and get chunks
      const uploadResponse = await fetch("/api/process-pdf-chunks", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(60);

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to process PDF");
      }

      const { chunks } = await uploadResponse.json().catch(() => ({}));

      if (!chunks || chunks.length === 0) {
        throw new Error("No text extracted from PDF");
      }

      setUploadProgress(80);

      // Generate quiz from selected chunks
      const quizResponse = await fetch("/api/generate-quiz-from-pdf-chunks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chunks,
          numberOfQuestions: numQuestions,
          quizName: quizName.trim() || file.name.replace(/\.pdf$/i, ""),
        }),
      });

      if (!quizResponse.ok) {
        const errorData = await quizResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate quiz");
      }

      const { quiz, metadata } = await quizResponse.json().catch(() => ({}));
      if (!Array.isArray(quiz) || quiz.length !== numQuestions) {
        throw new Error("The server returned an incomplete quiz. Please try again.");
      }

      setUploadProgress(100);
      onQuizGenerated(quiz, metadata);
    } catch (err) {
      console.error("Error generating quiz:", err);
      setError(err.message || "Unable to generate a quiz from this PDF. Check your connection and try again.");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <form onSubmit={handleGenerate} className="space-y-6">
      <div>
        <label htmlFor="pdf-quiz-name" className="block text-sm font-medium text-slate-700 mb-2">
          Quiz Name (Optional)
        </label>
        <input
          id="pdf-quiz-name"
          type="text"
          value={quizName}
          onChange={(e) => setQuizName(e.target.value)}
          placeholder="Enter quiz title"
          className="w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-[#7438dc] focus:border-transparent"
          disabled={loading}
        />
      </div>

      <motion.div
        animate={{ scale: dragActive ? 1.012 : 1 }}
        transition={{ type: "spring", stiffness: 320, damping: 24 }}
        className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-all sm:p-12 ${
          dragActive
            ? "border-[#7438dc] bg-[#7438dc]/5"
            : file
            ? "border-[#63d8b5] bg-[#effdf8]"
            : "border-[#d9cdea] bg-[#fbfaff] hover:border-[#a98ae8]"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="w-full text-center space-y-3">
            <FileText className="w-12 h-12 text-green-600 mx-auto" />
            <div>
            <p className="break-all text-slate-700 font-medium">{file.name}</p>
              <p className="text-sm text-slate-500 mt-1">
                {(file.size / 1024).toFixed(2)} KB
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setError("");
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
              disabled={loading}
            >
              Remove file
            </button>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 text-slate-400 mb-4" />
            <p className="text-lg font-semibold text-slate-700">
              Drag and drop a PDF file
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Maximum file size: 5MB
            </p>
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading}
            />
            <motion.label
              htmlFor="pdf-upload"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-[#7438dc] text-white font-extrabold rounded-2xl hover:bg-[#5a24bb] transition-colors cursor-pointer"
            >
              <Upload className="w-5 h-5" />
              Browse Files
            </motion.label>
          </>
        )}
      </motion.div>

      <div>
        <label htmlFor="pdf-num-questions" className="block text-sm font-medium text-slate-700 mb-2">
          Number of Questions
        </label>
        <input
          id="pdf-num-questions"
          type="number"
          min={MIN_QUESTIONS}
          max={MAX_QUESTIONS}
          step={1}
          value={numberOfQuestions}
          onChange={(e) => {
            const value = e.target.value;
            setNumberOfQuestions(value);
            setError("");
          }}
          onBlur={() => {
            const value = Number(numberOfQuestions);
            if (!Number.isInteger(value) || value < MIN_QUESTIONS) {
              setNumberOfQuestions(MIN_QUESTIONS);
            } else if (value > MAX_QUESTIONS) {
              setNumberOfQuestions(MAX_QUESTIONS);
            }
          }}
          className="w-full rounded-lg border border-slate-300 p-3 focus:ring-2 focus:ring-[#7438dc] focus:border-transparent"
          disabled={loading}
        />
        <p className="mt-2 text-xs text-slate-500">
          Choose {MIN_QUESTIONS}–{MAX_QUESTIONS} questions. Each question will
          use one chunk from your PDF.
        </p>
      </div>

      {error && (
        <motion.div
          role="alert"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </motion.div>
      )}

      {loading && uploadProgress > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Processing...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="bg-[#7438dc] h-2 rounded-full transition-all"
            />
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !file}
        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#7438dc] text-white font-extrabold rounded-2xl hover:bg-[#5a24bb] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Quiz...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Generate Quiz from PDF
          </>
        )}
      </button>
    </form>
  );
}
