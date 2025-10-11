# Host Kick Player Feature

## Overview
The host can now remove specific players from the quiz lobby while waiting for other players to join. This feature gives hosts control over who participates in their quiz session.

## Implementation Details

### Server-Side (server.js)

#### New Event Handler: `remove-player`
```javascript
socket.on("remove-player", async ({ roomCode, playerName }) => {
  // 1. Verify room exists
  // 2. Verify requester is the host
  // 3. Find player to remove
  // 4. Prevent host from removing themselves
  // 5. Remove player from database
  // 6. Notify kicked player
  // 7. Remove player from socket room
  // 8. Notify remaining players
});
```

#### Security & Validation
- **Host Verification**: Only the host (room.host === socket.id) can remove players
- **Self-Protection**: Host cannot remove themselves
- **Player Verification**: Checks if player exists in room before removal
- **Room Verification**: Validates room exists before any operations

#### Events Emitted
1. **`player-kicked`** (to kicked player only)
   - Notifies the player they've been removed
   - Payload: `{ message: "You have been removed from the quiz by the host" }`

2. **`player-removed`** (to all remaining players in room)
   - Updates player list for everyone still in lobby
   - Payload: `{ playerName, players, totalPlayers }`

3. **`error`** (to requester on failure)
   - Sent when validation fails
   - Messages: "Room not found", "Only host can remove players", "Player not found in room", "Host cannot remove themselves"

### Client-Side

#### [mode]/page.js
Two new event listeners handle kick functionality:

1. **`player-removed`** (for players still in room)
   ```javascript
   newSocket.on("player-removed", ({ playerName, players: playerList }) => {
     console.log(`🚫 Player removed: ${playerName}`);
     setPlayers(playerList || []);
   });
   ```

2. **`player-kicked`** (for kicked player)
   ```javascript
   newSocket.on("player-kicked", ({ message }) => {
     alert(message);
     // Reset to initial state
     setStage("upload");
     setRoomCode("");
     setPlayers([]);
     setIsHost(false);
     newSocket.disconnect();
   });
   ```

#### MultiplayerLobby.js
- **UI Component**: Already had remove button (X icon) next to each player
- **Event Emission**: `socket.emit("remove-player", { roomCode, playerName })`
- **Event Listener**: Added `player-removed` listener to update UI
- **Visibility**: Remove button only shown to host and not for the host themselves

### User Experience Flow

#### For Host
1. Host creates a room and enters lobby
2. Players join the lobby
3. Host sees list of all players with X button next to each (except themselves)
4. Host clicks X button next to a player's name
5. Player is immediately removed from the lobby
6. Player list updates for host and all remaining players
7. Host can start quiz when ready

#### For Kicked Player
1. Player joins lobby and waits
2. Host removes them from the lobby
3. Player receives alert: "You have been removed from the quiz by the host"
4. Player is disconnected and returned to upload screen
5. Player can join a different room or create their own

#### For Other Players
1. Players in lobby see player list update
2. Removed player disappears from the list
3. Total player count updates
4. Players continue waiting for host to start

## UI/UX Features

### Visual Indicators
- **Host Badge**: First player in list has "Host" badge
- **Remove Button**: X icon appears on hover for non-host players (host view only)
- **Player Colors**: Each player has a unique color avatar
- **Player Initials**: Displays initials in circular avatars

### Error Handling
- Invalid room code → Error message
- Non-host attempts removal → Error message
- Host tries to remove themselves → Error message
- Player not found → Error message

## Database Operations

### Player Removal
```javascript
await rooms.updateOne(
  { roomCode },
  { $pull: { players: { name: playerName } } }
);
```

### Socket Room Management
```javascript
const kickedSocket = io.sockets.sockets.get(playerToRemove.socketId);
if (kickedSocket) {
  kickedSocket.leave(roomCode);
  socketRooms.delete(playerToRemove.socketId);
}
```

## Testing Checklist

- [ ] Host can remove players from lobby
- [ ] Non-host cannot remove players (receives error)
- [ ] Host cannot remove themselves (receives error)
- [ ] Kicked player receives notification and is disconnected
- [ ] Remaining players see updated player list
- [ ] Player list count updates correctly
- [ ] Removed player cannot rejoin without entering code again
- [ ] Host can still start quiz after removing players
- [ ] Multiple players can be removed sequentially

## Edge Cases Handled

1. **Room Not Found**: Returns error if room doesn't exist
2. **Host Verification**: Only allows host to perform removal
3. **Self-Removal Prevention**: Host cannot kick themselves
4. **Player Not Found**: Validates player exists before removal
5. **Socket Cleanup**: Properly removes player from socket room and memory
6. **State Synchronization**: All players receive updated player list

## Files Modified

1. **server.js**
   - Added `remove-player` event handler
   - Implements host verification and player removal logic
   - Emits `player-kicked` and `player-removed` events

2. **src/app/[mode]/page.js**
   - Added `player-removed` event listener
   - Added `player-kicked` event listener
   - Handles kicked player state reset

3. **src/components/MultiplayerLobby.js**
   - Updated `player-removed` event listener
   - Remove button UI already implemented
   - Emits `remove-player` event on button click

## Security Considerations

- **Host-Only Access**: Only the room creator can remove players
- **No Self-Kick**: Prevents accidental host removal
- **Immediate Disconnect**: Kicked player is immediately disconnected
- **State Reset**: Kicked player's state is fully reset
- **Memory Cleanup**: socketRooms Map is properly cleaned up

## Future Enhancements

- [ ] Add confirmation dialog before kicking player
- [ ] Add reason for removal (optional)
- [ ] Allow host to ban players from rejoining
- [ ] Add vote-kick functionality for non-hosts
- [ ] Show kick notification to remaining players with player name
- [ ] Add undo functionality for accidental kicks
