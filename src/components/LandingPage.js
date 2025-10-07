"use client";

import { motion } from "framer-motion";
import { User, Users } from "lucide-react";
import Image from "next/image";

export default function LandingPage({ onSelectMode, isAuthenticated = false }) {
  return (
    <main className="flex-grow flex items-center">
      <div className="container mx-auto px-6 py-16 text-center">
        <div className="w-full h-[500px] rounded-xl bg-cover bg-center flex flex-col items-center justify-center p-8 relative overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <Image
              src="/brain.jpg"
              alt="Brain illustration"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/50 to-black/60"></div>
          </div>

          {/* Content */}
          <div className="max-w-3xl relative z-10">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight"
            >
              Unlock the Power of AI-Driven Quizzes
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="mt-4 text-base md:text-lg text-white/90"
            >
              Transform your documents or ideas into engaging quizzes with
              QuizGenius. Choose your game mode to get started.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8 flex flex-wrap justify-center gap-4"
            >
              <button
                onClick={() => onSelectMode("solo")}
                className="bg-primary text-white font-bold px-8 py-4 rounded-lg text-base hover:bg-primary/90 transition-all duration-200 transform hover:scale-105 hover:shadow-xl flex items-center gap-3 cursor-pointer"
              >
                <User className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-bold">Solo Mode</div>
                  <div className="text-xs font-normal opacity-90">
                    Play at your own pace
                  </div>
                </div>
              </button>

              <button
                onClick={() => onSelectMode("multiplayer")}
                className="bg-white/10 backdrop-blur-sm text-white font-bold px-8 py-4 rounded-lg text-base hover:bg-white/20 transition-all duration-200 transform hover:scale-105 hover:shadow-xl flex items-center gap-3 cursor-pointer"
              >
                <Users className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-bold">Multiplayer Mode</div>
                  <div className="text-xs font-normal opacity-90">
                    Compete with friends
                  </div>
                </div>
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
