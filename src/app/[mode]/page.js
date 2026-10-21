"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
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

function isValidQuiz(questions) {
  return (
    Array.isArray(questions) &&
    questions.length > 0 &&
    questions.every(
      (question) =>
        question &&
        typeof question.question === "string" &&
        question.question.trim() &&
        Array.isArray(question.options) &&
        question.options.length === 4 &&
        question.options.every((option) => typeof option === "string" && option.trim()) &&
        Number.isInteger(question.correctAnswer) &&
        question.correctAnswer >= 0 &&
        question.correctAnswer < question.options.length
    )
  );
}

function createRoomCode() {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 6 }, () =>
    alphabet[Math.floor(Math.random() * alphabet.length)]
  ).join("");
}

export default function ModePage() {
  const { user, status } = useAuth();
  const router = useRouter();
  const params = useParams();
  const mode = params.mode; // 'solo' or 'multiplayer'

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
  const [socketConnected, setSocketConnected] = useState(false);
  const [socketError, setSocketError] = useState("");
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isStartingQuiz, setIsStartingQuiz] = useState(false);
  const [awaitingAnswer, setAwaitingAnswer] = useState(false);
  const pendingAnswerRef = useRef(false);
  const connectionInterruptedRef = useRef(false);
  const quizRef = useRef(quiz);
  const currentQuestionRef = useRef(currentQuestion);
  quizRef.current = quiz;
  currentQuestionRef.current = currentQuestion;

  // Initialize Socket.IO for multiplayer
  useEffect(() => {
    if (mode !== "multiplayer") return;

    // Connect to Flask backend WebSocket
    const wsURL = process.env.NEXT_PUBLIC_API_URL || 'https://flask-backend-gabk.onrender.com';
    console.log("Connecting to WebSocket:", wsURL);

    const newSocket = io(wsURL, {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      setSocketConnected(true);
      setSocketError(connectionInterruptedRef.current
        ? "You reconnected, but you are no longer in the room. Return home and rejoin."
        : "");
      console.log("✅ Connected to server. Socket ID:", newSocket.id);
      console.log("Current mode:", mode);
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Connection error:", error);
      setSocketConnected(false);
      setSocketError("Unable to connect to multiplayer. Check your connection and try again.");
      setIsJoiningRoom(false);
      setIsCreatingRoom(false);
      setIsStartingQuiz(false);
      pendingAnswerRef.current = false;
      setAwaitingAnswer(false);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("🔌 Disconnected from server. Reason:", reason);
      setSocketConnected(false);
      if (reason !== "io client disconnect") {
        connectionInterruptedRef.current = true;
        setSocketError("Connection lost. This room may no longer be available.");
        setIsJoiningRoom(false);
        setIsCreatingRoom(false);
        setIsStartingQuiz(false);
        pendingAnswerRef.current = false;
        setAwaitingAnswer(false);
      }
    });

    newSocket.on("error", (payload) => {
      const message = typeof payload?.message === "string"
        ? payload.message
        : "A multiplayer action failed. Please try again.";
      console.error("❌ Socket error event:", message);
      setSocketError(message);
      setIsJoiningRoom(false);
      setIsCreatingRoom(false);
      setIsStartingQuiz(false);
      pendingAnswerRef.current = false;
      setAwaitingAnswer(false);
      if (/room not found|quiz already started/i.test(message)) {
        setShowJoinPrompt(true);
        setShowNamePrompt(false);
      } else if (/room code already exists|failed to create room/i.test(message)) {
        setIsHost(false);
        setShowNamePrompt(true);
      }
    });

    // ========================================
    // ATTACH ALL EVENT LISTENERS IMMEDIATELY
    // ========================================

    newSocket.on("room-created", ({ roomCode: code, players: playerList }) => {
      console.log("🏠 Room created:", code, "Players:", playerList);
      console.log("Setting stage to lobby...");
      setRoomCode(code);
      setPlayers(playerList || []);
      setShowNamePrompt(false);
      setShowJoinPrompt(false);
      setSocketError("");
      setIsCreatingRoom(false);
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
        const questions = Array.isArray(quizData) ? quizData : quizData?.questions;
        if (!isValidQuiz(questions)) {
          setSocketError("The room sent invalid quiz data. Please return home and try again.");
          setStage("lobby");
          return;
        }
        const randomizedQuiz = randomizeQuiz(questions);

        const quizObject = {
          questions: randomizedQuiz,
        };
        setQuiz(quizObject);
        setMetadata(quizMetadata);
        setCurrentQuestion(qIndex);
        setIsStartingQuiz(false);
        setStage("quiz");
        console.log("🔀 Quiz randomized and stage set to quiz");
      }
    );

    newSocket.on("player-joined", ({ players: playerList }) => {
      console.log("👥 Player joined, updated player list:", playerList);
      setPlayers(playerList || []);
    });

    newSocket.on("player-left", ({ playerName: departedName }) => {
      if (departedName) {
        setPlayers((currentPlayers) => currentPlayers.filter((name) => name !== departedName));
      }
    });

    newSocket.on("player-removed", ({ playerName, players: playerList }) => {
      console.log(`🚫 Player removed: ${playerName}. Updated player list:`, playerList);
      setPlayers(playerList || []);
    });

    newSocket.on("player-kicked", (payload) => {
      const message = payload?.message;
      console.log("❌ You have been kicked from the quiz:", message);
      // Reset to initial state
      setStage("upload");
      setRoomCode("");
      setPlayers([]);
      setIsHost(false);
      setPlayerName("");
      setShowNamePrompt(true);
      setSocketError(message || "You have been removed from the room.");
      pendingAnswerRef.current = false;
      setAwaitingAnswer(false);
      setIsJoiningRoom(false);
      setIsCreatingRoom(false);
      setIsStartingQuiz(false);
    });

    newSocket.on("host-disconnected", () => {
      setSocketError("The host disconnected, so this room has closed.");
      setStage("upload");
      setRoomCode("");
      setPlayers([]);
      setIsHost(false);
      setPlayerName("");
      setShowNamePrompt(true);
      pendingAnswerRef.current = false;
      setAwaitingAnswer(false);
      setIsJoiningRoom(false);
      setIsCreatingRoom(false);
      setIsStartingQuiz(false);
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
      setIsStartingQuiz(false);
    });

    newSocket.on("quiz-finished", ({ leaderboard: lb }) => {
      console.log("🏁 Quiz finished! Leaderboard:", lb);
      setLeaderboard(lb);
      setStage("results");
      setIsStartingQuiz(false);
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
      setShowJoinPrompt(false);
      setShowNamePrompt(false);
      setSocketError("");
      setIsJoiningRoom(false);
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
        pendingAnswerRef.current = false;
        setAwaitingAnswer(false);
        setIsStartingQuiz(false);

        // Move to waiting stage
        setStage("waiting");
      }
    );

    newSocket.on(
      "answer-submitted",
        (payload) => {
          const { isCorrect, correctAnswer } = payload || {};
        console.log("📝 Answer submitted:", { isCorrect, correctAnswer });
        if (!pendingAnswerRef.current) return;
        pendingAnswerRef.current = false;
        setAwaitingAnswer(false);
        setSocketError("");
        const answeredQuestion = currentQuestionRef.current;
        if (answeredQuestion < (quizRef.current?.questions?.length || 0) - 1) {
          setCurrentQuestion(answeredQuestion + 1);
        }
      }
    );

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [mode]);

  useEffect(() => {
    if (!awaitingAnswer) return undefined;
    const timeout = setTimeout(() => {
      if (pendingAnswerRef.current) {
        pendingAnswerRef.current = false;
        setAwaitingAnswer(false);
        setSocketError("The server did not confirm your answer. Return home and rejoin the room before continuing.");
      }
    }, 15000);
    return () => clearTimeout(timeout);
  }, [awaitingAnswer]);

  useEffect(() => {
    if (mode !== "multiplayer" || status !== "unauthenticated" || !socket) return;
    socket.disconnect();
    setSocketConnected(false);
    setStage("upload");
    setRoomCode("");
    setPlayers([]);
    setIsHost(false);
    setPlayerName("");
    pendingAnswerRef.current = false;
    setAwaitingAnswer(false);
  }, [mode, status, socket]);

  useEffect(() => {
    if (mode !== "multiplayer" || status !== "authenticated" || !socket || socket.connected) return;
    connectionInterruptedRef.current = false;
    socket.connect();
  }, [mode, status, socket]);

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

  // Handlers
  const handleBackFromUpload = () => {
    router.push("/");
  };

  const handleQuizGenerated = (generatedQuiz, quizMetadata) => {
    // Keep quiz as an array for server compatibility
    const quizArray = Array.isArray(generatedQuiz)
      ? generatedQuiz
      : generatedQuiz?.questions || [];

    if (!isValidQuiz(quizArray)) {
      setSocketError("The generated quiz is incomplete. Please try generating it again.");
      return;
    }

    // Wrap in object for local use
    const quizObject = {
      questions: quizArray,
      ...quizMetadata,
    };

    setQuiz(quizObject);
    setMetadata(quizMetadata);
    setSocketError("");

    if (mode === "solo") {
      // Randomize questions and options for solo mode too
      const randomizedQuiz = randomizeQuiz(quizArray);
      setQuiz({ questions: randomizedQuiz, ...quizMetadata });
      setCurrentQuestion(0);
      setUserAnswers([]);
      setAnswerTimes([]); // Reset answer times for new quiz
      setStage("quiz");
    } else if (mode === "multiplayer") {
      // In multiplayer mode, if player hasn't chosen to create/join yet, prompt them
      if (!isHost && !roomCode) {
        console.log("📝 Quiz generated in multiplayer mode - showing name prompt");
        setShowNamePrompt(true);
        return;
      }

      // If they're the host (already clicked Create Room), create the room with the quiz
      if (isHost) {
        // Generate a 6-character room code
        const newRoomCode = createRoomCode();

        console.log("🎮 Host creating room with quiz:", newRoomCode);

        // Host creates room with the quiz (send array, not object)
        // Server will send original quiz, each client will randomize on their end
        if (!socket?.connected || connectionInterruptedRef.current) {
          setSocketError("Multiplayer is disconnected. Please wait for it to reconnect before creating a room.");
          return;
        }
        if (isCreatingRoom) return;
        setIsCreatingRoom(true);
        setSocketError("");
        try {
          socket.emit("create-room", {
            roomCode: newRoomCode,
            quiz: quizArray,
            metadata: quizMetadata,
            hostName: playerName,
          });
        } catch {
          setIsCreatingRoom(false);
          setSocketError("The room could not be created. Please try again.");
        }
      }
    }
  };

  const handleAnswer = (answer, timeSpent = 0) => {
    if (!quiz?.questions?.[currentQuestion] || !Number.isInteger(answer)) return false;
    if (answer < 0 || answer >= quiz.questions[currentQuestion].options.length) return false;
    if (mode === "multiplayer" && (!socket?.connected || connectionInterruptedRef.current)) {
      setSocketError("Your connection was lost before this answer could be submitted. Return home and rejoin the room.");
      return false;
    }
    console.log("🎯 Answer selected:", answer);
    console.log("🎯 Current question:", currentQuestion);
    console.log("🎯 Total questions:", quiz.questions.length);
    console.log("🎯 Mode:", mode);

    console.log(
      `⏱️ Time spent on Q${currentQuestion + 1}: ${timeSpent}ms (${(
        timeSpent / 1000
      ).toFixed(1)}s)`
    );

    // Get the current question data
    const currentQuestionData = quiz.questions[currentQuestion];

    // Convert answer index to answer text for consistent storage
    const selectedAnswerText = currentQuestionData.options[answer];

    if (mode === "multiplayer") {
      try {
        pendingAnswerRef.current = true;
        setAwaitingAnswer(true);
        socket.emit("submit-answer", {
          roomCode,
          questionIndex: currentQuestion,
          questionText: currentQuestionData.question,
          answerIndex: answer,
          selectedAnswerText,
          timeSpent,
        });
      } catch {
        pendingAnswerRef.current = false;
        setAwaitingAnswer(false);
        setSocketError("Your answer could not be submitted. Check your connection and try again.");
        return false;
      }
    }

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
      // The next question is shown after the server confirms this answer.
    }
    return true;
  };

  const handleCreateRoom = () => {
    if (isCreatingRoom) return;
    const cleanName = playerName.trim();
    if (!cleanName) {
      setSocketError("Please enter your name.");
      return;
    }
    if (cleanName.length > 24) {
      setSocketError("Your name must be 24 characters or fewer.");
      return;
    }
    if (!socket?.connected || connectionInterruptedRef.current) {
      setSocketError("Multiplayer is not connected yet. Please wait and try again.");
      return;
    }
    setPlayerName(cleanName);
    setSocketError("");
    setIsHost(true);
    setShowNamePrompt(false);
    
    // If quiz already generated, create room immediately
    if (quiz && quiz.questions && quiz.questions.length > 0) {
      const quizArray = quiz.questions;
      const newRoomCode = createRoomCode();
      
      console.log("🎮 Creating room immediately with existing quiz:", newRoomCode);
      
      setIsCreatingRoom(true);
      try {
        socket.emit("create-room", {
          roomCode: newRoomCode,
          quiz: quizArray,
          metadata: metadata,
          hostName: cleanName,
        });
      } catch {
        setIsCreatingRoom(false);
        setSocketError("The room could not be created. Please try again.");
      }
    } else {
      // No quiz yet, go back to upload stage
      setStage("upload");
    }
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setSocketError("Please enter your name before joining a room.");
      return;
    }
    setSocketError("");
    setShowNamePrompt(false);
    setShowJoinPrompt(true);
  };

  const handleJoinRoomSubmit = () => {
    if (isJoiningRoom) return;
    const cleanName = playerName.trim();
    if (!cleanName) {
      setSocketError("Please enter your name.");
      return;
    }
    if (cleanName.length > 24) {
      setSocketError("Your name must be 24 characters or fewer.");
      return;
    }
    const roomCodeUpper = joinRoomCode.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(roomCodeUpper)) {
      setSocketError("Enter a valid 6-character room code.");
      return;
    }

    if (!socket || !socket.connected || connectionInterruptedRef.current) {
      console.error("❌ Socket not connected yet!");
      setSocketError("Connection not ready. Please wait a moment and try again.");
      return;
    }

    setPlayerName(cleanName);
    setSocketError("");
    console.log(
      "🔄 Attempting to join room:",
      roomCodeUpper,
      "as player:",
      playerName
    );
    console.log("Socket connected:", socket.connected, "Socket ID:", socket.id);

    setIsJoiningRoom(true);
    try {
      socket.emit("join-room", {
        roomCode: roomCodeUpper,
        playerName: cleanName,
      });
    } catch {
      setIsJoiningRoom(false);
      setSocketError("Could not join the room. Check your connection and try again.");
    }
  };

  const handleStartQuiz = () => {
    if (isStartingQuiz) return;
    if (!socket?.connected || connectionInterruptedRef.current) {
      setSocketError("The multiplayer connection is unavailable. Reconnect before starting the quiz.");
      return;
    }
    if (players.length === 0) {
      setSocketError("Waiting for players to join...");
      return;
    }
    setSocketError("");
    setIsStartingQuiz(true);
    try {
      socket.emit("start-quiz", { roomCode });
    } catch {
      setIsStartingQuiz(false);
      setSocketError("Could not start the quiz. Please try again.");
    }
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
            connectionAvailable={socketConnected && !connectionInterruptedRef.current}
            starting={isStartingQuiz}
            onStartQuiz={handleStartQuiz}
          />
        );

      case "quiz":
        return (
          <QuizQuestion
            question={quiz?.questions?.[currentQuestion]}
            questionNumber={currentQuestion + 1}
            totalQuestions={quiz?.questions?.length || 0}
            onAnswer={handleAnswer}
            waitingForResponse={awaitingAnswer}
            onExit={handleReturnHome}
          />
        );

      case "waiting":
        return (
          <WaitingForResults
            roomCode={roomCode}
            playerStats={playerStats}
            totalQuestions={quiz.questions.length}
            onReturnHome={handleReturnHome}
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
  if (mode !== "solo" && mode !== "multiplayer") {
    notFound();
  }

  if (status === "loading") {
    return <Loader message="Loading QuizMaster" />;
  }

  // Authentication check
  if (!user && mode === "multiplayer") {
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
      {socketError && (
        <div role="alert" className="mx-auto mt-4 flex w-full max-w-3xl items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{socketError}</span>
          {stage !== "upload" && (
            <button type="button" onClick={handleReturnHome} className="shrink-0 font-semibold underline">
              Return home
            </button>
          )}
        </div>
      )}
      {renderStage()}

      {/* Name Prompt Modal for Multiplayer */}
      <AnimatePresence>
        {showNamePrompt && mode === "multiplayer" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="multiplayer-mode-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-violet-700" />
                  </div>
                  <h3 id="multiplayer-mode-title" className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Multiplayer Mode
                  </h3>
                </div>
                <button
                  onClick={() => router.push("/")}
                  type="button"
                  aria-label="Return home"
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="multiplayer-player-name" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <div className="relative">
                    <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      id="multiplayer-player-name"
                      value={playerName}
                      onChange={(e) => {
                        setPlayerName(e.target.value);
                        setSocketError("");
                      }}
                      maxLength={24}
                      placeholder="Enter your name"
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:ring-2 focus:ring-violet-200 outline-none transition-all"
                      autoFocus
                    />
                  </div>
                  {socketError && <p role="alert" className="mt-2 text-sm text-red-600">{socketError}</p>}
                  <p className={`mt-2 text-xs ${socketConnected ? "text-green-700" : "text-slate-500"}`}>
                    {socketConnected ? "Connected to multiplayer" : "Connecting to multiplayer…"}
                  </p>
                </div>

                <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                  <motion.button
                    onClick={handleCreateRoom}
                    whileHover={!isCreatingRoom && socketConnected ? { y: -2 } : undefined}
                    whileTap={!isCreatingRoom && socketConnected ? { scale: 0.98 } : undefined}
                    type="button"
                    disabled={isCreatingRoom || !socketConnected}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:bg-violet-700 hover:shadow-xl sm:px-6"
                  >
                    <Users className="w-5 h-5" />
                    {isCreatingRoom ? "Creating Room…" : "Create Room"}
                  </motion.button>
                  <motion.button
                    onClick={handleJoinRoom}
                    whileHover={!isCreatingRoom && socketConnected ? { y: -2 } : undefined}
                    whileTap={!isCreatingRoom && socketConnected ? { scale: 0.98 } : undefined}
                    type="button"
                    disabled={isCreatingRoom || !socketConnected}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-200 sm:px-6"
                  >
                    <LogIn className="w-5 h-5" />
                    Join Room
                  </motion.button>
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
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="join-room-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 id="join-room-title" className="text-xl font-bold text-gray-900 sm:text-2xl">
                    Join Room
                  </h3>
                </div>
                <button
                  type="button"
                  aria-label="Back to multiplayer choices"
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
                  <label htmlFor="join-room-code" className="block text-sm font-medium text-gray-700 mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    id="join-room-code"
                    value={joinRoomCode}
                    onChange={(e) => {
                      setJoinRoomCode(e.target.value.toUpperCase());
                      setSocketError("");
                    }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleJoinRoomSubmit()
                    }
                    placeholder="Enter 6-digit code"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all text-center text-2xl font-mono tracking-wider uppercase"
                    maxLength={6}
                    autoFocus
                  />
                  {socketError && <p role="alert" className="mt-2 text-sm text-red-600">{socketError}</p>}
                </div>

                <motion.button
                  onClick={handleJoinRoomSubmit}
                  whileHover={!isJoiningRoom && socketConnected ? { y: -2 } : undefined}
                  whileTap={!isJoiningRoom && socketConnected ? { scale: 0.98 } : undefined}
                  type="button"
                  disabled={isJoiningRoom || !socketConnected}
                  className="w-full bg-green-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-green-700 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <LogIn className="w-5 h-5" />
                  {isJoiningRoom ? "Joining…" : "Join Room"}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
