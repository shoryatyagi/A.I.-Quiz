# 🔐 Authentication Protection Implementation

## Overview

Your AI Quiz App now requires users to sign in with Google before creating or joining quizzes. User data is automatically stored in MongoDB.

---

## ✅ What's Been Implemented

### 1. **Authentication Protection**

- ✅ Users **MUST** sign in with Google to create or join quizzes
- ✅ Solo mode requires authentication
- ✅ Multiplayer mode requires authentication
- ✅ Lock icons and warnings shown when not signed in

### 2. **MongoDB User Storage**

- ✅ User data automatically saved to MongoDB when they sign in
- ✅ Using NextAuth MongoDB Adapter
- ✅ Collections created:
  - `users` - Stores user profile data (name, email, image)
  - `accounts` - Stores OAuth provider data
  - `sessions` - Stores active user sessions

### 3. **Automatic Player Names**

- ✅ Uses Google account name automatically in multiplayer
- ✅ Shows player's Google profile picture in dialogs
- ✅ Name field is pre-filled and disabled (uses Google name)

---

## 📦 New Dependencies Installed

```json
{
  "@auth/mongodb-adapter": "^3.7.1" // ✅ Installed
}
```

**No additional installations needed!** Everything else was already in your `package.json`.

---

## 🗄️ MongoDB Collections Created

When a user signs in, NextAuth automatically creates these collections in your MongoDB database:

### 1. **users** Collection

```javascript
{
  _id: ObjectId,
  name: "John Doe",
  email: "john@gmail.com",
  image: "https://lh3.googleusercontent.com/...",
  emailVerified: null
}
```

### 2. **accounts** Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,  // Links to users collection
  type: "oauth",
  provider: "google",
  providerAccountId: "1234567890",
  access_token: "...",
  expires_at: 1234567890,
  scope: "email profile openid",
  token_type: "Bearer",
  id_token: "..."
}
```

### 3. **sessions** Collection

```javascript
{
  _id: ObjectId,
  sessionToken: "unique-session-token",
  userId: ObjectId,  // Links to users collection
  expires: ISODate("2025-11-07T...")
}
```

---

## 🎯 How It Works

### User Flow:

1. **User opens the app** → Sees "Sign in with Google" button
2. **User clicks Quiz Mode** → Lock icon shown if not signed in
3. **User tries to select mode** → Prompted to sign in
4. **User signs in with Google** → Data saved to MongoDB
5. **User creates/joins quiz** → Name automatically uses Google account name
6. **User plays quiz** → Session persists across page refreshes

---

## 🔒 Protected Features

### What Requires Sign-In:

- ✅ Creating a solo quiz
- ✅ Creating a multiplayer room
- ✅ Joining a multiplayer room
- ✅ All quiz gameplay

### What Doesn't Require Sign-In:

- ❌ Viewing the homepage
- ❌ Seeing the mode selection screen (but can't proceed)

---

## 📝 Modified Files

### New Files Created:

1. `src/lib/mongodbClient.js` - MongoDB client for NextAuth
2. `AUTH_IMPLEMENTATION.md` - This documentation

### Files Modified:

1. `src/app/api/auth/[...nextauth]/route.js`
   - Added MongoDB adapter
   - Stores user data in MongoDB
2. `src/components/QuizMode.js`
   - Added authentication check
   - Shows lock icons when not signed in
   - Prompts sign-in when trying to select mode
3. `src/app/page.js`
   - Imports `useSession` hook
   - Auto-fills player name from Google account
   - Shows Google profile picture in dialogs
   - Disables name input field (uses Google name)

---

## 🧪 Testing the Authentication

### Test Scenario 1: Unauthenticated User

1. Open app without signing in
2. Click on Solo or Multiplayer mode
3. See yellow warning: "Please sign in with Google"
4. Lock icons visible on mode cards
5. Clicking mode shows alert and opens sign-in

### Test Scenario 2: Authenticated User

1. Sign in with Google
2. Mode cards are fully enabled (no lock icons)
3. Click Multiplayer mode
4. See your Google name and profile picture
5. Name field is pre-filled and disabled
6. Create or join room uses Google name

### Test Scenario 3: Database Check

1. Sign in with Google
2. Check MongoDB database
3. Verify collections exist: `users`, `accounts`, `sessions`
4. Verify your user data is stored

---

## 🔍 Viewing Users in MongoDB

### Using MongoDB Compass (GUI):

1. Connect to: `mongodb://localhost:27017`
2. Select database: `quizapp`
3. View collections:
   - `users` - See all registered users
   - `accounts` - See OAuth connections
   - `sessions` - See active sessions

### Using MongoDB Shell:

```bash
mongosh mongodb://localhost:27017/quizapp

# View all users
db.users.find().pretty()

# Count users
db.users.countDocuments()

# Find specific user by email
db.users.findOne({ email: "yourmail@gmail.com" })

# View user's linked accounts
db.accounts.find({ userId: ObjectId("user-id-here") })
```

