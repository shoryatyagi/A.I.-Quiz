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

// Helper function to shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Randomize quiz questions and options while preserving original question text and answer text
function randomizeQuiz(questions) {
  // First, shuffle the question order
  const shuffledQuestions = shuffleArray(questions);

  // Then, shuffle the options within each question, but keep track of the correct answer
  return shuffledQuestions.map((question) => {
    // Store the original correct answer text
    const correctAnswerText = question.options[question.correctAnswer];

    // Shuffle the options
    const shuffledOptions = shuffleArray(question.options);

    // Find the new index of the correct answer after shuffling
    const newCorrectAnswerIndex = shuffledOptions.indexOf(correctAnswerText);

    return {
      ...question,
      options: shuffledOptions,
      correctAnswer: newCorrectAnswerIndex,
      originalQuestion: question.question, // Keep original for server matching
    };
  });
}

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
  const [answerTimes, setAnswerTimes] = useState([]); // Track time spent on each question
  const [leaderboard, setLeaderboard] = useState(null);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [joinRoomCode, setJoinRoomCode] = useState("");
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const [playerStats, setPlayerStats] = useState(null);
  const [players, setPlayers] = useState([]);
  const [questionStartTime, setQuestionStartTime] = useState(null); // Track when question started

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
      console.log("✅ Connected to server. Socket ID:", newSocket.id);
      console.log("Current mode:", mode);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected from server. Reason:", reason);
    });

    newSocket.on("error", ({ message }) => {
      console.error("❌ Socket error event:", message);
      alert(message);
    });

    // ========================================
    // ATTACH ALL EVENT LISTENERS IMMEDIATELY
    // ========================================

    newSocket.on("room-created", ({ roomCode: code, players: playerList }) => {
      console.log("🏠 Room created:", code, "Players:", playerList);
      console.log("Setting stage to lobby...");
      setRoomCode(code);
      setPlayers(playerList || []);
      setStage("lobby");
    });

    newSocket.on(
      "quiz-started",
      ({
        question,
        currentQuestion: qIndex,
        totalQuestions,
        quiz: quizData,
        metadata: quizMetadata,
      }) => {
        console.log("🎮 Quiz started! Total questions:", totalQuestions);
        console.log(
          "Quiz data received:",
          quizData ? quizData.length : 0,
          "questions"
        );

        // Randomize questions and options for each client
        const randomizedQuiz = randomizeQuiz(
          Array.isArray(quizData) ? quizData : quizData.questions || []
        );

        const quizObject = {
          questions: randomizedQuiz,
        };
        setQuiz(quizObject);
        setMetadata(quizMetadata);
        setCurrentQuestion(qIndex);
        setStage("quiz");
        console.log("🔀 Quiz randomized and stage set to quiz");
      }
    );

    newSocket.on("player-joined", ({ players: playerList }) => {
      console.log("👥 Player joined, updated player list:", playerList);
      setPlayers(playerList || []);
    });

    newSocket.on("player-left", ({ players: playerList }) => {
      setPlayers(playerList || []);
    });

    newSocket.on("player-removed", ({ playerName, players: playerList }) => {
      console.log(`🚫 Player removed: ${playerName}. Updated player list:`, playerList);
      setPlayers(playerList || []);
    });

    newSocket.on("player-kicked", ({ message }) => {
      console.log("❌ You have been kicked from the quiz:", message);
      alert(message || "You have been removed from the quiz by the host");
      // Reset to initial state
      setStage("upload");
      setRoomCode("");
      setPlayers([]);
      setIsHost(false);
      newSocket.disconnect();
    });

    newSocket.on(
      "next-question",
      ({ question, currentQuestion: qIndex, totalQuestions }) => {
        setCurrentQuestion(qIndex);
      }
    );

    newSocket.on("quiz-completed", ({ leaderboard: lb }) => {
      console.log("🏆 Quiz completed! Leaderboard:", lb);
      setLeaderboard(lb);
      setStage("results");
    });

    newSocket.on("quiz-finished", ({ leaderboard: lb }) => {
      console.log("🏁 Quiz finished! Leaderboard:", lb);
      setLeaderboard(lb);
      setStage("results");
    });

    newSocket.on("waiting-for-others", ({ playerStats: stats }) => {
      console.log("⏳ Waiting for other players:", stats);
      // This event is now deprecated - player-finished handles everything
      // Keeping listener for backwards compatibility but not updating state
    });

    newSocket.on("joined-room", ({ roomCode: code, players: playerList }) => {
      console.log("🔥🔥🔥 JOINED-ROOM EVENT RECEIVED 🔥🔥🔥");
      console.log("✅ Successfully joined room:", code, "Players:", playerList);
      console.log("Setting room code:", code);
      console.log("Setting players:", playerList);
      console.log("Setting stage to lobby...");

      // Force update with immediate logging
      setRoomCode(code);
      setPlayers(playerList || []);
      setStage("lobby");

      // Verify state update after a tick
      setTimeout(() => {
        console.log("🔍 After setState - Current stage should be lobby");
      }, 100);
    });

    newSocket.on(
      "player-finished",
      ({ correctAnswers, totalQuestions, totalTime, avgTime }) => {
        console.log("🏁 Player finished quiz:", {
          correctAnswers,
          totalQuestions,
          totalTime,
          avgTime,
        });

        // Set player stats so they can be displayed while waiting
        setPlayerStats({
          correctAnswers,
          totalQuestions,
          totalTime,
          avgTime,
        });

        // Move to waiting stage
        setStage("waiting");
      }
    );

    newSocket.on(
      "answer-submitted",
      ({ isCorrect, correctAnswer, explanation }) => {
        console.log("📝 Answer submitted:", { isCorrect, correctAnswer });
      }
    );

    newSocket.on("error", ({ message }) => {
      console.error("❌ Socket error:", message);
      alert(message || "An error occurred");
      if (
        message.includes("Room not found") ||
        message.includes("already started")
      ) {
        setShowJoinPrompt(false);
        setShowNamePrompt(true);
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [mode]);

  // Monitor stage changes
  useEffect(() => {
    console.log("📍 STAGE CHANGED TO:", stage);
    console.log("📍 Room Code:", roomCode);
    console.log("📍 Players:", players);
    console.log("📍 Is Host:", isHost);

    // Add to window for manual debugging
    if (typeof window !== "undefined") {
      window.debugQuizState = {
        stage,
        roomCode,
        players,
        isHost,
        currentQuestion,
        totalQuestions: quiz?.questions?.length || 0,
      };
    }
  }, [stage, roomCode, players, isHost, currentQuestion, quiz]);

  // Show name prompt for multiplayer
  useEffect(() => {
    if (mode === "multiplayer" && stage === "upload" && !playerName) {
      setShowNamePrompt(true);
    }
  }, [mode, stage, playerName]);

  // Track question start time for timer
  useEffect(() => {
    if (stage === "quiz") {
      setQuestionStartTime(Date.now());
      console.log("⏱️ Question timer started for Q" + (currentQuestion + 1));
    }
  }, [stage, currentQuestion]);

  // Handlers
  const handleBackFromUpload = () => {
    router.push("/");
  };

  const handleQuizGenerated = (generatedQuiz, quizMetadata) => {
    // Keep quiz as an array for server compatibility
    const quizArray = Array.isArray(generatedQuiz)
      ? generatedQuiz
      : generatedQuiz.questions || [];

    // Wrap in object for local use
    const quizObject = {
      questions: quizArray,
      ...quizMetadata,
    };

    setQuiz(quizObject);
    setMetadata(quizMetadata);

    if (mode === "solo") {
      // Randomize questions and options for solo mode too
      const randomizedQuiz = randomizeQuiz(quizArray);
      setQuiz({ questions: randomizedQuiz, ...quizMetadata });
      setCurrentQuestion(0);
      setUserAnswers([]);
      setAnswerTimes([]); // Reset answer times for new quiz
      setStage("quiz");
    } else if (mode === "multiplayer" && isHost) {
      // Generate a 6-character room code
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

      // Host creates room with the quiz (send array, not object)
      // Server will send original quiz, each client will randomize on their end
      socket.emit("create-room", {
        roomCode,
        quiz: quizArray, // Send original array, clients will randomize
        metadata: quizMetadata,
        hostName: playerName,
      });
    }
  };

  const handleAnswer = (answer) => {
    console.log("🎯 Answer selected:", answer);
    console.log("🎯 Current question:", currentQuestion);
    console.log("🎯 Total questions:", quiz.questions.length);
    console.log("🎯 Mode:", mode);

    // Calculate time spent on this question
    const timeSpent = questionStartTime ? Date.now() - questionStartTime : 0;
    console.log(
      `⏱️ Time spent on Q${currentQuestion + 1}: ${timeSpent}ms (${(
        timeSpent / 1000
      ).toFixed(1)}s)`
    );

    // Get the current question data
    const currentQuestionData = quiz.questions[currentQuestion];

    // Convert answer index to answer text for consistent storage
    const selectedAnswerText = currentQuestionData.options[answer];

    // Store answer as TEXT (not index) for both solo and multiplayer
    const newAnswers = [...userAnswers, selectedAnswerText];
    setUserAnswers(newAnswers);

    // Track time spent for solo mode
    if (mode === "solo") {
      const newAnswerTimes = [...answerTimes, timeSpent];
      setAnswerTimes(newAnswerTimes);
    }

    console.log("📝 Answer stored:", {
      answerIndex: answer,
      answerText: selectedAnswerText,
      correctAnswer: currentQuestionData.correctAnswer,
      correctAnswerText:
        currentQuestionData.options[currentQuestionData.correctAnswer],
      timeSpent: mode === "solo" ? timeSpent : "tracked by server",
    });

    if (mode === "solo") {
      if (currentQuestion < quiz.questions.length - 1) {
        console.log("➡️ Moving to next question:", currentQuestion + 1);
        setCurrentQuestion(currentQuestion + 1);
      } else {
        console.log("🏁 Last question - showing results");
        setStage("results");
      }
    } else if (mode === "multiplayer") {
      console.log("📤 Submitting answer to server:", {
        roomCode,
        questionIndex: currentQuestion,
        questionText: currentQuestionData.question.substring(0, 50) + "...",
        answerIndex: answer,
        selectedAnswerText: selectedAnswerText,
        timeSpent: timeSpent,
      });

      socket.emit("submit-answer", {
        roomCode,
        questionIndex: currentQuestion,
        questionText: currentQuestionData.question,
        answerIndex: answer,
        selectedAnswerText: selectedAnswerText,
        timeSpent: timeSpent, // Now sending actual time spent
      });

      if (currentQuestion < quiz.questions.length - 1) {
        console.log(
          "➡️ [Multiplayer] Moving to next question:",
          currentQuestion + 1
        );
        setCurrentQuestion(currentQuestion + 1);
      } else {
        console.log(
          "🏁 [Multiplayer] Last question answered - waiting for server response..."
        );
        // Server will send waiting-for-others or quiz-finished
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

    if (!socket || !socket.connected) {
      console.error("❌ Socket not connected yet!");
      alert("Connection not ready. Please wait a moment and try again.");
      return;
    }

    const roomCodeUpper = joinRoomCode.toUpperCase();
    console.log(
      "🔄 Attempting to join room:",
      roomCodeUpper,
      "as player:",
      playerName
    );
    console.log("Socket connected:", socket.connected, "Socket ID:", socket.id);

    socket.emit("join-room", {
      roomCode: roomCodeUpper,
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
            socket={socket}
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
            roomCode={roomCode}
            playerStats={playerStats}
            totalQuestions={quiz.questions.length}
          />
        );

      case "results":
        return (
          <QuizResults
            quiz={quiz.questions}
            metadata={metadata}
            userAnswers={userAnswers}
            answerTimes={answerTimes}
            mode={mode}
            leaderboard={leaderboard}
            playerName={playerName}
            roomCode={roomCode}
            onPlayAgain={handleReturnHome}
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
