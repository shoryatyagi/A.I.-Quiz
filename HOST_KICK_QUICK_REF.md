# Host Kick Player - Quick Reference

## How It Works

### For Host
1. In lobby, click **X** button next to any player's name
2. Player is immediately removed
3. Player list updates for everyone

### For Kicked Player
1. Receives alert: "You have been removed from the quiz by the host"
2. Disconnected and returned to upload screen
3. Can join another room or create own

## Key Events

### Server Events
- **`remove-player`** ← Client emits to kick player
- **`player-kicked`** → Server emits to kicked player
- **`player-removed`** → Server emits to remaining players

### Client Listeners
- **`player-kicked`** → Resets state and disconnects
- **`player-removed`** → Updates player list in lobby

## Code Snippets

### Emit Kick Request (Client)
```javascript
socket.emit("remove-player", { roomCode, playerName });
```

### Handle Being Kicked (Client)
```javascript
socket.on("player-kicked", ({ message }) => {
  alert(message);
  setStage("upload");
  setRoomCode("");
  setPlayers([]);
  setIsHost(false);
  socket.disconnect();
});
```

### Server Handler
```javascript
socket.on("remove-player", async ({ roomCode, playerName }) => {
  // 1. Verify host
  // 2. Remove from database
  // 3. Notify kicked player
  // 4. Update remaining players
});
```

## Security
- ✅ Only host can remove players
- ✅ Host cannot remove themselves
- ✅ Validates room and player existence
- ✅ Proper socket cleanup

## Files Changed
- `server.js` - New remove-player handler
- `src/app/[mode]/page.js` - Event listeners
- `src/components/MultiplayerLobby.js` - UI updates
