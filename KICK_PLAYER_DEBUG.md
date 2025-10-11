# Kick Player Button - Debugging Guide

## Changes Made

### 1. Enhanced Button Click Handler
- Added `type="button"` to prevent any form submission issues
- Added `e.preventDefault()` and `e.stopPropagation()` to prevent event bubbling
- Added padding and hover effect for better clickability
- Added tooltip with player name

### 2. Added Debug Logging
The `handleRemovePlayer` function now logs:
- ✅ When button is clicked
- ✅ Player name being removed
- ✅ Whether user is host
- ✅ Whether socket exists
- ✅ Room code
- ✅ Whether event is being emitted

## How to Debug

### Step 1: Check Browser Console
1. Open browser DevTools (F12)
2. Go to Console tab
3. Click the X button next to a player
4. Look for these console messages:

**Expected logs when clicking:**
```
🚫 Remove player clicked: [PlayerName]
Is host: true
Socket exists: true
Room code: [RoomCode]
✅ Emitting remove-player event
```

**If you see:**
```
❌ Cannot remove - isHost: false socket: true
```
→ You're not the host

**If you see:**
```
❌ Cannot remove - isHost: true socket: false
```
→ Socket is not connected

### Step 2: Check Server Logs
In your server terminal, you should see:
```
🚫 Host requesting to remove player: [PlayerName] from room: [RoomCode]
✅ Removed [PlayerName] from room [RoomCode]
```

### Step 3: Check Network Tab
1. Open DevTools → Network tab
2. Filter by "WS" (WebSocket)
3. Click the socket connection
4. Go to Messages tab
5. Click the X button
6. Look for outgoing message: `remove-player`

## Common Issues & Solutions

### Issue 1: Button Not Visible
**Symptom:** Can't see the X button
**Cause:** User is not the host OR trying to remove themselves
**Solution:** Only host sees X button, and only for other players (not themselves)

### Issue 2: Console Shows "Cannot remove - isHost: false"
**Symptom:** You're not marked as host
**Cause:** `isHost` prop is false
**Solution:** Check that you created the room (you should be the first player)

### Issue 3: Console Shows "Cannot remove - socket: false"
**Symptom:** Socket not connected
**Cause:** Socket wasn't initialized or disconnected
**Solution:** 
- Check that socket is being passed to MultiplayerLobby component
- Verify socket connection in [mode]/page.js

### Issue 4: Event Not Reaching Server
**Symptom:** Client logs show event emitted but server doesn't log anything
**Cause:** Socket connection issue or room code mismatch
**Solution:**
- Verify socket is connected: `socket.connected` should be true
- Check room code matches on client and server
- Restart server and reconnect client

### Issue 5: Player Not Actually Removed
**Symptom:** Server receives event but player stays
**Cause:** Database error or player name mismatch
**Solution:** Check server error logs for MongoDB errors

## Testing Checklist

- [ ] Open browser console before testing
- [ ] Create a room as host
- [ ] Join with another player (different browser/incognito)
- [ ] Verify X button appears next to the other player (not yourself)
- [ ] Click X button
- [ ] Check console logs (see Step 1 above)
- [ ] Check server logs (see Step 2 above)
- [ ] Verify player is removed from list
- [ ] Verify kicked player receives alert

## Files Modified

1. **src/components/MultiplayerLobby.js**
   - Enhanced `handleRemovePlayer` with debug logs
   - Improved button with proper event handling
   - Added `type="button"`, `title`, and better styling

2. **src/app/[mode]/page.js** (previously fixed)
   - Added `socket` prop to MultiplayerLobby

## Quick Test

Run this in browser console while in lobby:
```javascript
console.log('Is Host:', window.debugQuizState?.isHost);
console.log('Players:', window.debugQuizState?.players);
console.log('Socket:', !!window.socket);
```

This will show your current state.
