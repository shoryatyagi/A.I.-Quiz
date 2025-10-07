# Asynchronous Multiplayer Quiz Mode

## Overview

The multiplayer quiz mode has been completely redesigned to support **asynchronous gameplay** where each player progresses through questions at their own pace. Players are ranked based on **total time taken** and **number of correct answers**.

## How It Works

### Old Synchronous Mode (Removed):

- ❌ All players had to answer the same question at the same time
- ❌ Host controlled when to move to next question
- ❌ Ranking based on points (100 base + time bonus)

### New Asynchronous Mode:

- ✅ Each player answers questions at their own pace
- ✅ 15 seconds per question (no synchronization)
- ✅ Players can finish at different times
- ✅ Ranking based on total time + correct answers

## Ranking Algorithm

Players are ranked by:

1. **Primary:** Number of correct answers (more is better)
2. **Secondary:** Total time taken (less is better)

```javascript
leaderboard.sort((a, b) => {
  // First: More correct answers wins
  if (b.correctAnswers !== a.correctAnswers) {
    return b.correctAnswers - a.correctAnswers;
  }
  // Tiebreaker: Faster time wins
  return a.totalTime - b.totalTime;
});
```

### Example:

```
Player A: 8/10 correct, 120s total → Rank #1
Player B: 8/10 correct, 150s total → Rank #2 (same score, slower)
Player C: 7/10 correct, 90s total  → Rank #3 (fewer correct answers)
```

## Player Flow

### Host Experience:

1. Create room → Upload PDF
2. Wait in lobby for players to join
3. Click "Start Quiz"
4. Answer all 10 questions at own pace
5. Finish quiz → See "Waiting for other players..."
6. When all finish → See final leaderboard

### Player Experience:

1. Join room with code
2. Wait in lobby for host to start
3. Quiz starts → Answer questions independently
4. Each question has 15 seconds
5. Finish quiz → See "Waiting for other players..."
6. When all finish → See final leaderboard

## Game States

### 1. Mode Selection

Choose Solo or Multiplayer

### 2. Upload (Solo) / Lobby (Multiplayer)

- Solo: Upload PDF immediately
- Multiplayer: Create/Join room → See player list

### 3. Quiz

- Questions display one at a time
- 15-second timer per question
- Auto-advance after selection
- No instant feedback (answers shown at end)

### 4. Waiting (NEW - Multiplayer Only)

- Shown when you finish before others
- Animated waiting screen
- Displays:
  - "Quiz Completed! 🎉"
  - "Waiting for other players..."
  - Room code

### 5. Results

- Shows final leaderboard (multiplayer) or score (solo)
- Displays for each player:
  - Rank (🥇🥈🥉)
  - Name
  - Correct answers (X/10)
  - Total time taken
  - Average time per question
- Answer review section

## Technical Changes

### Server (server.js)

**Room Structure:**

```javascript
{
  roomCode: "ABC123",
  quiz: [...],
  host: "socket-id",
  hostName: "Alice",
  players: [
    {
      socketId: "socket-id",
      name: "Alice",
      totalTime: 0,      // ✅ NEW: Total milliseconds
      answers: [         // ✅ Modified: No points field
        {
          questionIndex: 0,
          answerIndex: 2,
          isCorrect: true,
          timeSpent: 5000
        }
      ]
    }
  ],
  started: false
}
```

**Socket Events:**

1. **`submit-answer`** (Client → Server)

   ```javascript
   socket.emit("submit-answer", {
     roomCode,
     questionIndex,
     answerIndex,
     timeSpent, // milliseconds for this question
   });
   ```

2. **`answer-submitted`** (Server → Client)

   ```javascript
   socket.on(
     "answer-submitted",
     ({ isCorrect, correctAnswer, explanation }) => {
       // Confirm answer was recorded
     }
   );
   ```

3. **`player-finished`** (Server → Client)

   ```javascript
   socket.on(
     "player-finished",
     ({ correctAnswers, totalQuestions, totalTime, avgTime }) => {
       // This player finished all questions
       // Show waiting screen
     }
   );
   ```

4. **`quiz-finished`** (Server → All in Room)
   ```javascript
   socket.on("quiz-finished", ({ leaderboard, quiz }) => {
     // All players finished
     // Show final results
   });
   ```

**Removed Events:**

- ❌ `next-question` (no longer needed - each player controls their own progression)
- ❌ `answer-result` with points (replaced with `answer-submitted`)

### Client (src/app/page.js)

**handleAnswer Function:**

