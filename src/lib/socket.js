import { Server } from "socket.io";

let io;

// Store active quiz rooms
const rooms = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Create a new quiz room
    socket.on("create-room", ({ roomCode, quiz, hostName }) => {
      rooms.set(roomCode, {
        quiz,
        host: socket.id,
        hostName,
        players: new Map([
          [socket.id, { name: hostName, score: 0, answers: [] }],
        ]),
        currentQuestion: -1,
        started: false,
      });

      socket.join(roomCode);
      socket.emit("room-created", { roomCode });
      console.log(`Room created: ${roomCode}`);
    });

    // Join an existing room
    socket.on("join-room", ({ roomCode, playerName }) => {
      const room = rooms.get(roomCode);

      if (!room) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      if (room.started) {
        socket.emit("error", { message: "Quiz already started" });
        return;
      }

      room.players.set(socket.id, { name: playerName, score: 0, answers: [] });
      socket.join(roomCode);

      // Notify all players in the room
      const playerList = Array.from(room.players.values()).map((p) => p.name);
      io.to(roomCode).emit("player-joined", {
        playerName,
        players: playerList,
        totalPlayers: room.players.size,
      });

      console.log(`${playerName} joined room: ${roomCode}`);
    });

    // Start the quiz
    socket.on("start-quiz", ({ roomCode }) => {
      const room = rooms.get(roomCode);

      if (!room || room.host !== socket.id) {
        socket.emit("error", { message: "Only host can start the quiz" });
        return;
      }

      room.started = true;
      room.currentQuestion = 0;

      io.to(roomCode).emit("quiz-started", {
        currentQuestion: 0,
        question: room.quiz[0],
        totalQuestions: room.quiz.length,
      });

      console.log(`Quiz started in room: ${roomCode}`);
    });

    // Submit an answer
    socket.on(
      "submit-answer",
      ({ roomCode, questionIndex, answerIndex, timeSpent }) => {
        const room = rooms.get(roomCode);

        if (!room) return;

        const player = room.players.get(socket.id);
        if (!player) return;

        const question = room.quiz[questionIndex];
        const isCorrect = answerIndex === question.correctAnswer;

        // Calculate score with time bonus
        let points = 0;
        if (isCorrect) {
          const basePoints = 100;
          const timeBonus = Math.max(0, 50 - Math.floor(timeSpent / 1000) * 2);
          points = basePoints + timeBonus;
        }

        player.score += points;
        player.answers.push({
          questionIndex,
          answerIndex,
          isCorrect,
          points,
          timeSpent,
        });

        // Notify the player
        socket.emit("answer-result", {
          isCorrect,
          points,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
        });

        console.log(
          `${player.name} answered question ${questionIndex}: ${
            isCorrect ? "correct" : "incorrect"
          }`
        );
      }
    );

    // Move to next question
    socket.on("next-question", ({ roomCode }) => {
      const room = rooms.get(roomCode);

      if (!room || room.host !== socket.id) return;

      room.currentQuestion++;

      if (room.currentQuestion < room.quiz.length) {
        io.to(roomCode).emit("next-question", {
          currentQuestion: room.currentQuestion,
          question: room.quiz[room.currentQuestion],
        });
      } else {
        // Quiz finished - send final results
        const leaderboard = Array.from(room.players.values())
          .map((player, index) => ({
            name: player.name,
            score: player.score,
            answers: player.answers,
          }))
          .sort((a, b) => b.score - a.score);

        io.to(roomCode).emit("quiz-finished", {
          leaderboard,
          quiz: room.quiz,
        });

        console.log(`Quiz finished in room: ${roomCode}`);
      }
    });

    // Get current leaderboard
    socket.on("get-leaderboard", ({ roomCode }) => {
      const room = rooms.get(roomCode);
      if (!room) return;

      const leaderboard = Array.from(room.players.values())
        .map((player) => ({
          name: player.name,
          score: player.score,
        }))
        .sort((a, b) => b.score - a.score);

      socket.emit("leaderboard-update", { leaderboard });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      // Remove player from all rooms
      rooms.forEach((room, roomCode) => {
        if (room.players.has(socket.id)) {
          const player = room.players.get(socket.id);
          room.players.delete(socket.id);

          // If host disconnected, close the room
          if (room.host === socket.id) {
            io.to(roomCode).emit("host-disconnected");
            rooms.delete(roomCode);
            console.log(`Room ${roomCode} closed (host disconnected)`);
          } else {
            // Notify remaining players
            io.to(roomCode).emit("player-left", {
              playerName: player.name,
              totalPlayers: room.players.size,
            });
          }
        }
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
