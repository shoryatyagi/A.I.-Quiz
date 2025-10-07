# 🧹 Clean Up Duplicate Quiz History

## Problem

Quiz history was being saved twice due to React re-renders triggering the useEffect multiple times.

## ✅ Fix Applied

Updated `QuizResults.js` to use a `useRef` to track if history has already been saved, preventing duplicates.

**Before:**

```javascript
useEffect(() => {
  saveQuizHistory();
}, [session, quiz, userAnswers, ...]); // Too many dependencies!
```

**After:**

```javascript
const hasSavedRef = useRef(false);

useEffect(() => {
  if (hasSavedRef.current) return; // Already saved
  saveQuizHistory();
  hasSavedRef.current = true;
}, [session]); // Only session dependency
```

---

## 🗑️ Remove Duplicate Entries from MongoDB

### Option 1: Manual Cleanup (Recommended)

```bash
mongosh mongodb://localhost:27017/quizapp
```

Then run this script to keep only the first entry of each duplicate:

```javascript
// Find and remove duplicates based on userId, quizTitle, and completedAt
db.quizHistory
  .aggregate([
    {
      $group: {
        _id: {
          userId: "$userId",
          quizTitle: "$quizTitle",
          completedAt: "$completedAt",
          score: "$score",
        },
        ids: { $push: "$_id" },
        count: { $sum: 1 },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ])
  .forEach(function (doc) {
    // Keep the first ID, delete the rest
    doc.ids.shift();
    db.quizHistory.deleteMany({ _id: { $in: doc.ids } });
    print("Deleted " + doc.ids.length + " duplicate(s)");
  });
```

### Option 2: Delete All History and Start Fresh

If you want to clear everything and start over:

```bash
mongosh mongodb://localhost:27017/quizapp
```

```javascript
// Delete all quiz history
db.quizHistory.deleteMany({});

print("All quiz history deleted. Start fresh!");
```

### Option 3: Delete Specific User's History

```bash
mongosh mongodb://localhost:27017/quizapp
```

```javascript
// Replace with your email
db.quizHistory.deleteMany({
  userId: "your-email@gmail.com",
});

print("Your quiz history deleted!");
```

---

## 🔍 Verify No More Duplicates

After the fix, complete a new quiz and check:

```bash
mongosh mongodb://localhost:27017/quizapp
```

```javascript
// Count entries for your user
db.quizHistory.countDocuments({
  userId: "your-email@gmail.com",
});

// View all your history
db.quizHistory
  .find({
    userId: "your-email@gmail.com",
  })
  .sort({ completedAt: -1 });
```

You should see **only one entry** per quiz now! ✅

---

## 🎯 Prevention

The fix ensures:

1. ✅ `useRef` tracks if already saved
2. ✅ Only runs once per component mount
3. ✅ Won't re-save on re-renders
4. ✅ New quizzes will only save once

---

## 🧪 Test It

1. Complete a new quiz
2. Check MongoDB - should see **1 entry**
3. Refresh the page - still **1 entry**
4. Navigate away and back - still **1 entry**

Perfect! No more duplicates! 🎉
