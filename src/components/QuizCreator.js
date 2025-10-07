"use client";

import { useState } from "react";
import PDFUploader from "./PDFUploader";
import AIQuizGenerator from "./AIQuizGenerator";

export default function QuizCreator({ onQuizGenerated }) {
  const [activeTab, setActiveTab] = useState("pdf"); // 'pdf' or 'ai'

  const handleTabChange = (tab) => {
    console.log("Switching to tab:", tab);
    setActiveTab(tab);
  };

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Create a New Quiz
        </h2>
        <p className="mt-4 text-lg text-slate-600">
          Generate a quiz from a PDF document or an AI prompt. Choose your
          preferred method below.
        </p>

        {/* Tab Selector */}
        <div className="mt-8">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleTabChange("pdf")}
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
                onClick={() => handleTabChange("ai")}
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
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
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
