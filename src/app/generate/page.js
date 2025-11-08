"use client";

import { useState } from "react";
import QuizCreator from "@/components/QuizCreator";
import QuizDisplay from "@/components/QuizDisplay";

export default function GeneratePage() {
  const [quiz, setQuiz] = useState(null);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {!quiz && (
          <QuizCreator onQuizGenerated={(q) => setQuiz(q)} />
        )}

        {quiz && (
          <div>
            <button className="mb-6 text-sm text-slate-600 underline" onClick={() => setQuiz(null)}>Create another quiz</button>
            <QuizDisplay quiz={quiz} />
          </div>
        )}
      </div>
    </div>
  );
}
