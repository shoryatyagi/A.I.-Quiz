# Landing Page Flow Update - Mode Selection First

## Overview

Updated the landing page to ask users to select their game mode (Solo or Multiplayer) FIRST, before choosing the quiz source (PDF or AI).

## Previous Flow

```
Landing Page
    ↓
Choose Source (PDF or AI)
    ↓
Choose Mode (Solo or Multiplayer)
    ↓
Upload/Generate Quiz
```

## New Flow

```
Landing Page
    ↓
Choose Mode (Solo or Multiplayer)
    ↓
Choose Source (PDF or AI)
    ↓
Upload/Generate Quiz
```

## Changes Made

### 1. **LandingPage Component** (`src/components/LandingPage.js`)

#### Before:

- Showed "Upload PDF" and "Use AI Prompt" buttons
- Called `onSelectSource` with 'pdf' or 'ai'

#### After:

- Shows "Solo Mode" and "Multiplayer Mode" buttons
- Calls `onSelectMode` with 'solo' or 'multiplayer'

**New Button Design:**

**Solo Mode Button:**

```jsx
<button onClick={() => onSelectMode("solo")}>
  <User icon />
  <div>Solo Mode Play at your own pace</div>
</button>
```

- Primary blue background
- User icon (single person)
- Title: "Solo Mode"
- Subtitle: "Play at your own pace"

**Multiplayer Mode Button:**

```jsx
<button onClick={() => onSelectMode("multiplayer")}>
  <Users icon />
  <div>Multiplayer Mode Compete with friends</div>
</button>
```

- White/transparent background with backdrop blur
- Users icon (multiple people)
- Title: "Multiplayer Mode"
- Subtitle: "Compete with friends"

**Updated Features:**

- Larger buttons (px-8 py-4) for better UX
- Icons: User (solo) and Users (multiplayer) from lucide-react
- Two-line layout with title and subtitle
- Smooth hover animations (scale + shadow)

### 2. **Main Page** (`src/app/page.js`)

#### Handler Function Changes:

**Before:** `handleLandingSourceSelect`

```javascript
const handleLandingSourceSelect = (source) => {
  if (!session) {
    setStage("signin");
  } else {
    setQuizSource(source);
    setStage("mode"); // Go to mode selection
  }
};
```

**After:** `handleLandingModeSelect`

```javascript
const handleLandingModeSelect = (selectedMode) => {
  if (!session) {
    setStage("signin");
  } else {
    setMode(selectedMode);

    if (selectedMode === "solo") {
      // Solo: go to source selection (PDF or AI)
      setStage("source");
    } else {
      // Multiplayer: show name prompt, then source selection
      if (session?.user?.name) {
        setPlayerName(session.user.name);
        setShowNamePrompt(true);
      } else {
        alert("Please sign in to play multiplayer mode");
      }
    }
  }
};
```

**Key Logic:**

1. Check if user is authenticated
2. Set the selected mode
3. **Solo Path**: Go directly to source selection (PDF/AI)
4. **Multiplayer Path**: Show name prompt (for create/join room options)

#### Component Props Updated:

```javascript
// Before
<LandingPage
  onSelectSource={handleLandingSourceSelect}
  isAuthenticated={true}
/>

// After
<LandingPage
  onSelectMode={handleLandingModeSelect}
  isAuthenticated={true}
/>
```

## User Journey Examples

### Solo Mode Journey

1. **Landing Page** → Click "Solo Mode"
2. **Source Selection** → Choose "Upload PDF" or "Use AI Prompt"
3. **Upload/Generate** → Upload PDF or enter AI prompt
4. **Quiz** → Take quiz
5. **Results** → View score

### Multiplayer Mode Journey

1. **Landing Page** → Click "Multiplayer Mode"
2. **Name Prompt Modal** → Choose "Create Room" or "Join Room"
3. **If Create:**
   - Room code generated
   - **Source Selection** → Choose "Upload PDF" or "Use AI Prompt"
   - **Upload/Generate** → Upload PDF or enter AI prompt
   - **Lobby** → Wait for players
   - **Quiz** → Take quiz with others
   - **Results** → View leaderboard
4. **If Join:**
   - Enter room code
   - **Lobby** → Wait for host to start
   - **Quiz** → Take quiz with others
   - **Results** → View leaderboard

## Benefits of New Flow

### 1. **Better Mental Model**

- Users first decide HOW they want to play (solo vs multiplayer)
- Then decide WHAT content to use (PDF vs AI)
- More intuitive progression

### 2. **Clearer Intent**

- Mode selection is a bigger decision than source
- Makes multiplayer more prominent and discoverable
- Reduces friction for multiplayer games

### 3. **Consistent Experience**

- Both solo and multiplayer follow the same initial path
- Source selection happens at the same stage for both modes
- Reduces cognitive load

### 4. **Better UX**

- Larger, more descriptive buttons
- Icons clearly distinguish modes
- Subtitles explain each mode
- Smooth animations guide user interaction

## Visual Design

### Button Styling

```css
/* Solo Mode Button */
- Background: Primary blue (#135bec)
- Text: White
- Icon: User (single person)
- Padding: px-8 py-4
- Hover: Scale 105%, shadow-xl
- Layout: Icon + Title + Subtitle

/* Multiplayer Mode Button */
- Background: White/10 with backdrop blur
- Text: White
- Icon: Users (multiple people)
- Padding: px-8 py-4
- Hover: Scale 105%, shadow-xl, bg-white/20
- Layout: Icon + Title + Subtitle
```

### Animation Timing

- Initial fade in: 0.6s
- Subtitle fade in: 0.2s delay
- Buttons fade in: 0.4s delay
- Hover scale: 200ms
- All transitions smooth with transform GPU acceleration

## Code Structure

### LandingPage Props

```javascript
{
  onSelectMode: (mode: 'solo' | 'multiplayer') => void,
  isAuthenticated: boolean
}
```

### Page Flow State

```javascript
// Stage progression
"landing" → "source" (solo) | "name-prompt" (multiplayer)
           ↓
       "upload" | "ai-generate"
           ↓
       "quiz" → "results"
```

## Testing Checklist

- [x] Solo mode button navigates to source selection
- [x] Multiplayer mode button shows name prompt
- [x] Both buttons have smooth hover animations
- [x] Icons display correctly (User and Users)
- [x] Subtitles are visible and readable
- [x] Unauthenticated users redirect to sign-in
- [x] All transitions are smooth
- [x] Buttons are responsive on mobile
- [x] Color contrast meets accessibility standards

## Accessibility

- Clear visual distinction between modes
- Descriptive button labels
- Icon + text for better comprehension
- High contrast colors
- Large touch targets (py-4)
- Smooth, non-jarring animations

## Compatibility

- ✅ All modern browsers (Chrome, Firefox, Safari, Edge)
- ✅ Mobile devices (iOS/Android)
- ✅ Tablets and desktops
- ✅ Touch and mouse interactions

## Conclusion

✅ **Status**: Complete
✅ **Flow**: Mode selection → Source selection → Quiz
✅ **Design**: Clear, attractive buttons with icons and descriptions
✅ **UX**: Intuitive progression that matches user mental model
✅ **Functionality**: All paths working correctly

The landing page now provides a clearer, more intuitive entry point where users first choose their preferred game mode, then select their quiz source. This creates a more logical flow and makes multiplayer mode more discoverable.
