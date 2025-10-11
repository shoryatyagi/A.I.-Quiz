# 🐛 Multiplayer Debugging Guide

## Issues to Debug

1. **Client doesn't see lobby after joining room**
2. **Client doesn't see quiz end when host finishes**

---

## 🔍 Debugging Steps

### Issue 1: Client Doesn't See Lobby

#### What Should Happen:

1. Host creates room → sees lobby with room code
2. Client enters room code → clicks Join
3. Client should see lobby with room code and player list
4. Host should see client name appear in player list

#### What to Check:

**Browser Console Logs (Client Side)**:

```
✅ Connected to server. Socket ID: abc123
🔄 Attempting to join room: ABC123 as player: John
Socket connected: true Socket ID: abc123
✅ Successfully joined room: ABC123 Players: ["Host", "John"]
Current stage before update: upload
Setting room code: ABC123
Setting players: ["Host", "John"]
Setting stage to lobby...
```

**Server Console Logs**:

```
🔄 Player "John" attempting to join room: ABC123
✅ John joined room: ABC123. Players: ["Host", "John"]
```

#### If Client Doesn't See Lobby:

**Check 1: Is socket connected?**

- Look for: `✅ Connected to server. Socket ID: ...`
- If NOT connected, check if server is running on port 3001
- If connection error, check firewall/network

**Check 2: Did join-room emit?**

- Look for: `🔄 Attempting to join room: ...`
- If you see "Socket not connected yet!", wait a moment and try again
- If socket is connected but no emit, check handleJoinRoomSubmit function

**Check 3: Did server receive it?**

- Look at server console for: `🔄 Player attempting to join room`
- If server doesn't show this, socket connection issue
- If server shows error, check MongoDB connection

**Check 4: Did client receive joined-room event?**

- Look for: `✅ Successfully joined room: ...`
- If you see this but still no lobby, check if stage is updating
- Look for: `Setting stage to lobby...`

**Check 5: Is stage state stuck?**

- If you see all the logs but no lobby appears, check React DevTools
- Look at stage state - should be "lobby" not "upload"
- Check if there are any React errors in console

---

### Issue 2: Quiz Doesn't End for Client

#### What Should Happen:

1. Host finishes all questions
2. Client finishes all questions
3. Server calculates leaderboard
4. **ALL players** receive `quiz-finished` event
5. **ALL players** see results screen with leaderboard

#### What to Check:

**Browser Console Logs (Both Players)**:

```
📝 Answer submitted - Room: ABC123, Q10: "Answer text"
📊 Player progress: 10/10 questions
🏁 Player finished! Score: 8/10
🎉 All players finished in room ABC123!
🏁 Quiz finished! Leaderboard: [...]
```

**Server Console Logs**:

```
📝 Answer submitted - Room: ABC123, Q10: "..."
📊 Player progress: 10/10 questions
🏁 Player finished! Score: 8/10
🎉 All players finished in room ABC123!
Quiz finished in room: ABC123
```

#### If Client Doesn't See Results:

**Check 1: Did client finish all questions?**

- Count the answer submissions: should be 10 (or your question count)
- Look for: `📊 Player progress: 10/10 questions`

**Check 2: Did server detect all players finished?**

- Server should log: `🎉 All players finished in room ABC123!`
- If not, one player hasn't submitted all answers
- Check player progress on server

**Check 3: Did server emit quiz-finished?**

- Server should log: `Quiz finished in room: ABC123`
- If server logs this but client doesn't receive it, socket issue

**Check 4: Did client receive quiz-finished?**

- Look for: `🏁 Quiz finished! Leaderboard: ...`
- If client doesn't show this, event listener might not be attached
- Check if socket.on("quiz-finished") is registered

**Check 5: Is leaderboard data correct?**

- Check the leaderboard object in console
- Should have array with player names and scores
- If leaderboard is undefined/null, server calculation issue

---

## 🔧 Quick Fixes

### Fix 1: Socket Not Connecting

```bash
# Check if server is running
# Should see: "Server running on port 3001"

# Restart server
npm run dev
```

