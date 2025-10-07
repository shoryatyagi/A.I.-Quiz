const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const { getRoomsCollection } = require("./src/lib/mongodb");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0"; // Listen on all network interfaces
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store socket ID to room mapping in memory (lightweight)
const socketRooms = new Map();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
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
        const rooms = await getRoomsCollection();
        const room = await rooms.findOne({ roomCode });

        if (!room) {
          socket.emit("error", { message: "Room not found" });
          return;
        }

        if (room.started) {
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

        io.to(roomCode).emit("player-joined", {
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
          const rooms = await getRoomsCollection();
          const room = await rooms.findOne({ roomCode });

          if (!room) return;

          const playerIndex = room.players.findIndex(
            (p) => p.socketId === socket.id
          );
          if (playerIndex === -1) return;

          // Find the question in the ORIGINAL quiz by matching the question text
          // This works even when the client has a randomized question order
          const question = room.quiz.find((q) => q.question === questionText);

          if (!question) {
            console.error(`Question not found: "${questionText}"`);
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

          if (player.answers.length === room.quiz.length) {
            // Player finished the quiz
            const correctAnswers = player.answers.filter(
              (a) => a.isCorrect
            ).length;
            const totalTime = player.totalTime;
            const avgTime = totalTime / room.quiz.length;

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
                });

              io.to(roomCode).emit("quiz-finished", {
                leaderboard,
                quiz: room.quiz,
              });

              console.log(`Quiz finished in room: ${roomCode}`);
            }
          }
        } catch (error) {
          console.error("Error submitting answer:", error);
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
            console.log(`Room ${roomCode} closed (host disconnected)`);
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
            }
          }
        }

        socketRooms.delete(socket.id);
      } catch (error) {
        console.error("Error handling disconnect:", error);
      }
    });
  });

  server
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
