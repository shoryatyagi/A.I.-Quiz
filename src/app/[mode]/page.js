"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams, notFound } from "next/navigation";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, UserPlus, LogIn } from "lucide-react";
import QuizCreator from "@/components/QuizCreator";
import MultiplayerLobby from "@/components/MultiplayerLobby";
import QuizQuestion from "@/components/QuizQuestion";
import QuizResults from "@/components/QuizResults";
import WaitingForResults from "@/components/WaitingForResults";
import Loader from "@/components/Loader";

export default function ModePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const mode = params.mode; // 'solo' or 'multiplayer'

  // Validate mode
  useEffect(() => {
    if (mode !== "solo" && mode !== "multiplayer") {
      notFound();
    }
  }, [mode]);

  // State Management
  const [stage, setStage] = useState("upload"); // upload, lobby, quiz, waiting, results
  const [quiz, setQuiz] = useState(null);
  const [metadata, setMetadata] = useState(null);
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
  const [playerStats, setPlayerStats] = useState(null);
  const [players, setPlayers] = useState([]);

  // Initialize Socket.IO for multiplayer
  useEffect(() => {
    if (mode !== "multiplayer") return;

    const getWebSocketURL = () => {
      if (typeof window !== "undefined") {
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
  }, [mode]);

  // Socket Event Listeners for Multiplayer
  useEffect(() => {
    if (!socket || mode !== "multiplayer") return;

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
        metadata: quizMetadata,
      }) => {
        setQuiz(quizData);
        setMetadata(quizMetadata);
        setCurrentQuestion(qIndex);
        setStage("quiz");
      }
    );

    socket.on("player-joined", ({ players: playerList }) => {
      setPlayers(playerList || []);
    });

    socket.on("player-left", ({ players: playerList }) => {
      setPlayers(playerList || []);
    });

    socket.on(
      "next-question",
      ({ question, currentQuestion: qIndex, totalQuestions }) => {
        setCurrentQuestion(qIndex);
      }
    );

    socket.on("quiz-completed", ({ leaderboard: lb }) => {
      setLeaderboard(lb);
      setStage("results");
    });

    socket.on("waiting-for-others", ({ playerStats: stats }) => {
      setPlayerStats(stats);
      setStage("waiting");
    });

    socket.on("joined-room", ({ roomCode: code, players: playerList }) => {
      setRoomCode(code);
      setPlayers(playerList || []);
      setStage("lobby");
    });

    return () => {
      socket.off("room-created");
      socket.off("quiz-started");
      socket.off("player-joined");
      socket.off("player-left");
      socket.off("next-question");
      socket.off("quiz-completed");
      socket.off("waiting-for-others");
      socket.off("joined-room");
    };
  }, [socket, mode]);

  // Show name prompt for multiplayer
  useEffect(() => {
    if (mode === "multiplayer" && stage === "upload" && !playerName) {
      setShowNamePrompt(true);
    }
  }, [mode, stage, playerName]);

  // Handlers
  const handleBackFromUpload = () => {
    router.push("/");
  };

  const handleQuizGenerated = (generatedQuiz, quizMetadata) => {
    setQuiz(generatedQuiz);
    setMetadata(quizMetadata);

    if (mode === "solo") {
      setCurrentQuestion(0);
      setUserAnswers([]);
      setStage("quiz");
    } else if (mode === "multiplayer" && isHost) {
      // Host creates room with the quiz
      socket.emit("create-room", {
        playerName,
        quiz: generatedQuiz,
        metadata: quizMetadata,
      });
    }
  };

  const handleAnswer = (answer) => {
    const newAnswers = [...userAnswers, answer];
    setUserAnswers(newAnswers);

    if (mode === "solo") {
      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setStage("results");
      }
    } else if (mode === "multiplayer") {
      socket.emit("submit-answer", {
        roomCode,
        answer,
        currentQuestion,
      });

      if (currentQuestion < quiz.questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }
    }
  };

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }
    setIsHost(true);
    setShowNamePrompt(false);
    setStage("upload");
  };

  const handleJoinRoom = () => {
    setShowNamePrompt(false);
    setShowJoinPrompt(true);
  };

  const handleJoinRoomSubmit = () => {
    if (!playerName.trim()) {
      alert("Please enter your name");
      return;
    }
    if (!joinRoomCode.trim()) {
      alert("Please enter a room code");
      return;
    }

    socket.emit("join-room", {
      roomCode: joinRoomCode.toUpperCase(),
      playerName,
    });
    setShowJoinPrompt(false);
  };

  const handleStartQuiz = () => {
    if (players.length === 0) {
      alert("Waiting for players to join...");
      return;
    }
    socket.emit("start-quiz", { roomCode });
  };

  const handleReturnHome = () => {
    router.push("/");
  };

  // Render based on stage
  const renderStage = () => {
    switch (stage) {
      case "upload":
        return (
          <QuizCreator
            mode={mode}
            source={quizSource}
            onQuizGenerated={handleQuizGenerated}
            onBack={handleBackFromUpload}
          />
        );

      case "lobby":
        return (
          <MultiplayerLobby
            roomCode={roomCode}
            players={players}
            isHost={isHost}
            onStartQuiz={handleStartQuiz}
          />
        );

      case "quiz":
        return (
          <QuizQuestion
            question={quiz.questions[currentQuestion]}
            questionNumber={currentQuestion + 1}
            totalQuestions={quiz.questions.length}
            onAnswer={handleAnswer}
            mode={mode}
          />
        );

      case "waiting":
        return (
          <WaitingForResults
            playerStats={playerStats}
            totalQuestions={quiz.questions.length}
          />
        );

      case "results":
        return (
          <QuizResults
            quiz={quiz}
            metadata={metadata}
            userAnswers={userAnswers}
            mode={mode}
            leaderboard={leaderboard}
            onReturnHome={handleReturnHome}
          />
        );

      default:
        return null;
    }
  };

  // Loading state
  if (status === "loading") {
    return <Loader message="Loading QuizMaster" />;
  }

  // Authentication check
  if (!session && mode === "multiplayer") {
    return (
      <div className="flex-grow flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Sign In Required
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to play multiplayer mode
          </p>
          <button
            onClick={() => router.push("/")}
            className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col">
      {renderStage()}

      {/* Name Prompt Modal for Multiplayer */}
      <AnimatePresence>
        {showNamePrompt && mode === "multiplayer" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowNamePrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Multiplayer Mode
                  </h3>
                </div>
                <button
                  onClick={() => router.push("/")}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleCreateRoom()
                      }
                      placeholder="Enter your name"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCreateRoom}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <Users className="w-5 h-5" />
                    Create Room
                  </button>
                  <button
                    onClick={handleJoinRoom}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    Join Room
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Join Room Modal */}
      <AnimatePresence>
        {showJoinPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowJoinPrompt(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    Join Room
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowJoinPrompt(false);
                    setShowNamePrompt(true);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={joinRoomCode}
                    onChange={(e) =>
                      setJoinRoomCode(e.target.value.toUpperCase())
                    }
                    onKeyPress={(e) =>
                      e.key === "Enter" && handleJoinRoomSubmit()
                    }
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-center text-2xl font-mono tracking-wider uppercase"
                    maxLength={6}
                    autoFocus
                  />
                </div>

                <button
                  onClick={handleJoinRoomSubmit}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <LogIn className="w-5 h-5" />
                  Join Room
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
