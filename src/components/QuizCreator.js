"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import PDFUploader from "./PDFUploader";
import AIQuizGenerator from "./AIQuizGenerator";

export default function QuizCreator({ onQuizGenerated, onBack }) {
  const [activeTab, setActiveTab] = useState("ai"); // 'pdf' or 'ai'

  return (
    <main className="container mx-auto flex-grow px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#7438dc] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        )}

        <h2 className="text-3xl font-extrabold tracking-tight text-[#211b43] sm:text-4xl">
          Create a New Quiz
        </h2>
        <p className="mt-3 text-base font-semibold text-[#77718b] sm:mt-4 sm:text-lg">
          Generate a quiz from a PDF document or using AI prompt.
        </p>

        {/* Tab Selector */}
        <div className="mt-8">
          <div className="rounded-2xl border border-[#e9e0f7] bg-white p-2 shadow-[0_10px_30px_-24px_rgba(61,34,110,0.45)]" role="tablist" aria-label="Quiz source">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "pdf"}
                aria-controls="quiz-source-panel"
                onClick={() => setActiveTab("pdf")}
                className={`text-sm font-semibold py-2.5 px-4 rounded-md transition-all duration-200 cursor-pointer ${
                  activeTab === "pdf"
                    ? "bg-[#7438dc] text-white"
                    : "text-slate-600 hover:bg-[#f5f1fc]"
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
                    ? "bg-[#7438dc] text-white"
                    : "text-slate-600 hover:bg-[#f5f1fc]"
                }`}
              >
                From AI Prompt
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          <div id="quiz-source-panel" role="tabpanel" className="rounded-[1.75rem] border border-[#e9e0f7] bg-white p-4 shadow-[0_20px_55px_-36px_rgba(61,34,110,0.45)] sm:p-6 md:p-8">
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
