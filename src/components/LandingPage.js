"use client";

import { motion } from "framer-motion";
import { User, Users } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LandingPage({ isAuthenticated = false }) {
  const router = useRouter();

  const handleSelectMode = (mode) => {
    router.push(`/${mode}/`);
  };

  return (
    <main className="flex-grow flex items-center">
      <div className="container mx-auto px-4 py-8 text-center sm:px-6 sm:py-16">
        <div className="relative flex h-auto min-h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-xl bg-cover bg-center px-4 py-10 sm:p-8">
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
              className="text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl md:text-6xl"
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
              QuizMaster. Choose your game mode to get started.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="mt-8 flex flex-col justify-center gap-4 sm:flex-row sm:flex-wrap"
            >
              <button
                onClick={() => handleSelectMode("solo")}
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-primary px-5 py-3 text-base font-bold text-white transition-all duration-200 hover:scale-105 hover:bg-primary/90 hover:shadow-xl sm:w-auto sm:px-8 sm:py-4"
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
                onClick={() => handleSelectMode("multiplayer")}
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg bg-white/10 px-5 py-3 text-base font-bold text-white backdrop-blur-sm transition-all duration-200 hover:scale-105 hover:bg-white/20 hover:shadow-xl sm:w-auto sm:px-8 sm:py-4"
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
