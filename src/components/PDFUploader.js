"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, Loader2, Sparkles, Zap } from "lucide-react";

// Minimum questions required is 5, no maximum limit
const MIN_QUESTIONS = 5;

// Test demo questions - no API call needed
const TEST_DEMO_QUESTIONS = [
  {
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Markup Language",
      "Home Tool Markup Language",
      "Hyperlinks and Text Markup Language",
      "Hyperlinking Text Marking Language",
    ],
    answer: "Hyper Text Markup Language",
    correctAnswer: 0, // Index of the correct answer
  },
  {
    question: "Which CSS property is used to change the text color?",
    options: ["text-color", "color", "font-color", "text-style"],
    answer: "color",
    correctAnswer: 1,
  },
  {
    question:
      "What is the correct syntax for referring to an external JavaScript file?",
    options: [
      '<script src="script.js">',
      '<script href="script.js">',
      '<script name="script.js">',
      '<script file="script.js">',
    ],
    answer: '<script src="script.js">',
    correctAnswer: 0,
  },
  {
    question: "Which HTML tag is used to define an unordered list?",
    options: ["<ol>", "<ul>", "<list>", "<li>"],
    answer: "<ul>",
    correctAnswer: 1,
  },
  {
    question: "What does CSS stand for?",
    options: [
      "Cascading Style Sheets",
      "Creative Style Sheets",
      "Computer Style Sheets",
      "Colorful Style Sheets",
    ],
    answer: "Cascading Style Sheets",
    correctAnswer: 0,
  },
  {
    question: "Which JavaScript method is used to select an element by its ID?",
    options: [
      "getElementById()",
      "getElementByClass()",
      "querySelector()",
      "selectElement()",
    ],
    answer: "getElementById()",
    correctAnswer: 0,
  },
  {
    question: "What is the correct HTML tag for the largest heading?",
    options: ["<h6>", "<head>", "<h1>", "<heading>"],
    answer: "<h1>",
    correctAnswer: 2,
  },
  {
    question: "Which property is used to change the font of an element in CSS?",
    options: ["font-family", "font-style", "text-font", "typeface"],
    answer: "font-family",
    correctAnswer: 0,
  },
  {
    question: "What is the default value of the position property in CSS?",
    options: ["static", "relative", "absolute", "fixed"],
    answer: "static",
    correctAnswer: 0,
  },
  {
    question: "Which symbol is used for single-line comments in JavaScript?",
    options: ["//", "/*", "#", "<!--"],
    answer: "//",
    correctAnswer: 0,
  },
];

export default function PDFUploader({ onQuizGenerated }) {
  const [file, setFile] = useState(null);
  const [quizName, setQuizName] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploadedPdfUrl, setUploadedPdfUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Auto-upload PDF when file is selected
  const autoUploadPDF = async (fileToUpload) => {
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", fileToUpload);

      console.log(
        `📤 Auto-uploading PDF: ${fileToUpload.name} (${(
          fileToUpload.size /
          1024 /
          1024
        ).toFixed(2)} MB)`
      );

      const response = await fetch("/api/upload-pdf-only", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload PDF");
      }

      setUploadedPdfUrl(data.pdfUrl);
      console.log(`✅ PDF uploaded successfully to Cloudinary`);
      setError("");
    } catch (err) {
      console.error("❌ Auto-upload failed:", err);
      setError(err.message);
      setUploadedPdfUrl(null);
      setFile(null); // Clear file on upload failure
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        // Validate file size (50MB max)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (droppedFile.size > maxSize) {
          setError("File size must be less than 50MB");
          return;
        }

        setFile(droppedFile);
        setUploadedPdfUrl(null);
        setError("");

        // Auto-upload the PDF immediately
        await autoUploadPDF(droppedFile);
      } else {
        setError("Please upload a PDF file");
      }
    }
  };
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === "application/pdf") {
        // Validate file size (50MB max)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (selectedFile.size > maxSize) {
          setError("File size must be less than 50MB");
          return;
        }

        setFile(selectedFile);
        setUploadedPdfUrl(null); // Reset uploaded state when new file selected
        setError("");

        // Auto-upload the PDF immediately
        await autoUploadPDF(selectedFile);
      } else {
        setError("Please upload a PDF file");
      }
    }
  };

  const handleUploadPdf = async () => {
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf") {
        // Validate file size (50MB max)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (droppedFile.size > maxSize) {
          setError("File size must be less than 50MB");
          return;
        }

        setFile(droppedFile);
        setUploadedPdfUrl(null);
        setError("");

        // Auto-upload the PDF immediately
        await autoUploadPDF(droppedFile);
      } else {
        setError("Please upload a PDF file");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!uploadedPdfUrl) {
      setError("Please upload the PDF first");
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
      const response = await fetch("/api/generate-quiz-from-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pdfUrl: uploadedPdfUrl,
          quizName,
          numberOfQuestions: numQuestions,
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

  const handleTestDemo = () => {
    // Instantly load test demo questions without API call
    const metadata = {
      title: quizName.trim() || "Test Demo Quiz",
      topic: "Web Development Basics",
      difficulty: "medium",
      questionCount: 10,
      source: "test-demo",
    };

    onQuizGenerated(TEST_DEMO_QUESTIONS, metadata);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Quiz Name Input */}
      <div>
        <label
          className="block text-sm font-medium text-slate-700 mb-2"
          htmlFor="quiz-name"
        >
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
            : uploadedPdfUrl
            ? "border-green-500 bg-green-50"
            : "border-slate-300 hover:border-slate-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {file ? (
          <div className="w-full space-y-4">
            <div className="flex items-center justify-center gap-3">
              <FileText
                className={`w-8 h-8 ${
                  uploadedPdfUrl ? "text-green-600" : "text-[#135bec]"
                }`}
              />
              <span className="text-slate-700 font-medium">{file.name}</span>
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setUploadedPdfUrl(null);
                }}
                disabled={uploading || loading}
                className="ml-2 text-red-500 hover:text-red-700 text-sm underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Remove
              </button>
            </div>

            {uploading ? (
              <div className="flex items-center justify-center gap-2 text-[#135bec]">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">
                  Uploading to Cloudinary...
                </span>
              </div>
            ) : uploadedPdfUrl ? (
              <div className="flex items-center justify-center gap-2 text-green-600">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="text-sm font-medium">
                  PDF Uploaded Successfully to Cloudinary!
                </span>
              </div>
            ) : null}
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

      {/* Number of Questions */}
      <div>
        <label
          className="block text-sm font-medium text-slate-700 mb-2"
          htmlFor="num-questions-pdf"
        >
          Number of Questions
        </label>
        <input
          type="number"
          id="num-questions-pdf"
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
        {!uploadedPdfUrl && file && (
          <p className="text-xs text-slate-500 italic">
            Please upload the PDF first before generating quiz
          </p>
        )}
        {!file && (
          <p className="text-xs text-slate-500 italic">
            Please select a PDF file to continue
          </p>
        )}
        <div className="flex gap-3 w-full justify-end">
          {/* Test Demo Button */}
          <button
            type="button"
            onClick={handleTestDemo}
            disabled={loading || uploading}
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-md"
          >
            <Zap className="w-5 h-5" />
            Test Demo
          </button>

          {/* Generate Quiz Button */}
          <button
            type="submit"
            disabled={loading || uploading || !uploadedPdfUrl}
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
      </div>
    </form>
  );
}