---

## 🎨 UI Changes

### 1. QuizMode Component

**Before:**

- Simple mode selection cards
- No authentication check

**After:**

- Lock icons when not signed in
- Yellow warning banner
- Disabled opacity effect on cards
- Sign-in prompt on click

### 2. Multiplayer Dialogs

**Before:**

- Empty name input field
- User had to type name manually

**After:**

- Shows Google profile picture
- "Playing as: [Your Name]" display
- Name field pre-filled and disabled
- Uses authenticated user's Google name

---

## 🛡️ Security Features

1. **NextAuth.js** - Industry-standard authentication
2. **OAuth 2.0** - Secure Google sign-in
3. **Session Tokens** - Secure session management
4. **MongoDB Storage** - Persistent user data
5. **NEXTAUTH_SECRET** - Encrypted session tokens

---

## 🚀 What Happens Behind the Scenes

### When User Signs In:

```
1. User clicks "Sign in with Google"
2. Redirected to Google OAuth consent screen
3. User approves permissions
4. Google returns user data to your app
5. NextAuth creates/updates user in MongoDB:
   - Checks if user exists (by email)
   - If new: Creates user document
   - If existing: Updates last sign-in
6. Creates session token
7. Stores session in MongoDB
8. Returns session to browser
9. App shows user as logged in
```

### When User Creates/Joins Quiz:

```
1. App checks session state
2. If not authenticated: Show sign-in prompt
3. If authenticated:
   - Get user name from session.user.name
   - Use Google profile picture
   - Auto-fill name in multiplayer dialogs
   - Allow quiz creation/joining
```

---

## 📊 Data Flow Diagram

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. Click "Sign in with Google"
       ↓
┌─────────────┐
│  NextAuth   │ ← 2. Redirect to Google
└──────┬──────┘
       │
       │ 3. User approves
       ↓
┌─────────────┐
│   Google    │ ← 4. Returns user data
└──────┬──────┘
       │
       │ 5. User data (name, email, image)
       ↓
┌─────────────┐
│  MongoDB    │ ← 6. Save to users/accounts/sessions
│  Adapter    │
└──────┬──────┘
       │
       │ 7. Session created
       ↓
┌─────────────┐
│  useSession │ ← 8. Session available in components
│   Hook      │
└─────────────┘
```

---

## 🔧 Customization Options

### Want to allow users to edit their name?

In `src/app/page.js`, remove the `disabled` attribute:

```javascript
// Change this:
disabled={!!session?.user?.name}

// To this:
disabled={false}
```

### Want to add more user fields?

Extend the NextAuth callbacks in `src/app/api/auth/[...nextauth]/route.js`:

```javascript
callbacks: {
  async session({ session, user }) {
    session.user.id = user.id;
    // Add custom fields
    session.user.quizCount = user.quizCount || 0;
    session.user.highScore = user.highScore || 0;
    return session;
  },
}
```

### Want to save quiz results to user profile?

Create an API route to update user data after quiz completion.

---

## 🐛 Troubleshooting

### Issue: "Module not found: @auth/mongodb-adapter"

**Solution:**

```bash
npm install @auth/mongodb-adapter
```

### Issue: Users not saving to MongoDB

**Check:**

1. MongoDB is running: `mongosh mongodb://localhost:27017`
2. `MONGODB_URI` in `.env.local` is correct
3. Check server console for errors

### Issue: Session not persisting

**Check:**

1. `NEXTAUTH_SECRET` is set in `.env.local`
2. Browser cookies are enabled
3. Clear browser cache and try again

### Issue: "Sign in required" always showing

**Check:**

1. User is actually signed in (check header)
2. Session Provider is wrapping the app in `layout.js`
3. `useSession` hook is imported and used correctly

---

## 📈 Future Enhancements

### Ideas you can implement:

1. **User Dashboard**

   - Show quiz history
   - Display stats and achievements
   - View all completed quizzes

2. **User Profiles**

   - Editable bio
   - Custom avatar
   - Public profile pages

3. **Leaderboards**

   - Global rankings
   - Friend competitions
   - Weekly challenges

4. **Quiz History**

   - Save all quiz results to user profile
   - Review past quizzes
   - Retry previous quizzes

5. **Social Features**
   - Friend system
   - Share quiz results
   - Challenge friends

---

## ✅ Summary

**What You Have Now:**

- ✅ Google OAuth authentication
- ✅ User data stored in MongoDB
- ✅ Protected quiz creation/joining
- ✅ Automatic player names from Google
- ✅ Session management
- ✅ Persistent user data

**No Impact On:**

- ❌ Quiz functionality
- ❌ PDF upload
- ❌ AI generation
- ❌ Multiplayer features
- ❌ Results display

**Everything works exactly the same, just with authentication protection!** 🎉
