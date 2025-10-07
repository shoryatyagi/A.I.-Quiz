# 🎯 Quiz History - Quick Reference

## ✅ What's Implemented

### Database Structure

- **Database**: `quizapp` (Same database as everything else)
- **New Collection**: `quizHistory`
- **References**: Uses email to reference users
- **Indexes**: Optimized for fast queries

### Collections in `quizapp` Database:

```
quizapp/
├── users          (NextAuth - user profiles)
├── accounts       (NextAuth - OAuth data)
├── sessions       (NextAuth - login sessions)
├── rooms          (Existing - multiplayer rooms)
└── quizHistory    (NEW - quiz attempts) ✨
```

---

## 📊 Quiz History Collection Structure

```javascript
{
  _id: ObjectId("..."),
  userId: "john@gmail.com",     // ✅ Reference to users.email
  userName: "John Doe",
  userEmail: "john@gmail.com",
  userImage: "https://...",
  quizTitle: "JavaScript Quiz",
  mode: "solo" or "multiplayer",
  roomCode: null,
  score: 8,
  totalQuestions: 10,
  percentage: 80,
  totalTime: 45000,
  metadata: {
    source: "ai" or "pdf",
    topic: "JavaScript",
    difficulty: "medium"
  },
  questions: [
    {
      questionText: "...",
      options: [...],
      correctAnswer: "...",
      userAnswer: "...",
      isCorrect: true,
      explanation: "..."
    }
  ],
  completedAt: ISODate("..."),
  createdAt: ISODate("...")
}
```

---

## 🔧 Files Modified

### 1. `src/lib/mongodb.js`

**Added:**

- `getQuizHistoryCollection()` function
- Indexes for `quizHistory` collection

### 2. `src/app/api/quiz-history/route.js`

**Updated:**

- Uses same `quizapp` database
- References users by email (not ObjectId)
- POST: Save quiz history
- GET: Fetch summaries (list view)
- GET with ?id: Fetch full details

### 3. `src/app/history/page.js`

**Updated:**

- Added `fetchQuizDetails()` function
- Fetches full quiz data on click
- Efficient data loading

---

## 🎯 How It Works

### When Quiz Completes:

```
QuizResults → API POST → MongoDB quizHistory
              (Saves with userId reference)
```

### When Viewing History:

```
1. Click "History" → GET /api/quiz-history
   Returns: Summaries only (fast)

2. Click on quiz → GET /api/quiz-history?id=xxx
   Returns: Full details (on-demand)
```

---

## 🔍 MongoDB Referencing

### Why Email Instead of ObjectId?

- ✅ NextAuth uses email as unique ID
- ✅ No need to convert to ObjectId
- ✅ Human-readable
- ✅ Simpler queries

### Example Query:

```javascript
// Find all quizzes for user
db.quizHistory
  .find({
    userId: "john@gmail.com",
  })
  .sort({ completedAt: -1 });
```

---

## 💾 Data Efficiency

### List View (Summary):

- Only fetches: title, score, date, metadata
- ~200 bytes per quiz
- Fast loading

### Detail View (Full):

- Fetches all questions/answers
- ~5 KB per quiz
- Loaded on-demand

### Indexes:

```javascript
{ userId: 1, completedAt: -1 }  // Fast sorted queries
{ 'metadata.source': 1 }        // Filter by source
```

---

## 🧪 Quick Test

### Test the Feature:

```bash
# 1. Complete a quiz (any mode)

# 2. Click "History" button in header

# 3. See your quiz in the list

# 4. Click on the quiz

# 5. See all questions & answers

# 6. Check MongoDB:
mongosh mongodb://localhost:27017/quizapp
db.quizHistory.find().pretty()
```

---

## 🔐 Security

✅ Only authenticated users can save/view
✅ Users only see their own history
✅ API validates session every time
✅ MongoDB filters by userId

---

## 📱 UI Features

### History Page

- ✅ List of all completed quizzes
- ✅ Score badges and percentages
- ✅ Date/time stamps
- ✅ Mode indicators (Solo/Multi)
- ✅ Click to expand details

### Quiz Detail View

- ✅ All questions displayed
- ✅ Your answers highlighted
- ✅ Correct answers shown
- ✅ Explanations included
- ✅ Visual ✓/✗ indicators

---

## 🎉 Summary

**Same Database**: Everything in `quizapp` ✅
**Efficient Referencing**: Uses email, not ObjectId ✅
**Optimized Queries**: Indexed for performance ✅
**On-Demand Loading**: Full data only when needed ✅
**Secure**: User-isolated data ✅

**Test it now!** Complete a quiz and check your history! 🚀
