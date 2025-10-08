# Dynamic Route Implementation - Solo and Multiplayer Modes

## Overview

Implemented dynamic routing using Next.js `[mode]` parameter to handle both Solo and Multiplayer modes with clean URLs and no code repetition.

## URL Structure

- **Solo Mode**: `http://localhost:3000/solo/`
- **Multiplayer Mode**: `http://localhost:3000/multiplayer/`

## Files Created

### 1. `/src/app/[mode]/page.js`

- **Purpose**: Dynamic route handler for both solo and multiplayer modes
- **Features**:
  - Validates mode parameter (must be 'solo' or 'multiplayer')
  - Handles all quiz stages (source selection, upload, lobby, quiz, results)
  - Socket.IO integration for multiplayer (only when needed)
  - Authentication check for multiplayer mode
  - Name prompt and room modals for multiplayer
  - Shared logic for both modes (no code duplication)

**Key Stages**:

- `upload` - QuizCreator (upload PDF or generate with AI - has built-in tabs)
- `lobby` - MultiplayerLobby (multiplayer only)
- `quiz` - QuizQuestion (taking the quiz)
- `waiting` - WaitingForResults (multiplayer only)
- `results` - QuizResults (final results)

## Files Modified

### 1. `/src/app/page.js`

- **Before**: Complex state management with all quiz logic
- **After**: Simple landing page that shows:
  - SignInPage (if not authenticated)
  - LandingPage (if authenticated)
- **Benefit**: Cleaner separation of concerns

### 2. `/src/components/LandingPage.js`

- **Changes**:
  - Added `useRouter` import
  - Removed `onSelectMode` prop
  - Added `handleSelectMode` function that navigates to `/${mode}/`
  - Now self-contained with navigation logic

### 3. `/src/components/QuizSourceSelection.js`

- **Changes**:
  - Added `ArrowLeft` icon import
  - Added `onBack` and `mode` props
  - Added "Back to Home" button
  - Dynamic description based on mode

## How It Works

### Solo Mode Flow:

1. User clicks "Solo Mode" on landing page
2. Navigate to `/solo/`
3. Show QuizCreator (choose PDF or AI using tabs)
4. Show QuizQuestion (take quiz)
5. Show QuizResults (final results)

### Multiplayer Mode Flow:

1. User clicks "Multiplayer Mode" on landing page
2. Navigate to `/multiplayer/`
3. Show name prompt modal
4. User chooses "Create Room" or "Join Room"
5. If Create: Show QuizCreator (choose PDF or AI) → Generate quiz → Create room → Lobby
6. If Join: Enter code → Join Lobby
7. Host starts quiz → All players see QuizQuestion
8. After completion → WaitingForResults → QuizResults with leaderboard

## Benefits

### 1. Clean URLs

- Each mode has its own route: `/solo/` and `/multiplayer/`
- Better for sharing, bookmarking, and navigation
- SEO-friendly structure

### 2. No Code Duplication

- Single `[mode]/page.js` handles both modes
- Conditional logic based on `mode` parameter
- Shared components for common functionality

### 3. Better Separation of Concerns

- Main page only handles landing/sign-in
- Mode-specific logic in `[mode]/page.js`
- Components remain reusable

### 4. Scalable Architecture

- Easy to add new modes (e.g., `/practice/`, `/tournament/`)
- Clear folder structure
- Maintainable codebase

## Socket.IO Optimization

- Socket connection only initialized for multiplayer mode
- Prevents unnecessary connections in solo mode
- Better resource usage

## Authentication

- Multiplayer mode requires authentication
- Redirects to home if not signed in
- Solo mode works without authentication

## Navigation

- Back buttons throughout the flow
- Can return to home at any point
- Clear user experience

## Testing Checklist

✅ Navigate to `/solo/` - should show source selection
✅ Navigate to `/multiplayer/` - should show name prompt
✅ Invalid mode (e.g., `/invalid/`) - should redirect to home
✅ Solo mode full flow: source → upload → quiz → results
✅ Multiplayer: create room → lobby → quiz → leaderboard
✅ Multiplayer: join room with code
✅ Back buttons work correctly
✅ Authentication required for multiplayer
