"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Copy, Check, Users, Play } from "lucide-react";

export default function MultiplayerLobby({
  socket,
  roomCode,
  isHost,
  players: initialPlayers = [],
  onStartQuiz,
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

    return () => {
      socket.off("player-joined");
      socket.off("player-left");
    };
  }, [socket]);

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full max-w-2xl mx-auto p-8"
    >
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Waiting Room
        </h2>

        {/* Room Code */}
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 mb-8">
          <p className="text-gray-600 text-center mb-2">
            Share this code with friends:
          </p>
          <div className="flex items-center justify-center gap-3">
            <span className="text-4xl font-bold text-gray-800 tracking-wider">
              {roomCode}
            </span>
            <button
              onClick={copyRoomCode}
              className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            >
              {copied ? (
                <Check className="w-6 h-6 text-green-600" />
              ) : (
                <Copy className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Players List - Shown to ALL players */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-gray-600" />
            <h3 className="text-xl font-semibold text-gray-800">
              Players ({players.length})
            </h3>
          </div>

          {players.length > 0 ? (
            <div className="space-y-2">
              {players.map((player, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-50 rounded-lg p-4 flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                    {player.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-800 font-medium">{player}</span>
                  {index === 0 && (
                    <span className="ml-auto bg-yellow-100 text-yellow-800 text-xs font-semibold px-2 py-1 rounded">
                      Host
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Waiting for players to join...</p>
            </div>
          )}
        </div>

        {/* Non-host waiting message */}
        {!isHost && (
          <div className="mb-8 text-center">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Waiting for host to start...
              </h3>
              <p className="text-blue-700 text-sm">
                The quiz will begin once the host selects a quiz source and
                generates questions
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

        {/* Start Button (Host Only) */}
        {isHost && (
          <button
            onClick={onStartQuiz}
            disabled={players.length < 1}
            className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-6 rounded-lg hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Start Quiz
          </button>
        )}
      </div>
    </motion.div>
  );
}
