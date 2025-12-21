const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { MongoClient } = require("mongodb");

// Inline MongoDB connection for standalone Docker build
let mongoClient;
let mongoDb;

async function connectToDatabase() {
  if (mongoDb) {
    return { client: mongoClient, db: mongoDb };
  }

  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME;

  try {
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
    console.log("Server: Connected to MongoDB");

    mongoDb = mongoClient.db(dbName);

    // Create indexes for better performance
    await mongoDb
      .collection("rooms")
      .createIndex({ roomCode: 1 }, { unique: true });
    await mongoDb
      .collection("rooms")
      .createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // Auto-delete after 24 hours

    return { client: mongoClient, db: mongoDb };
  } catch (error) {
    console.error("Server: MongoDB connection error:", error);
    throw error;
  }
}

async function getRoomsCollection() {
  const { db } = await connectToDatabase();
  return db.collection("rooms");
}

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // Listen on all network interfaces
const port = process.env.PORT || 3000;

// Security: Allowed origins for CORS
const getAllowedOrigins = () => {
  const origins = ["http://localhost:3000", "http://127.0.0.1:3000"];

  // Add production URL if set
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    origins.push(process.env.NEXT_PUBLIC_SITE_URL);
  }

  // Add custom allowed origins from env
  if (process.env.ALLOWED_ORIGINS) {
    origins.push(...process.env.ALLOWED_ORIGINS.split(","));
  }

  return origins;
};

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store socket ID to room mapping in memory (lightweight)
const socketRooms = new Map();

// Rate limiting for socket connections
const connectionAttempts = new Map();
const MAX_CONNECTIONS_PER_IP = 10;
const CONNECTION_WINDOW_MS = 60000; // 1 minute

