"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import QuizCreator from "@/components/QuizCreator";
import QuizMode from "@/components/QuizMode";
import MultiplayerLobby from "@/components/MultiplayerLobby";
import QuizQuestion from "@/components/QuizQuestion";
import QuizResults from "@/components/QuizResults";
import WaitingForResults from "@/components/WaitingForResults";
import QuizSourceSelection from "@/components/QuizSourceSelection";
import LandingPage from "@/components/LandingPage";
import SignInPage from "@/components/SignInPage";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // State Management
  const [stage, setStage] = useState("landing"); // landing, signin, mode, source, upload, ai-generate, lobby, quiz, waiting, results
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
        metadata: quizMetadata,
      }) => {
        console.log("Quiz started event received:", {
          qIndex,
          totalQuestions,
          hasQuiz: !!quizData,
          hasMetadata: !!quizMetadata,
        });
        if (quizData) {
          // Randomize quiz for this specific client
          const randomizedQuiz = randomizeQuiz(quizData);
          setQuiz(randomizedQuiz);
        }
        if (quizMetadata) {
          // Set metadata for clients
          setMetadata(quizMetadata);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          metadata: meta, // Send metadata with quiz name
          hostName: playerName,
        });
      }
      setStage("lobby");
    }
  };

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode);

    if (selectedMode === "solo") {
      // Solo: go directly to quiz creator (skip source selection)
      setStage("upload"); // This will show QuizCreator with tabs
    } else {
      // Multiplayer: automatically use Google account name
      if (session?.user?.name) {
        setPlayerName(session.user.name);
        setShowNamePrompt(true);
      } else {
        alert("Please sign in to play multiplayer mode");
      }
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
    // Use session user's name automatically
    const name = session?.user?.name || playerName.trim();

    if (!name) {
      alert("Please enter your name");
      return;
    }

    setPlayerName(name);
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setIsHost(true);
    setRoomCode(code);
    setShowNamePrompt(false);
    // Go directly to quiz creator (skip source selection)
    setStage("upload");
  };

  const handleJoinRoom = () => {
    // Use session user's name automatically
    const name = session?.user?.name || playerName.trim();

    if (!name || !joinRoomCode.trim()) {
      alert("Please enter your name and room code");
      return;
    }

    setPlayerName(name);
    socket.emit("join-room", {
      roomCode: joinRoomCode.toUpperCase(),
      playerName: name,
    });
    setRoomCode(joinRoomCode.toUpperCase());
    setIsHost(false);
    setStage("lobby");
    setShowJoinPrompt(false);
  };

  const handleStartQuiz = () => {
    socket.emit("start-quiz", { roomCode });
  };

  const handleCancelLobby = () => {
    // Leave the room if joined
    if (socket && roomCode) {
      socket.emit("leave-room", { roomCode, playerName });
    }
    // Reset state
    setStage("landing");
    setMode(null);
    setRoomCode("");
    setIsHost(false);
    setPlayers([]);
    setQuiz(null);
    setMetadata(null);
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
    if (session) {
      setStage("landing"); // Always go to landing (which shows Solo/Multiplayer)
    } else {
      setStage("landing");
    }
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

  // Handle landing page mode selection (Solo or Multiplayer)
  const handleLandingModeSelect = (selectedMode) => {
    if (!session) {
      setStage("signin");
    } else {
      setMode(selectedMode);

      if (selectedMode === "solo") {
        // Solo: go directly to quiz creator with tabs (skip source selection)
        setStage("upload");
      } else {
        // Multiplayer: show name prompt, then source selection
        if (session?.user?.name) {
          setPlayerName(session.user.name);
          setShowNamePrompt(true);
        } else {
          alert("Please sign in to play multiplayer mode");
        }
      }
    }
  };

  // When user is not signed in, show landing or signin page
  if (!session && status !== "loading") {
    if (stage === "signin") {
      return <SignInPage />;
    }

    return (
      <LandingPage
        onSelectMode={handleLandingModeSelect}
        isAuthenticated={false}
      />
    );
  }

  return (
    <div className="bg-background-light">
      {/* Main Content */}
      <main className="container mx-auto py-8 px-4 min-h-[calc(100vh-120px)]">
        <AnimatePresence mode="wait">
          {stage === "landing" && (
            <motion.div
              key="landing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LandingPage
                onSelectMode={handleLandingModeSelect}
                isAuthenticated={true}
              />
            </motion.div>
          )}{" "}
          {stage === "mode" && (
            <motion.div key="mode">
              <QuizMode
                onModeSelect={handleModeSelect}
                onShowCreateRoom={() => setShowNamePrompt(true)}
                onShowJoinRoom={() => setShowJoinPrompt(true)}
              />
            </motion.div>
          )}
          {stage === "source" && (
            <motion.div key="source">
              <QuizSourceSelection onSelectSource={handleSourceSelect} />
            </motion.div>
          )}
          {(stage === "upload" || stage === "ai-generate") && (
            <motion.div key="create">
              <QuizCreator onQuizGenerated={handleQuizGenerated} />
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
                onCancel={handleCancelLobby}
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
                mode={mode}
                roomCode={roomCode}
                metadata={metadata}
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

            {session?.user && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Playing as:</p>
                <div className="flex items-center gap-2">
                  {session.user.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="font-semibold text-gray-800">
                    {session.user.name}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Enter your name"
                value={session?.user?.name || playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={!!session?.user?.name}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleCreateRoom}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all cursor-pointer"
              >
                Create Room
              </button>
              <button
                onClick={() => {
                  setShowNamePrompt(false);
                  setShowJoinPrompt(true);
                }}
                className="bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all cursor-pointer"
              >
                Join Room
              </button>
            </div>

            <button
              onClick={() => {
                setShowNamePrompt(false);
                setMode(null);
              }}
              className="w-full mt-4 text-gray-600 hover:text-gray-800 text-sm cursor-pointer"
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

            {session?.user && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Playing as:</p>
                <div className="flex items-center gap-2">
                  {session.user.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <span className="font-semibold text-gray-800">
                    {session.user.name}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-4 mb-6">
              <input
                type="text"
                placeholder="Enter your name"
                value={session?.user?.name || playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                disabled={!!session?.user?.name}
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
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all cursor-pointer"
              >
                Join
              </button>
              <button
                onClick={() => {
                  setShowJoinPrompt(false);
                  setShowNamePrompt(true);
                }}
                className="bg-gray-200 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-300 transition-all cursor-pointer"
              >
                Back
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