```javascript
const handleAnswer = (answerIndex, timeSpent) => {
  if (mode === "solo") {
    // Solo logic unchanged
  } else {
    // Multiplayer: Asynchronous

    // 1. Store answer locally
    const newAnswers = [...userAnswers, answerIndex];
    setUserAnswers(newAnswers);

    // 2. Submit to server
    socket.emit("submit-answer", {
      roomCode,
      questionIndex: currentQuestion,
      answerIndex,
      timeSpent,
    });

    // 3. Auto-advance to next question
    setTimeout(() => {
      if (currentQuestion < quiz.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      }
      // Server will send "player-finished" when done
    }, 1000);
  }
};
```

**Socket Listeners:**

```javascript
socket.on("answer-submitted", ({ isCorrect, correctAnswer, explanation }) => {
  console.log("Answer submitted:", { isCorrect, correctAnswer });
});

socket.on(
  "player-finished",
  ({ correctAnswers, totalQuestions, totalTime, avgTime }) => {
    console.log("You finished!", { correctAnswers, totalQuestions, totalTime });
    setStage("waiting"); // Show waiting screen
  }
);

socket.on("quiz-finished", ({ leaderboard, quiz }) => {
  if (quiz) setQuiz(quiz);
  setLeaderboard(leaderboard);
  setStage("results");
});
```

### New Components

**WaitingForResults.js**

- Displays when player finishes before others
- Shows completion message
- Animated waiting indicator
- Explains ranking criteria
- Shows room code

**Updated QuizResults.js**

- New leaderboard display format
- Shows correct answers (not points)
- Shows total time and average time
- Ranking icons (🥇🥈🥉)
- Time formatting helper

## Metrics Displayed

### Leaderboard

For each player:

- **Rank:** Position based on correct answers + time
- **Name:** Player's display name
- **Correct Answers:** "8/10 correct"
- **Total Time:** "2m 15s total" (sum of all question times)
- **Average Time:** "(avg: 13.5s/question)"

### Individual Question Review

For each question:

- Question text
- Your answer (highlighted green if correct, red if wrong)
- Correct answer (if you got it wrong)
- Explanation

## Performance Optimizations

1. **No Waiting Between Questions**

   - Players don't wait for others
   - Faster overall game flow

2. **Server Calculates Leaderboard Once**

   - Only when all players finish
   - Sorted by correct answers, then time

3. **Minimal Socket Events**
   - Only essential data transmitted
   - No real-time score updates during quiz

## Testing Scenarios

### Scenario 1: Two Players, Different Speeds

```
Host: 10 questions in 90 seconds (9 correct)
Player: 10 questions in 120 seconds (9 correct)
Result: Host wins (same correct answers, faster time)
```

### Scenario 2: One Player Finishes Early

```
Host: Finishes at 60s → Sees "Waiting for other players..."
Player: Still on question 5
Host: Continues waiting
Player: Finishes at 120s
Both: See final leaderboard together
```

### Scenario 3: All Same Score

```
All players: 8/10 correct
Ranking: Sorted by total time (fastest first)
```

## Files Modified

### Server

- `server.js`
  - Updated `create-room` event handler
  - Updated `join-room` event handler
  - Completely rewrote `submit-answer` handler
  - Removed `next-question` handler
  - Added leaderboard calculation

### Client

- `src/app/page.js`
  - Updated `handleAnswer` function
  - Added new socket event listeners
  - Added "waiting" stage
  - Import WaitingForResults component

### Components

- `src/components/WaitingForResults.js` (NEW)

  - Waiting screen UI
  - Animated loading indicator
  - Ranking explanation

- `src/components/QuizResults.js`
  - Updated leaderboard display
  - Added time formatting
  - Shows correct answers instead of points
  - Added Clock and Target icons

## Advantages

✅ **Faster Games**

- No waiting for slow players
- Each player controls their pace

✅ **Fair Ranking**

- Correct answers matter most
- Speed is tiebreaker

✅ **Better UX**

- Less frustration
- More engaging
- Clear waiting states

✅ **Scalable**

- Works with any number of players
- No synchronization overhead

## Known Limitations

⚠️ **No Live Updates**

- Players don't see others' progress during quiz
- Could add live player count if desired

⚠️ **All Must Finish**

- Results only shown when everyone completes
- Could add timeout if needed

⚠️ **15-Second Timer**

- Currently hardcoded in QuizQuestion component
- Could make configurable

## Future Enhancements

💡 **Possible Additions:**

- Show "X/5 players finished" in waiting screen
- Add configurable time limit per question
- Allow host to set quiz duration
- Add "Skip question" option (counts as wrong)
- Show partial leaderboard while waiting

---

**Status:** ✅ **IMPLEMENTED AND READY FOR TESTING**

Server is running on `http://0.0.0.0:3000`
Test with multiple devices to experience asynchronous multiplayer!
