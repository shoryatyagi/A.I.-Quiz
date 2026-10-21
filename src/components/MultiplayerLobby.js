"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Check, Play, X } from "lucide-react";

export default function MultiplayerLobby({
  socket,
  roomCode,
  isHost,
  players: initialPlayers = [],
  connectionAvailable = false,
  starting = false,
  onStartQuiz,
  onCancel,
}) {
  const players = Array.isArray(initialPlayers) ? initialPlayers : [];
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const copyTimeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(copyTimeoutRef.current), []);

  const copyRoomCode = async () => {
    try {
      if (!roomCode || !navigator.clipboard?.writeText) {
        setCopyError("Copy is unavailable. Select the code to copy it manually.");
        return;
      }
      await navigator.clipboard.writeText(roomCode);
      setCopyError("");
      setCopied(true);
      clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
      setCopyError("Could not copy the code. Select it and copy it manually.");
    }
  };

  const getPlayerInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(" ");
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getPlayerColor = (index) => {
    const colors = [
      "bg-violet-500/20 text-violet-700",
      "bg-green-500/20 text-green-500",
      "bg-purple-500/20 text-purple-500",
      "bg-yellow-500/20 text-yellow-500",
      "bg-red-500/20 text-red-500",
      "bg-pink-500/20 text-pink-500",
      "bg-indigo-500/20 text-indigo-500",
      "bg-orange-500/20 text-orange-500",
    ];
    return colors[index % colors.length];
  };

  const handleRemovePlayer = (playerName) => {
    console.log("🚫 Remove player clicked:", playerName);
    console.log("Is host:", isHost);
    console.log("Socket exists:", !!socket);
    console.log("Room code:", roomCode);
    
    if (!isHost || !socket?.connected) {
      console.log("❌ Cannot remove - isHost:", isHost, "socket:", !!socket);
      return;
    }
    
    console.log("✅ Emitting remove-player event");
    socket.emit("remove-player", { roomCode, playerName });
  };

  return (
    <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl text-center">
        <div className="rounded-[1.75rem] border border-[#e9e0f7] bg-white p-4 shadow-[0_22px_58px_-34px_rgba(61,34,110,0.5)] sm:p-6 md:p-8">
          <h2 className="mb-2 text-2xl font-extrabold tracking-tight text-[#211b43] sm:text-3xl">Quiz Lobby</h2>
          <p className="mb-8 font-semibold text-[#77718b]">
            Share the code below to invite others to your quiz!
          </p>

          {/* Room Code */}
          <div className="mb-8">
            <p className="mb-2 text-xs font-extrabold tracking-[0.18em] text-[#8c819f]">JOIN CODE</p>
            <div className="flex justify-center items-center gap-2">
              <div className="rounded-2xl bg-[#f2edfb] px-3 py-3 text-3xl font-extrabold tracking-[0.2em] text-[#512b91] sm:px-6 sm:text-5xl sm:tracking-widest">
                {roomCode}
              </div>
              <motion.button
                type="button"
                onClick={copyRoomCode}
                aria-label="Copy room code"
                whileHover={{ y: -2, rotate: copied ? 0 : -3 }}
                whileTap={{ scale: 0.92 }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eee7ff] transition-colors hover:bg-[#e1d5fa] cursor-pointer"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {copied ? (
                    <motion.span key="copied" initial={{ scale: 0.5, rotate: -25 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0.5 }}>
                      <Check className="h-6 w-6 text-[#0ca97e]" />
                    </motion.span>
                  ) : (
                    <motion.span key="copy" initial={{ scale: 0.5 }} animate={{ scale: 1 }} exit={{ scale: 0.5 }}>
                      <Copy className="h-6 w-6 text-slate-600" />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
            {copied && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} role="status" className="mt-2 text-sm font-bold text-[#0ca97e]">Copied! Invite your crew.</motion.p>}
            {copyError && <p role="status" className="mt-2 text-sm text-slate-600">{copyError}</p>}
          </div>

          {/* Players List */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 text-left">
              Players Joined ({players.length})
            </h3>
            <div className="h-64 overflow-y-auto rounded-2xl bg-[#f7f4fc] p-2 space-y-2">
              {players.length > 0 ? (
                players.map((player, index) => (
                  <motion.div
                    key={`${player}-${index}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 rounded-xl border border-[#f0ebf7] bg-white p-2"
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${getPlayerColor(
                        index
                      )}`}
                    >
                      <span className="text-sm font-bold">
                        {getPlayerInitials(player)}
                      </span>
                    </div>
                    <p className="font-medium text-sm text-slate-800 truncate flex-1 text-left">
                      {player}
                      {index === 0 && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                          Host
                        </span>
                      )}
                    </p>
                    {isHost && index !== 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemovePlayer(player);
                        }}
                        className="text-slate-500 hover:text-red-500 cursor-pointer transition-colors p-1 hover:bg-red-50 rounded"
                        title={`Remove ${player}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500">
                  <p>Waiting for players to join...</p>
                </div>
              )}
            </div>
          </div>

          {/* Non-host waiting message */}
          {!isHost && (
            <div className="mb-8">
              <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 sm:p-6">
                <h3 className="mb-2 text-lg font-extrabold text-[#512b91]">
                  Waiting for host to start...
                </h3>
                <p className="text-sm font-semibold text-[#766d8e]">
                  The quiz will begin once the host starts the game
                </p>
                <div className="flex justify-center gap-2 mt-4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className="w-3 h-3 bg-violet-600 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="w-3 h-3 bg-violet-600 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="w-3 h-3 bg-violet-600 rounded-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isHost && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                onClick={onStartQuiz}
                whileHover={connectionAvailable && players.length >= 1 && !starting ? { y: -2 } : undefined}
                whileTap={connectionAvailable && players.length >= 1 && !starting ? { scale: 0.98 } : undefined}
                disabled={players.length < 1 || !connectionAvailable || starting}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#7438dc] text-white font-extrabold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="w-5 h-5" />
                {starting ? "Starting…" : "Start Quiz"}
              </motion.button>
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-200 hover:bg-slate-300 font-bold text-lg text-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
