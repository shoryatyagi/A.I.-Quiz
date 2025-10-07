# 📚 Quiz History Feature - Implementation Guide

## Overview

Complete quiz history tracking system that stores all quiz attempts in MongoDB with efficient referencing and allows users to review their past quizzes, questions, and scores.

---

## 🗄️ MongoDB Database Structure

### Database: `quizapp` (Same database for everything)

All data is stored in the same `quizapp` database with proper referencing between collections.

### Collections:

#### 1. **`users`** (Created by NextAuth)

Stores authenticated user data:

```javascript
{
  _id: ObjectId("..."),
  name: "John Doe",
  email: "john@gmail.com",  // Used as reference ID
  image: "https://...",
  emailVerified: null
}
```

#### 2. **`quizHistory`** (New - Quiz history collection)

Stores quiz attempts with user references:

```javascript
{
  _id: ObjectId("675464a8f..."),
  userId: "john@gmail.com",  // ✅ Reference to users.email
  userName: "John Doe",      // Denormalized for performance
  userEmail: "john@gmail.com",
  userImage: "https://...",
  quizTitle: "JavaScript Basics Quiz",
  mode: "solo",  // or "multiplayer"
  roomCode: null,  // For multiplayer quizzes
  score: 8,
  totalQuestions: 10,
  percentage: 80,
  totalTime: 45000,  // milliseconds
  metadata: {
    source: "ai",  // or "pdf"
    topic: "JavaScript",
    difficulty: "medium",
    questionCount: 10
  },
  questions: [
    {
      questionText: "What is closure?",
      options: ["A", "B", "C", "D"],
      correctAnswer: "A",
      userAnswer: "A",
      isCorrect: true,
      explanation: "..."
    }
    // ... more questions
  ],
  leaderboard: null,  // For multiplayer
  completedAt: ISODate("2025-10-07T..."),
  createdAt: ISODate("2025-10-07T...")
}
```

#### 3. **`rooms`** (Existing - for multiplayer)

Already exists for multiplayer functionality.

---

## 🔗 Referencing Strategy

### Why Use Email as Reference?

- ✅ NextAuth uses email as unique identifier
- ✅ Emails are immutable in Google OAuth
- ✅ Easier to query without ObjectId conversion
- ✅ Human-readable in database

### Denormalization for Performance

We store user data in both places:

- **Normalized**: `userId: "john@gmail.com"` (reference)
- **Denormalized**: `userName`, `userEmail`, `userImage` (cached)

**Why?**

- Faster queries (no joins needed for list view)
- User name/image rarely changes
- If needed, can update all history when profile changes

---

## 📁 Files Modified

### 1. **`src/lib/mongodb.js`** - Database Helper

Added quiz history collection helper:

```javascript
async function getQuizHistoryCollection() {
  const { db } = await connectToDatabase();
  return db.collection("quizHistory");
}
```

**Indexes Created:**

- `userId` + `completedAt` (descending) - Fast user history queries
- `metadata.source` - Filter by source type

### 2. **`src/app/api/quiz-history/route.js`** - API Routes

Updated to use same database and proper referencing:

**POST** `/api/quiz-history` - Save quiz history

- References user by email
- Stores complete quiz data
- Returns history ID

**GET** `/api/quiz-history` - Get all history (summary)

- Returns list without full questions (performance)
- Sorted by completion date

**GET** `/api/quiz-history?id=xxx` - Get specific quiz

- Returns full quiz details with all questions
- Ensures user can only access their own data

### 3. **`src/app/history/page.js`** - History Page

Updated to fetch details on-demand:

- List view: Shows summaries
- Click quiz: Fetches full details from API
- Efficient data loading

### 4. **`src/components/QuizResults.js`** - Auto-save on completion

Automatically saves quiz to history when completed.

### 5. **`src/app/page.js`** - History button in header

Added "History" button next to "New Quiz" (when signed in).

---

## 🎯 How It Works

### Flow Diagram:

```
User Completes Quiz
       ↓
QuizResults Component
       ↓
Calls /api/quiz-history (POST)
       ↓
Saves to quizHistory collection
       ↓
References user by email
       ↓
Stores all questions & answers
       ↓
Returns success
```

### Viewing History:

```
User clicks "History" button
       ↓
Redirects to /history
       ↓
Fetches quiz summaries (GET /api/quiz-history)
       ↓
Displays list (without full questions)
       ↓
User clicks on a quiz
       ↓
Fetches full details (GET /api/quiz-history?id=xxx)
       ↓
Shows all questions, answers, explanations
```

---

## 🔍 MongoDB Query Examples

### Find all quizzes for a user:

```javascript
db.quizHistory
  .find({
    userId: "john@gmail.com",
  })
  .sort({
    completedAt: -1,
  });
```

### Find quizzes by source:

```javascript
db.quizHistory.find({
  userId: "john@gmail.com",
  "metadata.source": "ai",
});
```

### Get user stats:

```javascript
db.quizHistory.aggregate([
  { $match: { userId: "john@gmail.com" } },
  {
    $group: {
      _id: null,
      totalQuizzes: { $sum: 1 },
      avgScore: { $avg: "$percentage" },
      totalQuestions: { $sum: "$totalQuestions" },
    },
  },
]);
```

