"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex-grow flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-purple-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center"
      >
        {/* 404 Illustration */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="mb-8"
        >
          <div className="relative">
            {/* Large 404 Text */}
            <h1 className="text-9xl md:text-[200px] font-black text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-600 leading-none">
              404
            </h1>

            {/* Floating Icon */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            >
              <Search className="w-16 h-16 md:w-24 md:h-24 text-gray-300" />
            </motion.div>
          </div>
        </motion.div>

        {/* Error Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
            Page Not Found
          </h2>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Oops! The page you&apos;re looking for doesn&apos;t exist. It might
            have been moved or deleted.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 bg-[#7438dc] text-white px-8 py-4 rounded-lg font-semibold hover:bg-[#5a24bb] transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl cursor-pointer"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </button>

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 bg-white text-gray-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg border-2 border-gray-200 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
        </motion.div>

        {/* Additional Help */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 pt-8 border-t border-gray-200"
        >
          <p className="text-sm text-gray-500 mb-4">
            Looking for something specific?
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => router.push("/solo")}
              className="text-sm text-violet-700 hover:text-violet-700 font-medium hover:underline cursor-pointer"
            >
              Solo Mode
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => router.push("/multiplayer")}
              className="text-sm text-violet-700 hover:text-violet-700 font-medium hover:underline cursor-pointer"
            >
              Multiplayer Mode
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => router.push("/history")}
              className="text-sm text-violet-700 hover:text-violet-700 font-medium hover:underline cursor-pointer"
            >
              My Quizzes
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => router.push("/contacts")}
              className="text-sm text-violet-700 hover:text-violet-700 font-medium hover:underline cursor-pointer"
            >
              Contact
            </button>
          </div>
        </motion.div>

        {/* QuizMaster Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <div className="flex items-center justify-center gap-3 text-gray-400">
            <svg
              className="w-6 h-6 text-[#7438dc]"
              fill="none"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
                fill="currentColor"
              />
            </svg>
            <span className="font-semibold text-sm">QuizMaster</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