### Fix 2: Client Stuck on Upload Screen

```javascript
// Check in browser console:
console.log("Current stage:", stage);

// If stage is "upload" but should be "lobby":
// - Check if socket event listener is attached
// - Check if setStage("lobby") is being called
// - Look for React errors blocking state update
```

### Fix 3: Results Not Showing

```javascript
// In browser console, manually check:
socket.on("quiz-finished", (data) => {
  console.log("Manual listener - quiz finished:", data);
});

// If manual listener works, React component issue
// If manual listener doesn't fire, server not emitting
```

---

## 📋 Testing Checklist

### Before Testing:

- [ ] Server running on port 3001
- [ ] MongoDB connected
- [ ] Two browser windows open (or incognito)
- [ ] Browser consoles open (F12)

### Test Sequence:

#### Test 1: Room Creation & Joining

1. [ ] Host: Create room → See lobby with room code
2. [ ] Host: Check console for `🏠 Room created: ...`
3. [ ] Client: Join room with code
4. [ ] Client: Check console for `🔄 Attempting to join room: ...`
5. [ ] Client: Check console for `✅ Successfully joined room: ...`
6. [ ] Client: Should see lobby with room code and players
7. [ ] Host: Should see client name in player list
8. [ ] Host: Check console for `👥 Player joined, updated player list: ...`

#### Test 2: Quiz Start

1. [ ] Host: Click "Start Quiz"
2. [ ] Both: Check console for `🎮 Quiz started! Total questions: ...`
3. [ ] Both: Should see first question
4. [ ] Both: Check console for `Stage set to quiz`

#### Test 3: Answer Submission

1. [ ] Both: Answer question 1
2. [ ] Both: Check console for `📝 Answer submitted: ...`
3. [ ] Both: Should move to question 2
4. [ ] Both: Answer all questions
5. [ ] Both: Check console for `📊 Player progress: X/10 questions`

#### Test 4: Quiz Completion

1. [ ] Both: Answer last question
2. [ ] Both: Check console for `🏁 Player finished quiz: ...`
3. [ ] Server: Check for `🎉 All players finished in room ...`
4. [ ] Both: Check console for `🏁 Quiz finished! Leaderboard: ...`
5. [ ] Both: Should see results screen
6. [ ] Both: Leaderboard should show both players

---

## 🚨 Common Errors & Solutions

### Error: "Socket not connected yet!"

**Cause**: Trying to join room before socket connection established  
**Solution**: Wait 1-2 seconds after page load, then try joining

### Error: "Room not found"

**Cause**: Room code doesn't exist or MongoDB connection issue  
**Solution**:

- Double-check room code (case-sensitive)
- Ensure host created room successfully
- Check MongoDB connection

### Error: Stage stuck on "upload"

**Cause**: Socket event not firing or state not updating  
**Solution**:

- Check browser console for `joined-room` event
- Verify socket is connected
- Check for React errors
- Try refreshing page

### Error: Results don't show after quiz

**Cause**: quiz-finished event not received or leaderboard issue  
**Solution**:

- Check server logs for "All players finished"
- Verify both players submitted all answers
- Check client console for quiz-finished event
- Manually trigger: `socket.emit("get-leaderboard", { roomCode })`

---

## 🎯 Success Criteria

All of these should work:

- ✅ Client sees lobby after joining
- ✅ Client sees quiz when host starts
- ✅ Both players can answer questions
- ✅ Questions advance after each answer
- ✅ Both players see waiting screen if needed
- ✅ Both players see results when all finish
- ✅ Leaderboard shows correct scores

---

## 📞 If Still Not Working

1. **Clear browser cache** and reload
2. **Restart server** completely
3. **Check MongoDB** is running
4. **Share complete console logs** from both client and server
5. **Check network tab** in browser DevTools for WebSocket connection
6. **Verify Socket.IO version** matches between client and server

---

## 🔗 Related Files

- Client socket logic: `src/app/[mode]/page.js`
- Server socket logic: `server.js`
- Lobby component: `src/components/MultiplayerLobby.js`
- Results component: `src/components/QuizResults.js`