### Count quizzes by mode:

```javascript
db.quizHistory.aggregate([
  { $match: { userId: "john@gmail.com" } },
  {
    $group: {
      _id: "$mode",
      count: { $sum: 1 },
    },
  },
]);
```

---

## 💾 Data Efficiency

### Storage Optimization:

1. **List View (Summary)**

   - Only fetches: title, score, date, metadata
   - Uses MongoDB projection
   - Saves bandwidth

2. **Detail View (Full Quiz)**

   - Fetches complete data only when needed
   - Loaded on-demand when user clicks

3. **Indexes**
   - Fast queries with compound index
   - No full collection scans

### Example Data Size:

```
Summary record: ~200 bytes
Full quiz (10 questions): ~5 KB
100 quizzes summary: ~20 KB
100 quizzes full: ~500 KB
```

---

## 🎨 UI Features

### History Page (`/history`)

**List View:**

- ✅ Quiz title
- ✅ Mode badge (Solo/Multiplayer)
- ✅ Score and percentage
- ✅ Date and time
- ✅ Question count
- ✅ Trophy icon for score
- ✅ Click to view details

**Detail View:**

- ✅ Complete quiz summary
- ✅ Score breakdown
- ✅ All questions with options
- ✅ User's answer highlighted
- ✅ Correct answer shown
- ✅ Explanations displayed
- ✅ Visual indicators (✓/✗)
- ✅ Back button to list

---

## 🔐 Security

### Authorization:

- ✅ Only authenticated users can save/view history
- ✅ Users can only see their own quizzes
- ✅ API validates session on every request
- ✅ MongoDB queries filter by userId

### Data Protection:

```javascript
// API ensures user can only access their data
const history = await collection.findOne({
  _id: new ObjectId(historyId),
  userId: session.user.email, // ✅ Security check
});
```

---

## 🧪 Testing

### Test 1: Save Quiz History

1. Complete any quiz (solo or multiplayer)
2. Check MongoDB:

```bash
mongosh mongodb://localhost:27017/quizapp
db.quizHistory.find().pretty()
```

3. ✅ Verify quiz data is saved

### Test 2: View History List

1. Click "History" button in header
2. ✅ See list of completed quizzes
3. ✅ Verify scores and dates

### Test 3: View Quiz Details

1. Click on any quiz in history
2. ✅ See all questions
3. ✅ See your answers
4. ✅ See correct answers
5. ✅ See explanations

### Test 4: Multiple Users

1. Sign in as User A → Complete quiz
2. Sign out → Sign in as User B → Complete quiz
3. Check both users see only their own history

---

## 📊 MongoDB Collections in Same Database

```
Database: quizapp
│
├── users (NextAuth)
│   └── Stores user profiles
│
├── accounts (NextAuth)
│   └── Stores OAuth connections
│
├── sessions (NextAuth)
│   └── Stores active sessions
│
├── rooms (Existing)
│   └── Stores multiplayer rooms
│
└── quizHistory (NEW)
    └── Stores quiz attempts
        ├── References: users.email
        └── Includes: All questions & answers
```

---

## 🚀 Performance Optimizations

1. **Projection in List Queries**

   - Only fetch needed fields
   - Reduces bandwidth by 90%

2. **Compound Indexes**

   - `userId + completedAt`
   - Fast sorted queries

3. **Limit Results**

   - Max 100 quizzes per user
   - Prevents memory issues

4. **On-Demand Loading**
   - Full details only when clicked
   - Lazy loading pattern

---

## 📈 Future Enhancements

### Can Be Added:

1. **Analytics Dashboard**

   - Performance over time
   - Strengths and weaknesses
   - Topic-wise breakdown

2. **Search & Filters**

   - Filter by date range
   - Filter by score
   - Filter by source/topic

3. **Export History**

   - Download as PDF
   - Export to CSV
   - Share results

4. **Retry Quiz**

   - Load previous quiz questions
   - Try again for better score

5. **Delete History**
   - Remove specific quizzes
   - Clear all history

---

## 🔧 Maintenance

### View Database Stats:

```bash
mongosh mongodb://localhost:27017/quizapp

# Check collection size
db.quizHistory.stats()

# Count documents
db.quizHistory.countDocuments()

# Index info
db.quizHistory.getIndexes()
```

### Clean Old Data (Optional):

```javascript
// Delete quizzes older than 6 months
db.quizHistory.deleteMany({
  completedAt: {
    $lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
  },
});
```

---

## ✅ Summary

**What You Get:**

- ✅ Complete quiz history tracking
- ✅ All data in same `quizapp` database
- ✅ Efficient MongoDB referencing
- ✅ Fast queries with indexes
- ✅ Detailed quiz review
- ✅ Secure and user-isolated
- ✅ Auto-saves on completion

**Database:**

- ✅ Same database: `quizapp`
- ✅ New collection: `quizHistory`
- ✅ References users by email
- ✅ Optimized with indexes

**Features:**

- ✅ View all past quizzes
- ✅ Click to see full details
- ✅ Review questions & answers
- ✅ See scores and stats
- ✅ Auto-saved after each quiz

Everything is stored in the same `quizapp` database with proper referencing! 🎉
