# Quick Reference: Complete Cleanup System

## ✅ What Was Implemented

### Room Cleanup (Hybrid 4-Layer System)

| Trigger              | When                  | Delay      | Status              |
| -------------------- | --------------------- | ---------- | ------------------- |
| **Host Disconnects** | Host leaves/refreshes | Immediate  | ✅ Already existed  |
| **Quiz Finishes**    | All players complete  | 60 seconds | ✅ **NEW**          |
| **Empty Room**       | All players leave     | Immediate  | ✅ **NEW**          |
| **TTL Backup**       | 24 hours inactive     | Auto       | ✅ Updated (was 1h) |

### PDF Cleanup

| Step           | What Happens                     | Status     |
| -------------- | -------------------------------- | ---------- |
| Upload PDF     | Stored in Cloudinary temporarily | ✅ Working |
| Generate Quiz  | AI creates questions from PDF    | ✅ Working |
| **Delete PDF** | **Removed from Cloudinary**      | ✅ **NEW** |
| Save Quiz      | Questions saved to database      | ✅ Working |

---

## 🎯 User Flow

### Before (Problems):

```
Upload PDF → Generate Quiz → PDF stays in Cloudinary forever ❌
Create Room → Finish Quiz → Room stays in database forever ❌
```

### After (Fixed):

```
Upload PDF → Generate Quiz → PDF deleted automatically ✅
Create Room → Finish Quiz → Room deleted after 60s ✅
```

---

## 📊 What Gets Deleted vs Preserved

### Deleted:

- ❌ Room codes (after quiz or 24h)
- ❌ PDF files from Cloudinary (after quiz generation)
- ❌ Temporary player data in rooms

### Preserved:

- ✅ Quiz questions (in database)
- ✅ Quiz history (user account)
- ✅ Leaderboard results
- ✅ User profiles
- ✅ Quiz metadata

---

## 🔍 How to Verify

### Check Room Deletion:

```javascript
// In MongoDB
db.rooms.find({ roomCode: "YOUR_ROOM_CODE" });
// Should return empty after quiz finishes + 60s
```

### Check PDF Deletion:

1. Go to Cloudinary Dashboard: https://console.cloudinary.com/
2. Navigate to Media Library → Raw Files → quiz-app folder
3. Upload PDF and generate quiz
4. Refresh Cloudinary → PDF should be gone ✅

### Check Server Logs:

```bash
# Look for these messages:
🗑️ Room ABC123 auto-deleted 60s after quiz completion
🗑️ Room ABC123 deleted (all players left)
🗑️ Deleting PDF from Cloudinary: quiz-app/1234567890-file
✅ PDF deleted from Cloudinary successfully
```

---

## ⚙️ Customization

### Change Room Deletion Delay

**File:** `server.js` line ~339

```javascript
setTimeout(async () => {
  await rooms.deleteOne({ roomCode });
}, 60000); // ← Change this (milliseconds)
```

Suggestions:

- `30000` = 30 seconds (faster cleanup)
- `60000` = 60 seconds (recommended)
- `120000` = 2 minutes (more time to view results)

### Change TTL Backup Duration

**File:** `src/lib/mongodb.js` line ~22

```javascript
expireAfterSeconds: 86400; // ← Change this (seconds)
```

Suggestions:

- `43200` = 12 hours
- `86400` = 24 hours (recommended)
- `604800` = 7 days

---

## 🐛 Troubleshooting

### PDF Not Deleting from Cloudinary?

**Check:**

1. `.env.local` has correct `CLOUDINARY_FOLDER_NAME`
2. Server logs show: `✅ PDF deleted from Cloudinary successfully`
3. Cloudinary credentials are correct

**Solution:**

- Check folder name matches: `CLOUDINARY_FOLDER_NAME=quiz-app`
- Restart server after .env changes

### Rooms Not Auto-Deleting?

**Check:**

1. Server logs after quiz finishes
2. MongoDB TTL index exists: `db.rooms.getIndexes()`
3. `createdAt` field exists in room documents

**Solution:**

- Restart MongoDB if TTL not working
- Check server logs for deletion messages

### Quiz Questions Lost?

**Don't worry:**

- Quiz questions are ALWAYS saved to database
- Only PDF file is deleted from Cloudinary
- User's quiz history is preserved
- Check `quizHistory` collection in MongoDB

---

## 📁 Files Changed

1. ✅ `server.js` - Added quiz completion + empty room cleanup
2. ✅ `src/lib/mongodb.js` - Updated TTL from 1h to 24h
3. ✅ `src/app/api/generate-quiz-from-pdf/route.js` - Added PDF deletion
4. ✅ Documentation created

---

## 🎉 Benefits

### For Users:

- ✅ Privacy: PDFs automatically deleted
- ✅ Clean: No abandoned rooms
- ✅ Fast: Database stays lean

### For You:

- ✅ No manual cleanup needed
- ✅ Cloudinary free tier lasts longer
- ✅ MongoDB stays small and fast
- ✅ Professional data management

---

## 🚀 Testing Checklist

- [ ] Create room → Finish quiz → Wait 60s → Room deleted
- [ ] Upload PDF → Generate quiz → Check Cloudinary → PDF gone
- [ ] All players leave → Room deleted immediately
- [ ] Host disconnects → Room deleted immediately
- [ ] Check MongoDB 24h later → Old rooms auto-deleted

---

**Everything is automatic! No manual cleanup required.** 🎯
