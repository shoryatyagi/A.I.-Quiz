"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Play, X } from "lucide-react";

export default function MultiplayerLobby({
  socket,
  roomCode,
  isHost,
  players: initialPlayers = [],
  onStartQuiz,
  onCancel,
}) {
  const [players, setPlayers] = useState(initialPlayers);
  const [copied, setCopied] = useState(false);

  // Update players when initialPlayers changes
  useEffect(() => {
    setPlayers(initialPlayers);
  }, [initialPlayers]);

  useEffect(() => {
    if (!socket) return;

    socket.on("player-joined", ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    socket.on("player-left", ({ playerName, totalPlayers }) => {
      setPlayers((prev) => prev.filter((p) => p !== playerName));
    });

    socket.on("player-removed", ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers);
    });

    return () => {
      socket.off("player-joined");
      socket.off("player-left");
      socket.off("player-removed");
    };
  }, [socket]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      "bg-blue-500/20 text-blue-500",
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
    
    if (!isHost || !socket) {
      console.log("❌ Cannot remove - isHost:", isHost, "socket:", !!socket);
      return;
    }
    
    console.log("✅ Emitting remove-player event");
    socket.emit("remove-player", { roomCode, playerName });
  };

  return (
    <main className="flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl text-center">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Quiz Lobby</h2>
          <p className="text-slate-600 mb-8">
            Share the code below to invite others to your quiz!
          </p>

          {/* Room Code */}
          <div className="mb-8">
            <p className="text-sm text-slate-500 mb-2">JOIN CODE</p>
            <div className="flex justify-center items-center gap-2">
              <div className="text-5xl font-bold tracking-widest text-slate-900 bg-slate-100 px-6 py-3 rounded-lg">
                {roomCode}
              </div>
              <button
                onClick={copyRoomCode}
                className="h-14 w-14 flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 transition-colors cursor-pointer"
              >
                {copied ? (
                  <Check className="w-6 h-6 text-green-600" />
                ) : (
                  <Copy className="w-6 h-6 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {/* Players List */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-slate-900 mb-4 text-left">
              Players Joined ({players.length})
            </h3>
            <div className="h-64 overflow-y-auto bg-slate-100 rounded-lg p-2 space-y-2">
              {players.length > 0 ? (
                players.map((player, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-md bg-white"
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
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Waiting for host to start...
                </h3>
                <p className="text-blue-700 text-sm">
                  The quiz will begin once the host starts the game
                </p>
                <div className="flex justify-center gap-2 mt-4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                    className="w-3 h-3 bg-blue-600 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="w-3 h-3 bg-blue-600 rounded-full"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="w-3 h-3 bg-blue-600 rounded-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {isHost && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onStartQuiz}
                disabled={players.length < 1}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#135bec] text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Play className="w-5 h-5" />
                Start Quiz
              </button>
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
