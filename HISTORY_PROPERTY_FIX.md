# Quiz History Details Page - Property Name Fix

## Issue

Runtime error when viewing quiz details:

```
TypeError: can't access property 0, quiz.results is undefined
```

## Root Cause

The quiz details page was using `quiz.results` to access questions, but the actual property name in the database schema is `quiz.questions`.

## Fix Applied

### Changed Property Names:

1. **Questions Array**

   - ❌ Before: `quiz.results`
   - ✅ After: `quiz.questions`

2. **Correct Answers Count**

   - ❌ Before: `quiz.correctAnswers` (doesn't exist)
   - ✅ After: `quiz.score` (this is the correct property)

3. **Time Taken**
   - ❌ Before: `quiz.timeTaken`
   - ✅ After: `quiz.totalTime`

### Database Schema

Based on `/src/app/api/quiz-history/route.js`, the quiz history document structure is:

```javascript
{
  userId: string,
  userName: string,
  userEmail: string,
  userImage: string,
  quizTitle: string,
  mode: "solo" | "multiplayer",
  roomCode: string | null,
  score: number,              // Number of correct answers
  totalQuestions: number,
  percentage: number,
  totalTime: number,          // Time in milliseconds
  metadata: object,
  questions: [                // Array of questions with answers
    {
      questionText: string,
      isCorrect: boolean,
      selectedAnswerText: string,
      correctAnswerText: string,
      explanation: string
    }
  ],
  leaderboard: array | null,
  completedAt: Date,
  createdAt: Date
}
```

### Code Changes

**File: `/src/app/history/[quizId]/page.js`**

1. **Variable Declaration**

```javascript
// Before
const currentQuestion = quiz.results[currentQuestionIndex];
const isCorrect = currentQuestion.isCorrect;

// After
const currentQuestion = quiz.questions?.[currentQuestionIndex];
const isCorrect = currentQuestion?.isCorrect;
const correctAnswers = quiz.score || 0;
```

2. **Question Navigation**

```javascript
// Before
{quiz.results.map((q, idx) => (...))}

// After
{quiz.questions?.map((q, idx) => (...))}
```

3. **Statistics Display**

```javascript
// Before
{
  quiz.correctAnswers;
}
{
  quiz.totalQuestions - quiz.correctAnswers;
}
{
  formatTime(quiz.timeTaken);
}

// After
{
  correctAnswers;
}
{
  quiz.totalQuestions - correctAnswers;
}
{
  formatTime(quiz.totalTime);
}
```

4. **Added Safety Checks**

```javascript
// Check if questions array exists
if (!quiz.questions || quiz.questions.length === 0) {
  return (
    <div className="flex-grow flex items-center justify-center">
      <div className="text-xl text-gray-600">No quiz data available</div>
    </div>
  );
}
```

5. **Added Null Safety**

```javascript
// Added null check for totalTime
const formatTime = (ms) => {
  if (!ms) return "0m 0s";
  // ... rest of the function
};
```

## Testing

### Verify the fix works:

1. Navigate to `/history`
2. Click "View Details" on any quiz
3. Page should load without errors
4. All quiz statistics should display correctly
5. Question navigation should work
6. Correct/incorrect answers should be highlighted properly

### Edge Cases Handled:

- ✅ Quiz with no questions
- ✅ Quiz with missing score
- ✅ Quiz with no time data
- ✅ Using optional chaining (`?.`) for safety

## Related Files

- `/src/app/history/[quizId]/page.js` - Details page (fixed)
- `/src/app/history/page.js` - History list page (reference)
- `/src/app/api/quiz-history/route.js` - API schema

## Prevention

To prevent similar issues:

1. Always refer to the database schema in the API route
2. Use optional chaining (`?.`) when accessing nested properties
3. Add defensive checks for array/object existence
4. Test with actual data before deployment
5. Match property names exactly as stored in MongoDB
