"use client";

import React from "react";

export default function QuizDisplay({ quiz }) {
  if (!quiz || !Array.isArray(quiz) || quiz.length === 0) {
    return <div className="text-sm text-slate-600">No quiz available.</div>;
  }

  return (
    <div className="space-y-6">
      {quiz.map((q, idx) => (
        <div key={idx} className="p-4 border rounded-lg bg-white">
          <div className="font-semibold">{idx + 1}. {q.question || q.prompt || "Question"}</div>
          {q.options && Array.isArray(q.options) && (
            <ul className="mt-2 list-disc list-inside text-sm text-slate-700">
              {q.options.map((opt, i) => (
                <li key={i} className={`py-1 ${q.correctAnswer === i || q.correctAnswer === opt ? "text-green-700 font-medium" : ""}`}>
                  {opt}
                </li>
              ))}
            </ul>
          )}
          {q.explanation && <div className="mt-2 text-xs text-slate-500">Explanation: {q.explanation}</div>}
        </div>
      ))}
    </div>
  );
}
