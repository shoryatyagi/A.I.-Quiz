"use client";

import { motion } from "framer-motion";
import { useSession, signIn } from "next-auth/react";
import { User, Users, Lock } from "lucide-react";

export default function QuizMode({ onSelectMode }) {
  const { data: session, status } = useSession();

  const handleModeSelect = (mode) => {
    if (!session) {
      // Show sign-in prompt if not authenticated
      alert("Please sign in with Google to create or join a quiz!");
      signIn("google");
      return;
    }
    onSelectMode(mode);
  };

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

      {!session && (
        <div className="mb-8 p-4 bg-yellow-50 border-2 border-yellow-300 rounded-xl">
          <div className="flex items-center gap-3 justify-center text-yellow-800">
            <Lock className="w-5 h-5" />
            <p className="font-semibold">
              Please sign in with Google to create or join a quiz
            </p>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Solo Mode */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleModeSelect("solo")}
          className={`bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all ${
            !session ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          <div className="relative">
            {!session && (
              <div className="absolute -top-2 -right-2">
                <Lock className="w-6 h-6 text-yellow-300" />
              </div>
            )}
            <User className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Solo Mode</h3>
          <p className="text-blue-100">
            Play at your own pace and challenge yourself
          </p>
        </motion.button>

        {/* Multiplayer Mode */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleModeSelect("multiplayer")}
          className={`bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all ${
            !session ? "opacity-75 cursor-not-allowed" : ""
          }`}
        >
          <div className="relative">
            {!session && (
              <div className="absolute -top-2 -right-2">
                <Lock className="w-6 h-6 text-yellow-300" />
              </div>
            )}
            <Users className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-2xl font-bold mb-2">Multiplayer Mode</h3>
          <p className="text-purple-100">Compete with friends in real-time</p>
        </motion.button>
      </div>
    </motion.div>
  );
}
