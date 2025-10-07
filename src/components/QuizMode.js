"use client";

import { motion } from "framer-motion";
import { User, Users } from "lucide-react";

export default function QuizMode({ onSelectMode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-4xl mx-auto p-8"
    >
      <h2 className="text-4xl font-bold text-gray-800 mb-4 text-center">
        Choose Quiz Mode
      </h2>
      <p className="text-gray-600 text-center mb-12">
        Play solo or invite friends for a multiplayer challenge!
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Solo Mode */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectMode("solo")}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all"
        >
          <User className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Solo Mode</h3>
          <p className="text-blue-100">
            Play at your own pace and challenge yourself
          </p>
        </motion.button>

        {/* Multiplayer Mode */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectMode("multiplayer")}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all"
        >
          <Users className="w-16 h-16 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Multiplayer Mode</h3>
          <p className="text-purple-100">Compete with friends in real-time</p>
        </motion.button>
      </div>
    </motion.div>
  );
}
