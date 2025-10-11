# Room Code Lifecycle and Cleanup System

## 📍 Current Behavior

### When Room Codes Are Deleted:

**Currently, room codes are deleted in only ONE scenario:**

### ❌ When Host Disconnects

```javascript
// server.js line ~398
if (room.host === socket.id) {
  // Host disconnected - notify and delete room
  io.to(roomCode).emit("host-disconnected");
  await rooms.deleteOne({ roomCode });
  console.log(`Room ${roomCode} closed (host disconnected)`);
}
```

**What this means:**

- ✅ Host closes browser → Room deleted immediately
- ✅ Host refreshes page → Room deleted
- ✅ Host loses connection → Room deleted
- ❌ All players leave but room stays empty → **Room NOT deleted** ⚠️
- ❌ Quiz finishes → **Room NOT deleted** ⚠️
- ❌ Room inactive for hours → **Room NOT deleted** ⚠️

---

## ⚠️ Current Issues

### Problem 1: Abandoned Rooms

If host creates room but never starts quiz, room stays in database forever.

### Problem 2: Finished Quiz Rooms

After quiz completes and everyone leaves, room stays in database.

### Problem 3: Empty Rooms

If all players leave (but host disconnected gracefully), room might persist.

### Problem 4: Database Bloat

Over time, database fills with old, unused rooms.

---

## ✅ Recommended Solution

I'll implement a comprehensive cleanup system with:

1. **Automatic deletion after quiz completion** (30 seconds delay)
2. **Time-to-live (TTL) for inactive rooms** (24 hours)
3. **MongoDB TTL index** for auto-cleanup
4. **Empty room detection and cleanup**

---

## 🔧 Implementation

### Option 1: Delete After Quiz Completion (Simple)

Add this to `quiz-finished` event in server.js:

```javascript
socket.on("quiz-finished", async ({ roomCode }) => {
  try {
    // Send final results...
    io.to(roomCode).emit("quiz-completed", { leaderboard });

    // Delete room after 30 seconds (gives time to view results)
    setTimeout(async () => {
      const rooms = await getRoomsCollection();
      await rooms.deleteOne({ roomCode });
      console.log(`🗑️ Room ${roomCode} auto-deleted after quiz completion`);
    }, 30000); // 30 seconds
  } catch (error) {
    console.error("Error in quiz-finished:", error);
  }
});
```

**Pros:**

- ✅ Simple to implement
- ✅ Immediate cleanup after quiz
- ✅ No abandoned rooms

**Cons:**

- ⚠️ Fixed delay (might be too short/long)

---

### Option 2: MongoDB TTL Index (Professional)

Add TTL index to automatically delete old rooms:

```javascript
// In MongoDB initialization
async function setupDatabase() {
  const db = await getDatabase();
  const rooms = db.collection("rooms");

  // Create TTL index - auto-delete rooms after 24 hours
  await rooms.createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 86400 } // 24 hours
  );

  console.log("✅ TTL index created for rooms collection");
}
```

**Pros:**

- ✅ Automatic MongoDB cleanup
- ✅ No manual code needed
- ✅ Industry standard
- ✅ Handles all edge cases

**Cons:**

- ⚠️ Rooms deleted even if still active after 24h

---

### Option 3: Hybrid Approach (Best)

Combine both methods:

```javascript
// 1. Delete immediately when host disconnects (already exists)
if (room.host === socket.id) {
  await rooms.deleteOne({ roomCode });
}

// 2. Delete after quiz completion
socket.on("quiz-finished", async ({ roomCode }) => {
  setTimeout(async () => {
    await rooms.deleteOne({ roomCode });
  }, 60000); // 60 seconds
});

// 3. Delete when all players leave
socket.on("disconnect", async () => {
  const room = await rooms.findOne({ roomCode });
  if (room && room.players.length === 0) {
    await rooms.deleteOne({ roomCode });
  }
});

// 4. MongoDB TTL index for backup cleanup (24 hours)
await rooms.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 });
```

---

## 🎯 My Recommendation

**Implement the Hybrid Approach:**

### Why?

- ✅ **Immediate cleanup** when host leaves (already working)
- ✅ **Auto-delete** after quiz finishes (60s delay for results viewing)
- ✅ **Empty room cleanup** when all players leave
- ✅ **Backup TTL** catches any missed rooms (24h)
- ✅ **No database bloat**
- ✅ **Professional solution**

---

## 📊 Room Lifecycle with Recommended Solution

```
Room Created
    ↓
  createdAt: timestamp
    ↓
Players Join
    ↓
Quiz Starts
    ↓
Quiz Finishes
    ↓
Results Displayed (60 seconds)
    ↓
Room Deleted ✅
    ↓
(If somehow missed)
    ↓
TTL kicks in (24 hours) ✅
```

---

## 🚀 Implementation Status

**Current:**

- ✅ Delete when host disconnects (line ~398)

**Recommended to Add:**

1. ⏳ Delete after quiz completion (60s delay)
2. ⏳ Delete when all players leave
3. ⏳ MongoDB TTL index (24h backup)

---

## 💡 Quick Fix (Minimal Code)

If you want the simplest solution right now:

**Just add this to server.js after quiz-finished event:**

```javascript
// Auto-delete room 60 seconds after quiz finishes
setTimeout(async () => {
  try {
    const rooms = await getRoomsCollection();
    await rooms.deleteOne({ roomCode });
    console.log(`🗑️ Room ${roomCode} auto-deleted`);
  } catch (error) {
    console.error("Error deleting room:", error);
  }
}, 60000); // 60 seconds
```

This handles 90% of cases!

---

Would you like me to implement the full hybrid cleanup system?
