# Solo Mode Time Tracking Implementation

## Issue
Time was not being recorded for solo mode quizzes. The quiz results would show "0s" or no time at all, while multiplayer mode correctly tracked time.

## Root Cause
In `QuizResults.js`, the `getTotalTime()` function explicitly returned `0` for solo mode:

```javascript
const getTotalTime = () => {
  if (leaderboard && currentPlayerData) {
    // For multiplayer, get current player's total time
    return currentPlayerData.totalTime || 0;
  }
  // For solo mode, we don't track time currently ❌
  return 0;
};
```

While the `[mode]/page.js` component was calculating `timeSpent` for each question, it wasn't storing or passing this data for solo mode - only for multiplayer.

## Solution

### 1. Added State to Track Answer Times (`src/app/[mode]/page.js`)

**Added new state variable:**
```javascript
const [answerTimes, setAnswerTimes] = useState([]); // Track time spent on each question
```

### 2. Store Time for Each Answer in Solo Mode

**In `handleAnswer` function:**
```javascript
// Track time spent for solo mode
if (mode === "solo") {
  const newAnswerTimes = [...answerTimes, timeSpent];
  setAnswerTimes(newAnswerTimes);
}
```

### 3. Reset Times When Starting New Quiz

**In `handleQuizGenerated` function:**
```javascript
if (mode === "solo") {
  setCurrentQuestion(0);
  setUserAnswers([]);
  setAnswerTimes([]); // Reset answer times for new quiz
  setStage("quiz");
}
```

### 4. Pass Times to QuizResults Component

**Updated QuizResults props:**
```javascript
<QuizResults
  quiz={quiz.questions}
  metadata={metadata}
  userAnswers={userAnswers}
  answerTimes={answerTimes} // ✅ New prop
  mode={mode}
  leaderboard={leaderboard}
  playerName={playerName}
  roomCode={roomCode}
  onPlayAgain={handleReturnHome}
/>
```

### 5. Calculate Total Time in QuizResults

**Updated `QuizResults.js`:**

**Component props:**
```javascript
export default function QuizResults({
  quiz,
  userAnswers,
  answerTimes = [], // ✅ New prop with default empty array
  leaderboard = null,
  playerName = "",
  onPlayAgain,
  mode = "solo",
  roomCode = null,
  metadata = null,
}) {
```

**Updated `getTotalTime` function:**
```javascript
const getTotalTime = () => {
  if (leaderboard && currentPlayerData) {
    // For multiplayer, get current player's total time
    return currentPlayerData.totalTime || 0;
  }
  // For solo mode, calculate total time from answerTimes array ✅
  if (mode === "solo" && answerTimes.length > 0) {
    return answerTimes.reduce((total, time) => total + time, 0);
  }
  return 0;
};
```

## How It Works

### Data Flow for Solo Mode

1. **Question Starts**
   - `questionStartTime` is set to `Date.now()`
   - Timer in `QuizQuestion` component starts counting

2. **User Answers**
   - `handleAnswer` is called with the selected answer
   - `timeSpent` is calculated: `Date.now() - questionStartTime`
   - Time is stored in `answerTimes` array
   - Example: `[2340, 5120, 3890, ...]` (milliseconds)

3. **Quiz Completes**
   - All times are in `answerTimes` array
   - User sees results screen

4. **Results Display**
   - `getTotalTime()` sums all times: `answerTimes.reduce((total, time) => total + time, 0)`
   - Total is displayed in results
   - Total is saved to quiz history

### Example Time Tracking

```javascript
// Question 1: 2.3 seconds
answerTimes = [2340]

// Question 2: 5.1 seconds
answerTimes = [2340, 5120]

// Question 3: 3.8 seconds
answerTimes = [2340, 5120, 3890]

// ... after all 10 questions
answerTimes = [2340, 5120, 3890, 4560, 2890, 6230, 3450, 4120, 5670, 3340]

// Total time
const totalTime = answerTimes.reduce((total, time) => total + time, 0)
// totalTime = 41610ms = 41.6 seconds
```

## Time Display Format

The `formatTime()` function converts milliseconds to human-readable format:

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

**Examples:**
- `2340ms` → `"2s"`
- `65000ms` → `"1m 5s"`
- `125000ms` → `"2m 5s"`

## What Gets Saved to History

When the quiz is saved to history, the total time is included:

```javascript
const historyData = {
  quizTitle: metadata?.topic || metadata?.filename || "Quiz",
  mode: mode,
  roomCode: roomCode,
  score: score,
  totalQuestions: totalQuestions,
  percentage: percentage,
  totalTime: totalTime, // ✅ Now includes time for solo mode
  // ... other data
};
```

## Comparison: Solo vs Multiplayer Time Tracking

### Solo Mode (New Implementation)
```
[User] → Answer Q1 (2.3s) → Store in answerTimes[0]
[User] → Answer Q2 (5.1s) → Store in answerTimes[1]
...
[Results] → Sum all times → Display total
```

### Multiplayer Mode (Existing)
```
[Client] → Answer Q1 (2.3s) → Send to server
[Server] → Track time + calculate score
[Server] → Send totalTime back to client
[Results] → Display server-calculated time
```

## Files Changed

### 1. `src/app/[mode]/page.js`
- ✅ Added `answerTimes` state
- ✅ Store time for each answer in solo mode
- ✅ Reset times when starting new quiz
- ✅ Pass `answerTimes` to QuizResults

### 2. `src/components/QuizResults.js`
- ✅ Accept `answerTimes` prop
- ✅ Calculate total time for solo mode
- ✅ Display time in results
- ✅ Save time to history

## Testing Scenarios

### Solo Mode with PDF
1. Upload PDF ✅
2. Generate quiz ✅
3. Answer questions (time tracked per question) ✅
4. View results → Time displayed ✅
5. Check history → Time saved ✅

### Solo Mode with AI
1. Enter topic ✅
2. Generate quiz ✅
3. Answer questions (time tracked per question) ✅
4. View results → Time displayed ✅
5. Check history → Time saved ✅

### Multiplayer Mode
1. Create/join room ✅
2. Answer questions ✅
3. View results → Time from server displayed ✅
4. Check history → Time saved ✅

### Edge Cases
| Scenario | Expected Behavior |
|----------|------------------|
| No answers yet | totalTime = 0 |
| Partial quiz | Sum only answered questions |
| Very fast answers | Accurate to millisecond |
| Very slow answers | Accurate regardless of duration |
| Page refresh mid-quiz | Time resets (by design) |

## Performance Considerations

- **Memory**: Stores one number per question (minimal)
- **Calculation**: O(n) where n = number of questions (negligible)
- **Accuracy**: Millisecond precision
- **No Impact**: On quiz loading or rendering

## Benefits

✅ **Complete Tracking**: Solo mode now has full time tracking  
✅ **Consistent**: Both solo and multiplayer track time  
✅ **Accurate**: Per-question timing with millisecond precision  
✅ **History**: Time is saved for future reference  
✅ **User Insight**: Users can see how long they took  
✅ **Performance**: No impact on quiz performance  

## Status
✅ **IMPLEMENTED** - Time tracking now works for solo mode quizzes