const checkRateLimit = (ip) => {
  const now = Date.now();
  const attempts = connectionAttempts.get(ip) || [];

  // Clean old attempts
  const recentAttempts = attempts.filter(
    (time) => now - time < CONNECTION_WINDOW_MS
  );

  if (recentAttempts.length >= MAX_CONNECTIONS_PER_IP) {
    return false;
  }

  recentAttempts.push(now);
  connectionAttempts.set(ip, recentAttempts);
  return true;
};

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, attempts] of connectionAttempts.entries()) {
    const recentAttempts = attempts.filter(
      (time) => now - time < CONNECTION_WINDOW_MS
    );
    if (recentAttempts.length === 0) {
      connectionAttempts.delete(ip);
    } else {
      connectionAttempts.set(ip, recentAttempts);
    }
  }
}, 60000);

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      // Security headers
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("X-Frame-Options", "DENY");
      res.setHeader("X-XSS-Protection", "1; mode=block");
      res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

      if (!dev) {
        res.setHeader(
          "Strict-Transport-Security",
          "max-age=31536000; includeSubDomains"
        );
      }

      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const allowedOrigins = getAllowedOrigins();

  const io = new Server(server, {
    cors: {
      origin: dev ? "*" : allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Security settings
    pingTimeout: 60000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e6, // 1MB max message size
    connectTimeout: 45000,
  });

  // Socket.IO middleware for rate limiting
  io.use((socket, next) => {
    const clientIp =
      socket.handshake.headers["x-forwarded-for"] ||
      socket.handshake.address ||
      "unknown";

    if (!checkRateLimit(clientIp)) {
      console.warn(`⚠️ Rate limit exceeded for IP: ${clientIp}`);
      return next(
        new Error("Too many connection attempts. Please try again later.")
      );
    }

    next();
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create-room", async ({ roomCode, quiz, metadata, hostName }) => {
      try {
        const rooms = await getRoomsCollection();

        // Check if room already exists
        const existingRoom = await rooms.findOne({ roomCode });
        if (existingRoom) {
          socket.emit("error", { message: "Room code already exists" });
          return;
        }

        const room = {
          roomCode,
          quiz,
          metadata, // Store metadata with quiz name
          host: socket.id,
          hostName,
          players: [
            {
              socketId: socket.id,
              name: hostName,
              totalTime: 0,
              answers: [],
            },
          ],
          currentQuestion: -1,
          started: false,
          createdAt: new Date(),
        };

        await rooms.insertOne(room);
        socket.join(roomCode);
        socketRooms.set(socket.id, roomCode);

        // Send room-created with initial players list
        const playerList = room.players.map((p) => p.name);
        socket.emit("room-created", {
          roomCode,
          players: playerList,
        });
        console.log(`Room created: ${roomCode}`);
      } catch (error) {
        console.error("Error creating room:", error);
        socket.emit("error", { message: "Failed to create room" });
      }
    });

    socket.on("join-room", async ({ roomCode, playerName }) => {
      try {
        console.log(
          `🔄 Player "${playerName}" attempting to join room: ${roomCode}`
        );

        const rooms = await getRoomsCollection();
        const room = await rooms.findOne({ roomCode });

        if (!room) {
          console.error(`❌ Room not found: ${roomCode}`);
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (room.started) {
          console.error(`❌ Room ${roomCode} already started`);
          socket.emit("error", { message: "Quiz already started" });
          return;
        }

        // Add player to room
        const newPlayer = {
          socketId: socket.id,
          name: playerName,
          totalTime: 0,
          answers: [],
        };

        await rooms.updateOne({ roomCode }, { $push: { players: newPlayer } });

        socket.join(roomCode);
        socketRooms.set(socket.id, roomCode);

        const updatedRoom = await rooms.findOne({ roomCode });
        const playerList = updatedRoom.players.map((p) => p.name);

        console.log(
          `✅ ${playerName} joined room: ${roomCode}. Players:`,
          playerList
        );

        // Emit to the joining player that they successfully joined
        socket.emit("joined-room", {
          roomCode,
          players: playerList,
        });

        // Notify all other players in the room
        socket.to(roomCode).emit("player-joined", {
          playerName,
          players: playerList,
          totalPlayers: updatedRoom.players.length,
        });

        console.log(`${playerName} joined room: ${roomCode}`);
      } catch (error) {
        console.error("Error joining room:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("remove-player", async ({ roomCode, playerName }) => {
      try {
        console.log(
          `🚫 Host requesting to remove player: ${playerName} from room: ${roomCode}`
        );

        const rooms = await getRoomsCollection();
        const room = await rooms.findOne({ roomCode });

        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        // Verify that the requester is the host
        if (room.host !== socket.id) {
          socket.emit("error", { message: "Only host can remove players" });
          return;
        }

        // Find the player to remove
        const playerToRemove = room.players.find((p) => p.name === playerName);
        if (!playerToRemove) {
          socket.emit("error", { message: "Player not found in room" });
          return;
        }

        // Prevent host from removing themselves
        if (playerToRemove.socketId === socket.id) {
          socket.emit("error", { message: "Host cannot remove themselves" });
          return;
        }

        // Remove player from database
        await rooms.updateOne(
          { roomCode },
          { $pull: { players: { name: playerName } } }
        );

        // Get updated room data
        const updatedRoom = await rooms.findOne({ roomCode });
        const playerList = updatedRoom.players.map((p) => p.name);

        // Notify the kicked player
        io.to(playerToRemove.socketId).emit("player-kicked", {
          message: "You have been removed from the quiz by the host",
        });

        // Remove the player from the socket room
        const kickedSocket = io.sockets.sockets.get(playerToRemove.socketId);
        if (kickedSocket) {
          kickedSocket.leave(roomCode);
          socketRooms.delete(playerToRemove.socketId);
        }

        // Notify remaining players
        io.to(roomCode).emit("player-removed", {
          playerName,
          players: playerList,
          totalPlayers: updatedRoom.players.length,
        });

        console.log(
          `✅ Removed ${playerName} from room ${roomCode}. Remaining players:`,
          playerList
        );
      } catch (error) {
        console.error("Error removing player:", error);
        socket.emit("error", { message: "Failed to remove player" });
      }
    });

    socket.on("start-quiz", async ({ roomCode }) => {
      try {
        const rooms = await getRoomsCollection();
        const room = await rooms.findOne({ roomCode });

        if (!room || room.host !== socket.id) {
          socket.emit("error", { message: "Only host can start the quiz" });
          return;
        }

        await rooms.updateOne(
          { roomCode },
          {
            $set: {
              started: true,
              currentQuestion: 0,
            },
          }
        );

        io.to(roomCode).emit("quiz-started", {
          currentQuestion: 0,
          question: room.quiz[0],
          totalQuestions: room.quiz.length,
          quiz: room.quiz, // Send the full quiz array
          metadata: room.metadata, // Send metadata to clients
        });

        console.log(`Quiz started in room: ${roomCode}`);
      } catch (error) {
        console.error("Error starting quiz:", error);
        socket.emit("error", { message: "Failed to start quiz" });
      }
    });

    socket.on(
      "submit-answer",
      async ({
        roomCode,
        questionIndex,
        questionText,
        answerIndex,
        selectedAnswerText,
        timeSpent,
      }) => {
        try {
          console.log(
            `📝 Answer submitted - Room: ${roomCode}, Q${
              questionIndex + 1
            }: "${selectedAnswerText}"`
          );

          const rooms = await getRoomsCollection();
          const room = await rooms.findOne({ roomCode });

          if (!room) {
            console.error(`❌ Room not found: ${roomCode}`);
            return;
          }

          const playerIndex = room.players.findIndex(
            (p) => p.socketId === socket.id
          );
          if (playerIndex === -1) {
            console.error(`❌ Player not found in room: ${socket.id}`);
            return;
          }

          // Find the question in the ORIGINAL quiz by matching the question text
          // This works even when the client has a randomized question order
          const question = room.quiz.find((q) => q.question === questionText);

          if (!question) {
            console.error(`❌ Question not found: "${questionText}"`);
            return;
          }

          // Compare the selected answer TEXT with the correct answer TEXT
          // This works even when options are shuffled on the client side
          const correctAnswerText = question.options[question.correctAnswer];
          const isCorrect = selectedAnswerText === correctAnswerText;

          console.log(`Player answer check:
            Question: ${questionText.substring(0, 50)}...
            Selected: "${selectedAnswerText}"
            Correct: "${correctAnswerText}"
            Result: ${isCorrect ? "✅ CORRECT" : "❌ WRONG"}
          `);

          const answer = {
            questionIndex, // Client's randomized index (for reference)
            questionText, // Store question text for matching with client's randomized quiz
            answerIndex, // Client's shuffled index (for their UI)
            selectedAnswerText, // The actual text they selected
            correctAnswerText, // Store the correct answer text too
            isCorrect,
            timeSpent,
          };

          // Update player's answers and total time
          await rooms.updateOne(
            { roomCode },
            {
              $inc: { [`players.${playerIndex}.totalTime`]: timeSpent },
              $push: { [`players.${playerIndex}.answers`]: answer },
            }
          );

          // Send result back to this player only
          socket.emit("answer-submitted", {
            isCorrect,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
          });

          // Check if this player has finished all questions
          const updatedRoom = await rooms.findOne({ roomCode });
          const player = updatedRoom.players[playerIndex];

          console.log(
            `📊 Player progress: ${player.answers.length}/${room.quiz.length} questions`
          );

          if (player.answers.length === room.quiz.length) {
            // Player finished the quiz
            const correctAnswers = player.answers.filter(
              (a) => a.isCorrect
            ).length;
            const totalTime = player.totalTime;
            const avgTime = totalTime / room.quiz.length;

            console.log(
              `🏁 Player finished! Score: ${correctAnswers}/${room.quiz.length}`
            );

            socket.emit("player-finished", {
              correctAnswers,
              totalQuestions: room.quiz.length,
              totalTime,
              avgTime,
            });

            // Check if all players have finished
            const allFinished = updatedRoom.players.every(
              (p) => p.answers.length === room.quiz.length
            );

            if (allFinished) {
              console.log(`🎉 All players finished in room ${roomCode}!`);
              // Calculate final leaderboard
              const leaderboard = updatedRoom.players
                .map((p) => {
                  const correct = p.answers.filter((a) => a.isCorrect).length;
                  const totalTime = p.totalTime || 0;
                  const avgTime = totalTime / room.quiz.length;

                  return {
                    name: p.name,
                    correctAnswers: correct,
                    totalTime,
                    avgTime,
                    answers: p.answers,
                  };
                })
                .sort((a, b) => {
                  // First sort by correct answers (more is better)
                  if (b.correctAnswers !== a.correctAnswers) {
                    return b.correctAnswers - a.correctAnswers;
                  }
                  // Then by total time (less is better)
                  return a.totalTime - b.totalTime;
                })
                .map((player, index) => ({
                  ...player,
                  rank: index + 1, // Add rank position (1st, 2nd, 3rd, etc.)
                }));

              console.log(
                "🏆 Leaderboard with ranks:",
                leaderboard.map((p) => ({
                  name: p.name,
                  rank: p.rank,
                  score: p.correctAnswers,
                }))
              );

              io.to(roomCode).emit("quiz-finished", {
                leaderboard,
                quiz: room.quiz,
              });

              console.log(`Quiz finished in room: ${roomCode}`);

              // Auto-delete room after 60 seconds (gives time to view results)
              setTimeout(async () => {
                try {
                  const rooms = await getRoomsCollection();
                  const deletedRoom = await rooms.findOne({ roomCode });

                  if (deletedRoom) {
                    await rooms.deleteOne({ roomCode });
                    console.log(
                      `🗑️ Room ${roomCode} auto-deleted 60s after quiz completion`
                    );
                  }
                } catch (error) {
                  console.error(
                    `❌ Error auto-deleting room ${roomCode}:`,
                    error
                  );
                }
              }, 60000); // 60 seconds delay
            } else {
              // Not all players finished
              console.log(`⏳ Waiting for other players in room ${roomCode}`);
              console.log(
                `📊 ${
                  updatedRoom.players.filter(
                    (p) => p.answers.length === room.quiz.length
                  ).length
                }/${updatedRoom.players.length} players finished`
              );

              // No need to emit anything - player-finished event already handled the waiting state
            }
          }
        } catch (error) {
          console.error("❌ Error submitting answer:", error);
        }
      }
    );

    socket.on("get-leaderboard", async ({ roomCode }) => {
      try {
        const rooms = await getRoomsCollection();
        const room = await rooms.findOne({ roomCode });

        if (!room) return;

        const leaderboard = room.players
          .map((player) => ({
            name: player.name,
            score: player.score,
          }))
          .sort((a, b) => b.score - a.score);

        socket.emit("leaderboard-update", { leaderboard });
      } catch (error) {
        console.error("Error getting leaderboard:", error);
      }
    });

    socket.on("disconnect", async () => {
      console.log("User disconnected:", socket.id);

      try {
        const roomCode = socketRooms.get(socket.id);
        if (!roomCode) return;

        const rooms = await getRoomsCollection();
        const room = await rooms.findOne({ roomCode });

        if (room) {
          const player = room.players.find((p) => p.socketId === socket.id);

          if (room.host === socket.id) {
            // Host disconnected - notify and delete room
            io.to(roomCode).emit("host-disconnected");
            await rooms.deleteOne({ roomCode });
            console.log(`🗑️ Room ${roomCode} closed (host disconnected)`);
          } else if (player) {
            // Regular player disconnected - remove from room
            await rooms.updateOne(
              { roomCode },
              { $pull: { players: { socketId: socket.id } } }
            );

            const updatedRoom = await rooms.findOne({ roomCode });
            if (updatedRoom) {
              io.to(roomCode).emit("player-left", {
                playerName: player.name,
                totalPlayers: updatedRoom.players.length,
              });

              // Check if room is now empty (no players left)
              if (updatedRoom.players.length === 0) {
                await rooms.deleteOne({ roomCode });
                console.log(`🗑️ Room ${roomCode} deleted (all players left)`);
              }
            }
          }
        }

        socketRooms.delete(socket.id);
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    // Close all socket connections
    io.close(() => {
      console.log("Socket.IO connections closed");
    });

    server.close(() => {
      console.log("HTTP server closed");
      process.exit(0);
    });

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error("Forcing shutdown after timeout");
      process.exit(1);
    }, 10000);
  };

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Environment: ${dev ? "development" : "production"}`);
    });
});
