"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import PDFUploader from "./PDFUploader";
import AIQuizGenerator from "./AIQuizGenerator";

export default function QuizCreator({ onQuizGenerated, onBack }) {
  const [activeTab, setActiveTab] = useState("ai"); // 'pdf' or 'ai'

  return (
    <main className="container mx-auto flex-grow px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#135bec] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        )}

        <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl md:text-4xl">
          Create a New Quiz
        </h2>
        <p className="mt-3 text-base text-slate-600 sm:mt-4 sm:text-lg">
          Generate a quiz from a PDF document or using AI prompt.
        </p>

        {/* Tab Selector */}
        <div className="mt-8">
          <div className="bg-white p-2 rounded-lg shadow-sm" role="tablist" aria-label="Quiz source">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "pdf"}
                aria-controls="quiz-source-panel"
                onClick={() => setActiveTab("pdf")}
                className={`text-sm font-semibold py-2.5 px-4 rounded-md transition-all duration-200 cursor-pointer ${
                  activeTab === "pdf"
                    ? "bg-[#135bec] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                From PDF
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "ai"}
                aria-controls="quiz-source-panel"
                onClick={() => setActiveTab("ai")}
                className={`text-sm font-semibold py-2.5 px-4 rounded-md transition-all duration-200 cursor-pointer ${
                  activeTab === "ai"
                    ? "bg-[#135bec] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                From AI Prompt
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          <div id="quiz-source-panel" role="tabpanel" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 md:p-8">
            {activeTab === "pdf" && (
              <PDFUploader onQuizGenerated={onQuizGenerated} />
            )}
            {activeTab === "ai" && (
              <AIQuizGenerator onQuizGenerated={onQuizGenerated} />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
