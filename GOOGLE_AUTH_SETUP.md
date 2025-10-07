# Google OAuth Setup Guide for AI Quiz Generator

## 📋 Overview

This guide will walk you through setting up Google OAuth authentication for your Next.js quiz application.

---

## ✅ What's Already Done

1. ✅ **next-auth** package is already installed in your `package.json`
2. ✅ NextAuth API route created at `src/app/api/auth/[...nextauth]/route.js`
3. ✅ SessionProvider wrapper component created
4. ✅ GoogleAuthButton component added to header
5. ✅ Environment variables template added to `.env.local`

---

## 🔧 NPM Dependencies

**Good news!** All required dependencies are already installed:

- ✅ `next-auth@^4.24.11` - Already in your package.json

**No additional npm packages needed!** 🎉

---

## 🌐 Google Cloud Console Setup

Follow these steps to get your Google OAuth credentials:

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click **"New Project"**
4. Enter project name: `AI Quiz Generator` (or any name you prefer)
5. Click **"Create"**

### Step 2: Enable Google+ API

1. In your project, go to **"APIs & Services"** > **"Library"**
2. Search for **"Google+ API"**
3. Click on it and press **"Enable"**

### Step 3: Configure OAuth Consent Screen

1. Go to **"APIs & Services"** > **"OAuth consent screen"**
2. Choose **"External"** user type
3. Click **"Create"**
4. Fill in the required fields:
   - **App name**: `AI Quiz Generator`
   - **User support email**: Your email
   - **Developer contact email**: Your email
5. Click **"Save and Continue"**
6. On **"Scopes"** page, click **"Save and Continue"** (default scopes are fine)
7. On **"Test users"** page (optional):
   - Add test user emails if needed
   - Click **"Save and Continue"**
8. Review and click **"Back to Dashboard"**

### Step 4: Create OAuth Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**
4. Choose **"Web application"**
5. Enter a name: `AI Quiz Web Client`
6. Under **"Authorized JavaScript origins"**, add:
   ```
   http://localhost:3000
   ```
7. Under **"Authorized redirect URIs"**, add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
8. Click **"Create"**
9. A popup will show your credentials:
   - **Client ID**: Copy this
   - **Client Secret**: Copy this
10. Click **"OK"**

### Step 5: Add Production URLs (When Deploying)

When you deploy your app to production:

1. Go back to your OAuth client settings
2. Add your production URLs:

   **Authorized JavaScript origins:**

   ```
   https://yourdomain.com
   ```

   **Authorized redirect URIs:**

   ```
   https://yourdomain.com/api/auth/callback/google
   ```

---

## 🔐 Environment Variables Setup

### Step 1: Generate NEXTAUTH_SECRET

You need a random secret key for NextAuth. Choose one method:

**Option A: Using OpenSSL (if installed)**

```bash
openssl rand -base64 32
```

**Option B: Using Node.js**

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Option C: Online Generator**

- Visit: https://generate-secret.vercel.app/32
- Copy the generated secret

### Step 2: Update .env.local

Open your `.env.local` file and replace the placeholder values:

```env
# Google OAuth Configuration (for NextAuth.js)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=paste-your-generated-secret-here
GOOGLE_CLIENT_ID=paste-your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=paste-your-client-secret-here
```

**Example (with fake values):**

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=Xv2k9L3mP7qR5tY8wA1bC4dE6fG9hJ2kL5nM8pQ0rS3t
GOOGLE_CLIENT_ID=123456789-abc123def456.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-aBc123DeF456gHi789JkL
```

### Step 3: For Production Deployment

When deploying to production (Vercel, etc.), update:

```env
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-same-secret-or-new-one
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

---

## 🚀 Testing Your Setup

### Step 1: Restart Your Development Server

```bash
# Stop your current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 2: Test the Authentication

1. Open your app at `http://localhost:3000`
2. You should see a **"Sign in with Google"** button in the header
3. Click the button
4. You'll be redirected to Google's sign-in page
5. Select your Google account
6. After successful login, you'll be redirected back to your app
7. You should see your profile picture/name and a **"Sign Out"** button

---

## 🎯 Using Session Data in Your App

You can access the logged-in user's data anywhere in your app:

### Example: Get user info in a component

```javascript
"use client";

import { useSession } from "next-auth/react";

export default function MyComponent() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  if (session) {
    return (
      <div>
        <p>Welcome, {session.user.name}!</p>
        <p>Email: {session.user.email}</p>
        <img src={session.user.image} alt="Profile" />
      </div>
    );
  }

  return <p>Please sign in</p>;
}
```

---

## 🛠️ Troubleshooting

### Error: "redirect_uri_mismatch"

- Make sure your redirect URI in Google Console exactly matches:
  `http://localhost:3000/api/auth/callback/google`

### Error: "Missing NEXTAUTH_SECRET"

- Make sure you generated and added the secret to `.env.local`
- Restart your dev server after adding

### Error: "Invalid client_id"

- Double-check your `GOOGLE_CLIENT_ID` in `.env.local`
- Make sure you copied the entire ID including the `.apps.googleusercontent.com` part

### Sign-in works but page doesn't update

- Clear your browser cache and cookies
- Try in incognito/private mode

---

## 📚 Additional Features You Can Add

### 1. Protect Routes (Require Login)

```javascript
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return <div>Protected content</div>;
}
```

### 2. Store User Data in MongoDB

You can extend the NextAuth configuration to save users to your MongoDB database. Let me know if you need this feature!

---

## 🎉 Summary

**What you need to do:**

1. ✅ Go to Google Cloud Console
2. ✅ Create a project and OAuth credentials
3. ✅ Copy Client ID and Client Secret
4. ✅ Generate NEXTAUTH_SECRET
5. ✅ Update `.env.local` with all 4 values
6. ✅ Restart your dev server
7. ✅ Test the "Sign in with Google" button

**That's it!** Your Google authentication is ready! 🚀
