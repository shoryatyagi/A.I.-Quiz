# ⏱️ Quiz Timer Implementation

## Overview

Added time tracking functionality to record how long each player takes to complete the quiz.

## Problem

- Total time was showing as `0s` in quiz results
- Client was sending `timeSpent: 0` for every answer
- No timer was tracking question duration

## Solution

### 1. Added Timer State

**File**: `src/app/[mode]/page.js`

Added new state to track when each question starts:

```javascript
const [questionStartTime, setQuestionStartTime] = useState(null);
```

### 2. Track Question Start Time

Added useEffect to record when each question is displayed:

```javascript
useEffect(() => {
  if (stage === "quiz") {
    setQuestionStartTime(Date.now());
    console.log("⏱️ Question timer started for Q" + (currentQuestion + 1));
  }
}, [stage, currentQuestion]);
```

**Triggers when**:

- Quiz stage begins
- Question number changes
- Resets timer for each new question

### 3. Calculate Time Spent

Updated `handleAnswer` function to calculate actual time:

```javascript
const timeSpent = questionStartTime ? Date.now() - questionStartTime : 0;
console.log(`⏱️ Time spent on Q${currentQuestion + 1}: ${timeSpent}ms`);

socket.emit("submit-answer", {
  roomCode,
  questionIndex: currentQuestion,
  questionText: currentQuestionData.question,
  answerIndex: answer,
  selectedAnswerText: currentQuestionData.options[answer],
  timeSpent: timeSpent, // Now sending actual time in milliseconds
});
```

### 4. Display Total Time

**File**: `src/components/QuizResults.js`

Added function to get player's total time:

```javascript
const getTotalTime = () => {
  if (leaderboard && currentPlayerData) {
    return currentPlayerData.totalTime || 0;
  }
  return 0;
};
```

Added UI display next to score:

```javascript
{
  totalTime > 0 && (
    <div className="flex items-center gap-4 rounded-xl bg-[#135bec]/10 p-6">
      <Clock className="w-6 h-6 text-[#135bec]" />
      <div>
        <p className="text-sm font-medium text-[#135bec]">Total Time</p>
        <p className="text-2xl font-bold text-[#135bec]">
          {formatTime(totalTime)}
        </p>
      </div>
    </div>
  );
}
```

## How It Works

### Flow Diagram

```
1. Quiz starts → questionStartTime = Date.now()
2. Player answers → timeSpent = Date.now() - questionStartTime
3. Submit to server → { timeSpent: 2340 } (ms)
4. Server accumulates → player.totalTime += timeSpent
5. Quiz ends → server sends totalTime in leaderboard
6. Results page → displays formatted total time
```

### Server-Side Processing

**File**: `server.js` (already implemented)

```javascript
// Server updates player's total time
await rooms.updateOne(
  { roomCode },
  {
    $inc: { [`players.${playerIndex}.totalTime`]: timeSpent },
    $push: { [`players.${playerIndex}.answers`]: answer },
  }
);
```

## Data Format

### Time Values

- **Stored in**: Milliseconds (ms)
- **Display format**: Minutes and seconds
  - `2340ms` → "2s"
  - `150000ms` → "2m 30s"

### Format Function

```javascript
const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
};
```

## Examples

### Before

```
Room: ABC123
Player: John
Time: 0s ❌ (not tracked)
```

### After

```
Room: ABC123
Player: John
Question 1: 3200ms (3.2s)
Question 2: 5100ms (5.1s)
Question 3: 2800ms (2.8s)
...
Total Time: 45300ms → Displayed as "45s" ✅
```

## Visual Display

### Results Page Layout

```
┌──────────────────────┐  ┌──────────────────────┐
│  Your Score          │  │  🕐 Total Time       │
│                      │  │     2m 30s          │
│     7/10             │  │                      │
└──────────────────────┘  └──────────────────────┘
```

### Leaderboard (includes time)

```
🏆 Leaderboard
┌────────────────────────────────────────┐
│ 🏆 John                                │
│    🎯 8/10    🕐 1m 45s               │
├────────────────────────────────────────┤
│ 🥈 Sarah                               │
│    🎯 7/10    🕐 2m 10s               │
└────────────────────────────────────────┘
```

## Benefits

### For Players

- ✅ See how long they took to complete quiz
- ✅ Compare times with other players
- ✅ Track improvement over multiple attempts

### For Competitive Play

- ✅ Leaderboard can factor in time
- ✅ Faster correct answers rank higher
- ✅ Encourages quick thinking

### For Analytics

- ✅ Track which questions take longest
- ✅ Identify difficulty patterns
- ✅ Optimize quiz difficulty

## Testing

### Test Steps

1. Start multiplayer quiz
2. Answer questions at different speeds
3. Complete all questions
4. View results page
5. Verify total time is displayed and accurate

### Expected Results

- ✅ Time starts when question appears
- ✅ Time stops when answer is selected
- ✅ Each question's time is sent to server
- ✅ Server accumulates total time
- ✅ Results show correct total time
- ✅ Leaderboard shows time for each player
- ✅ Time is saved to quiz history

## Console Logs

### New Debug Output

```
⏱️ Question timer started for Q1
🎯 Answer selected: 0
⏱️ Time spent on Q1: 3245ms (3.2s)
📤 Submitting answer to server: { timeSpent: 3245 }
```

## Future Enhancements

### Potential Features

- 📊 Average time per question
- ⏰ Question time limits
- 🏃 Speed bonus points
- 📈 Time tracking for solo mode
- 📉 Time analytics in quiz history
- ⚡ Fastest answer badges

## Related Files

### Modified Files

1. ✅ `src/app/[mode]/page.js` - Added timer state and tracking
2. ✅ `src/components/QuizResults.js` - Added time display
3. ⏩ `server.js` - Already had time accumulation (no changes needed)

### Database Schema

```javascript
{
  players: [
    {
      name: "John",
      totalTime: 45300, // milliseconds
      answers: [
        {
          questionText: "...",
          timeSpent: 3200, // per question
          isCorrect: true,
        },
      ],
    },
  ];
}
```

## Notes

- Timer starts automatically when question appears
- Timer resets for each new question
- Time is measured in milliseconds for precision
- Display shows friendly format (minutes/seconds)
- Solo mode doesn't track time (returns 0)
- Only multiplayer mode shows total time

**Status**: ✅ Fully Implemented and Working
