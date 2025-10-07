"use client";

import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import PDFUploader from "@/components/PDFUploader";
import QuizMode from "@/components/QuizMode";
import MultiplayerLobby from "@/components/MultiplayerLobby";
import QuizQuestion from "@/components/QuizQuestion";
import QuizResults from "@/components/QuizResults";
import WaitingForResults from "@/components/WaitingForResults";
import QuizSourceSelection from "@/components/QuizSourceSelection";
import AIQuizGenerator from "@/components/AIQuizGenerator";
import { Brain, Sparkles } from "lucide-react";

export default function Home() {
  // State Management
  const [stage, setStage] = useState("mode"); // mode, source, upload, ai-generate, lobby, quiz, waiting, results
  const [quiz, setQuiz] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [mode, setMode] = useState(null); // solo, multiplayer
  const [quizSource, setQuizSource] = useState(null); // pdf, ai
  const [socket, setSocket] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [isHost, setIsHost] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [leaderboard, setLeaderboard] = useState(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const [playerStats, setPlayerStats] = useState(null); // Store player's completion stats
  const [players, setPlayers] = useState([]); // Players in the lobby

  // Initialize Socket.IO
  useEffect(() => {
    // Dynamically determine the WebSocket URL based on the current host
    const getWebSocketURL = () => {
      if (typeof window !== "undefined") {
        // Use the current window location to determine the server URL
        const protocol =
          window.location.protocol === "https:" ? "https:" : "http:";
        const host = window.location.hostname;
        const port = window.location.port || "3000";
        return `${protocol}//${host}:${port}`;
      }
      return process.env.NEXT_PUBLIC_WEBSOCKET_URL || "http://localhost:3000";
    };

    const wsURL = getWebSocketURL();
    console.log("Connecting to WebSocket:", wsURL);

    const newSocket = io(wsURL, {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("Connected to server:", newSocket.id);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    newSocket.on("error", ({ message }) => {
      alert(message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Socket Event Listeners
  useEffect(() => {
    if (!socket) return;

    socket.on("room-created", ({ roomCode: code, players: playerList }) => {
      setRoomCode(code);
      setPlayers(playerList || []);
      setStage("lobby");
    });

    socket.on(
      "quiz-started",
      ({
        question,
        currentQuestion: qIndex,
        totalQuestions,
        quiz: quizData,
      }) => {
        console.log("Quiz started event received:", {
          qIndex,
          totalQuestions,
          hasQuiz: !!quizData,
        });
        if (quizData) {
          // Randomize quiz for this specific client
          const randomizedQuiz = randomizeQuiz(quizData);
          setQuiz(randomizedQuiz);
        }
        setCurrentQuestion(qIndex);
        setUserAnswers([]);
        setStage("quiz");
      }
    );

    socket.on("next-question", ({ question, currentQuestion: qIndex }) => {
      setCurrentQuestion(qIndex);
    });

    socket.on("player-joined", ({ players: updatedPlayers }) => {
      setPlayers(updatedPlayers || []);
    });

    socket.on(
      "answer-submitted",
      ({ isCorrect, correctAnswer, explanation }) => {
        console.log("Answer submitted:", { isCorrect, correctAnswer });
        // Could show a brief notification here if desired
      }
    );

    socket.on(
      "player-finished",
      ({ correctAnswers, totalQuestions, totalTime, avgTime }) => {
        console.log("You finished the quiz!", {
          correctAnswers,
          totalQuestions,
          totalTime,
          avgTime,
        });
        // Store player's stats to show on waiting screen
        setPlayerStats({ correctAnswers, totalQuestions, totalTime, avgTime });
        // Show waiting screen with score
        setStage("waiting");
      }
    );

    socket.on(
      "quiz-finished",
      ({ leaderboard: finalLeaderboard, quiz: finalQuiz }) => {
        console.log("Quiz finished event received:", {
          hasLeaderboard: !!finalLeaderboard,
          hasQuiz: !!finalQuiz,
          leaderboardData: finalLeaderboard,
          currentPlayerName: playerName,
        });
        // DON'T overwrite quiz - each client has their own randomized version
        // Only update leaderboard which has the validated results
        setLeaderboard(finalLeaderboard);
        setStage("results");
      }
    );

    socket.on("host-disconnected", () => {
      alert("Host has disconnected. Returning to home.");
      resetGame();
    });

    return () => {
      socket.off("room-created");
      socket.off("quiz-started");
      socket.off("next-question");
      socket.off("player-joined");
      socket.off("quiz-finished");
      socket.off("host-disconnected");
    };
  }, [socket]);

  // Helper function to randomize quiz for each client
  const randomizeQuiz = (quizData) => {
    if (!quizData) return quizData;

    // Shuffle questions order
    const shuffledQuiz = [...quizData].sort(() => Math.random() - 0.5);

    // Shuffle options for each question
    return shuffledQuiz.map((q) => {
      const correctAnswerText = q.options[q.correctAnswer];

      // Shuffle options
      const shuffledOptions = [...q.options];
      for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [
          shuffledOptions[j],
          shuffledOptions[i],
        ];
      }

      // Find new correct answer index
      const newCorrectIndex = shuffledOptions.indexOf(correctAnswerText);

      return {
        ...q,
        options: shuffledOptions,
        correctAnswer: newCorrectIndex,
      };
    });
  };

  // Handlers
  const handleQuizGenerated = (generatedQuiz, meta) => {
    // Randomize quiz for this client
    const randomizedQuiz = randomizeQuiz(generatedQuiz);
    setQuiz(randomizedQuiz);
    setMetadata(meta);

    if (mode === "solo") {
      // Solo mode: go directly to quiz
      setStage("quiz");
      setCurrentQuestion(0);
      setUserAnswers([]);
    } else {
      // Multiplayer mode: host creates room with original quiz
      if (isHost) {
        socket.emit("create-room", {
          roomCode,
          quiz: generatedQuiz, // Send original, clients will randomize
          hostName: playerName,
        });
      }
      setStage("lobby");
    }
  };

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);

    if (selectedMode === "solo") {
      // Solo: go to source selection
      setStage("source");
    } else {
      // Multiplayer: show create/join options
      setShowNamePrompt(true);
    }
  };

  const handleSourceSelect = (source) => {
    setQuizSource(source);
    if (source === "pdf") {
      setStage("upload");
    } else {
      setStage("ai-generate");
    }
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setIsHost(true);
    setRoomCode(code);
    setShowNamePrompt(false);
    // Go to source selection for host
    setStage("source");
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !joinRoomCode.trim()) {
      alert("Please enter your name and room code");
      return;
    }

    socket.emit("join-room", {
      roomCode: joinRoomCode.toUpperCase(),
      playerName,
    });
    setRoomCode(joinRoomCode.toUpperCase());
    setIsHost(false);
    setStage("lobby");
    setShowJoinPrompt(false);
  };

  const handleStartQuiz = () => {
    socket.emit("start-quiz", { roomCode });
  };

  const handleAnswer = (answerIndex, timeSpent) => {
    if (mode === "solo") {
      // Store the selected answer TEXT for solo mode (for accurate scoring with randomized quizzes)
      const selectedAnswerText = quiz[currentQuestion].options[answerIndex];
      setUserAnswers([...userAnswers, selectedAnswerText]);

      // Wait 1 second before moving to next question
      setTimeout(() => {
        if (currentQuestion < quiz.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        } else {
          setStage("results");
        }
      }, 1000);
    } else {
      // Multiplayer mode - asynchronous progression
      // Get the actual text of the selected answer (important for randomized quizzes)
      const selectedAnswerText = quiz[currentQuestion].options[answerIndex];
      const questionText = quiz[currentQuestion].question; // Get question text for matching

      // Store answer TEXT locally (same as solo mode for consistency)
      const newAnswers = [...userAnswers, selectedAnswerText];
      setUserAnswers(newAnswers);

      // Submit answer to server with question text so server can match it correctly
      socket.emit("submit-answer", {
        roomCode,
        questionIndex: currentQuestion, // Client's randomized index (for UI reference)
        questionText, // Question text for server to match against original quiz
        answerIndex,
        selectedAnswerText, // Send the actual answer text
        timeSpent,
      });

      // Automatically move to next question after 1 second
      setTimeout(() => {
        if (currentQuestion < quiz.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        }
        // If finished, wait for server to send results
      }, 1000);
    }
  };

  const resetGame = () => {
    setStage("mode");
    setQuiz(null);
    setMetadata(null);
    setMode(null);
    setRoomCode("");
    setPlayerName("");
    setIsHost(false);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setLeaderboard(null);
    setShowNamePrompt(false);
    setJoinRoomCode("");
    setShowJoinPrompt(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Quiz Generator
                </h1>
                <p className="text-xs text-gray-600">Powered by DeepSeek AI</p>
              </div>
            </div>
            {stage !== "upload" && (
              <button
                onClick={resetGame}
                className="px-4 py-2 text-sm bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                New Quiz
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 min-h-[calc(100vh-120px)]">
        <AnimatePresence mode="wait">
          {stage === "source" && (
            <motion.div key="source">
              <QuizSourceSelection onSelectSource={handleSourceSelect} />
            </motion.div>
          )}

          {stage === "upload" && (
            <motion.div key="upload">
              <PDFUploader onQuizGenerated={handleQuizGenerated} />
            </motion.div>
          )}

          {stage === "ai-generate" && (
            <motion.div key="ai-generate">
              <AIQuizGenerator onQuizGenerated={handleQuizGenerated} />
            </motion.div>
          )}

          {stage === "mode" && (
            <motion.div key="mode">
              <QuizMode onSelectMode={handleModeSelect} />
            </motion.div>
          )}

          {stage === "lobby" && (
            <motion.div key="lobby">
              <MultiplayerLobby
                socket={socket}
                roomCode={roomCode}
                isHost={isHost}
                players={players}
                onStartQuiz={handleStartQuiz}
              />
            </motion.div>
          )}

          {stage === "quiz" && quiz && (
            <motion.div key="quiz">
              <QuizQuestion
                question={quiz[currentQuestion]}
                questionIndex={currentQuestion}
                totalQuestions={quiz.length}
                onAnswer={handleAnswer}
              />
            </motion.div>
          )}

          {stage === "waiting" && (
            <motion.div key="waiting">
              <WaitingForResults
                roomCode={roomCode}
                playerStats={playerStats}
              />
            </motion.div>
          )}

          {stage === "results" && quiz && (
            <motion.div key="results">
              <QuizResults
                quiz={quiz}
                userAnswers={userAnswers}
                leaderboard={leaderboard}
                playerName={playerName}
                onPlayAgain={resetGame}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Name Prompt Modal for Multiplayer */}
      {showNamePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Choose Your Path
            </h3>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleCreateRoom}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Create Room
              </button>
              <button
                onClick={() => {
                  setShowNamePrompt(false);
                  setShowJoinPrompt(true);
                }}
                className="bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all"
              >
                Join Room
              </button>
            </div>

            <button
              onClick={() => {
                setShowNamePrompt(false);
                setMode(null);
              }}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {/* Join Room Modal */}
      {showJoinPrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Join Quiz Room
            </h3>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Enter room code"
                value={joinRoomCode}
                onChange={(e) => setJoinRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none uppercase"
                maxLength={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleJoinRoom}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
              >
                Join
              </button>
              <button
                onClick={() => {
                  setShowJoinPrompt(false);
                  setShowNamePrompt(true);
                }}
                className="bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all"
              >
                Back
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm mt-16 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span className="text-sm">
              Powered by DeepSeek V3.1 AI via OpenRouter
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Built with Next.js, TailwindCSS, Framer Motion, and Socket.IO
          </p>
        </div>
      </footer>
    </div>
  );
}
