"use client";

import { motion } from "framer-motion";
import { FileText, Sparkles } from "lucide-react";

export default function QuizSourceSelection({ onSelectSource }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-4xl mx-auto p-8"
    >
      <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center">
        How do you want to create your quiz?
      </h2>
      <p className="text-gray-600 text-center mb-12">
        Choose to upload a PDF document or let AI generate questions on any
        topic
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* PDF Upload Option */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectSource("pdf")}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all"
        >
          <FileText className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Upload PDF</h3>
          <p className="text-blue-100">
            Generate quiz questions from your PDF document
          </p>
          <ul className="text-left text-sm text-blue-100 mt-4 space-y-1">
            <li>✓ Study materials</li>
            <li>✓ Research papers</li>
            <li>✓ Textbook chapters</li>
          </ul>
        </motion.button>

        {/* AI Generation Option */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectSource("ai")}
          className="bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all"
        >
          <Sparkles className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">AI Generation</h3>
          <p className="text-purple-100">
            Let AI create quiz questions on any topic
          </p>
          <ul className="text-left text-sm text-purple-100 mt-4 space-y-1">
            <li>✓ Any topic you choose</li>
            <li>✓ Custom difficulty level</li>
            <li>✓ Instant generation</li>
          </ul>
        </motion.button>
      </div>
    </motion.div>
  );
}
