"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpenCheck, Sparkles, Trophy, User, Users } from "lucide-react";
import { useRouter } from "next/navigation";

const modes = [
  {
    id: "solo",
    title: "Solo challenge",
    description: "Build a quiz from a topic or PDF and play at your own pace.",
    action: "Start learning",
    icon: User,
    badge: "YOUR PACE",
    iconClass: "bg-[#fff1d9] text-[#d88712]",
  },
  {
    id: "multiplayer",
    title: "Play together",
    description: "Create a room, invite friends, and compare your scores.",
    action: "Meet your team",
    icon: Users,
    badge: "WITH FRIENDS",
    iconClass: "bg-[#e4fff6] text-[#0ca97e]",
  },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="mx-auto w-full max-w-7xl flex-grow px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
      <section className="relative isolate overflow-hidden rounded-[2rem] bg-[#eee7ff] p-5 sm:p-8 lg:p-12">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-white/50 blur-2xl sm:h-80 sm:w-80" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/3 h-72 w-72 rounded-full bg-[#d8c7ff]/70 blur-3xl" />

        <div className="relative grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rounded-[1.7rem] bg-gradient-to-br from-[#793be2] via-[#7131d6] to-[#5722b2] p-6 text-white shadow-[0_24px_60px_-30px_rgba(72,31,143,0.65)] sm:p-9 lg:p-11"
          >
            <div className="mb-7 inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-2 text-xs font-extrabold tracking-[0.14em] text-white/95 sm:text-sm">
              <Sparkles className="h-4 w-4 text-[#ffd273]" aria-hidden="true" />
              LEARN A LITTLE. WIN A LOT.
            </div>
            <h1 className="max-w-2xl text-4xl font-black leading-[1.04] tracking-tight sm:text-5xl lg:text-6xl">
              Make learning your next favorite game.
            </h1>
            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/80 sm:text-lg">
              Turn what you&apos;re studying into a quiz, collect points, and see how much you know.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-bold">
                <BookOpenCheck className="h-4 w-4 text-[#91f1d4]" aria-hidden="true" />
                From your notes
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-bold">
                <Trophy className="h-4 w-4 text-[#ffd273]" aria-hidden="true" />
                Just for fun
              </span>
            </div>
          </motion.div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {modes.map(({ id, title, description, action, icon: Icon, badge, iconClass }, index) => (
              <motion.button
                key={id}
                type="button"
                whileHover={{ y: -4, transition: { duration: 0.18 } }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 + index * 0.1, duration: 0.4 }}
                onClick={() => router.push(`/${id}/`)}
                className="group flex min-h-48 w-full flex-col rounded-[1.5rem] border border-white/80 bg-white p-5 text-left shadow-[0_12px_34px_-24px_rgba(45,26,86,0.45)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_20px_42px_-24px_rgba(75,39,136,0.35)] focus-visible:outline-none sm:min-h-0 sm:p-6"
              >
                <span className="flex w-full items-start justify-between gap-3">
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${iconClass}`}>
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-[#f5f1fc] px-3 py-1.5 text-[0.65rem] font-extrabold tracking-[0.12em] text-[#766c91]">
                    {badge}
                  </span>
                </span>
                <span className="mt-4 text-xl font-extrabold tracking-tight text-[#211b43] sm:text-2xl">{title}</span>
                <span className="mt-1 text-sm font-semibold leading-6 text-[#77718b]">{description}</span>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[#7438dc]">
                  {action}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
