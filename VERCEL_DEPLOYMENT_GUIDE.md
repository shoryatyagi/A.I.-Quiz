# Vercel Deployment Guide

## 🚀 Environment Variables for Vercel

When you deploy to Vercel, add these **exact** environment variables in your Vercel project settings:

### Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

---

## Production Environment Variables

Copy and paste these into Vercel (replace `your-app-name.vercel.app` with your actual Vercel URL):

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=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

# WebSocket Configuration
NEXT_PUBLIC_WEBSOCKET_URL=https://your-app-name.vercel.app

# MongoDB Configuration (MongoDB Atlas - Already Set Up!)
MONGODB_URI=mongodb+srv://shoryatyagi29_db_user:VxyaDTD1BtWFK8cK@cluster0.beqqqrj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
MONGODB_DB_NAME=quizapp

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_SITE_NAME=My Quiz App

# Google OAuth Configuration
NEXTAUTH_URL=https://your-app-name.vercel.app
NEXTAUTH_SECRET=oWYEuvaWT3cZyEdCBc5U0U/Vx2695kPtEvmd2lrx6W4=
GOOGLE_CLIENT_ID=567345142611-1ad0qt0np8aed34k1umcf7ltfm736vuh.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Quiz Configuration
NEXT_PUBLIC_MAX_QUESTIONS_PDF=50
NEXT_PUBLIC_MAX_QUESTIONS_AI=20

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dnylotlka
CLOUDINARY_API_KEY=996939773991561
CLOUDINARY_API_SECRET=DWEUHEjccTPLxdsNlhUc7KySwbw
```

---

## 📝 Example with Actual URLs

### If your Vercel URL is: `https://ai-quiz-shoryatyagi.vercel.app`

Then set:

```bash
NEXT_PUBLIC_WEBSOCKET_URL=https://ai-quiz-shoryatyagi.vercel.app
NEXT_PUBLIC_SITE_URL=https://ai-quiz-shoryatyagi.vercel.app
NEXTAUTH_URL=https://ai-quiz-shoryatyagi.vercel.app
```

### If your Vercel URL is: `https://quiz-app-theta-nine.vercel.app`

Then set:

```bash
NEXT_PUBLIC_WEBSOCKET_URL=https://quiz-app-theta-nine.vercel.app
NEXT_PUBLIC_SITE_URL=https://quiz-app-theta-nine.vercel.app
NEXTAUTH_URL=https://quiz-app-theta-nine.vercel.app
```

---

## 🔧 Step-by-Step Deployment

### Step 1: Deploy to Vercel

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Click "Deploy"
5. **Note your Vercel URL** (e.g., `https://your-app-name.vercel.app`)

### Step 2: Add Environment Variables

1. Go to your Vercel project dashboard
2. Click "Settings" tab
3. Click "Environment Variables" in sidebar
4. Add each variable above (one by one):
   - Name: `OPENROUTER_API_KEY`
   - Value: `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`
   - Environment: Select **Production**, **Preview**, and **Development**
   - Click "Save"
5. Repeat for ALL variables listed above
6. **Important:** Replace `https://your-app-name.vercel.app` with your actual Vercel URL

### Step 3: Update Google OAuth

1. Go to https://console.cloud.google.com
2. Select your project
3. Go to "Credentials"
4. Click your OAuth 2.0 Client ID
5. Add to "Authorized redirect URIs":
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```
6. Click "Save"

### Step 4: Redeploy

1. Go back to Vercel dashboard
2. Click "Deployments" tab
3. Click "..." on latest deployment
4. Click "Redeploy"
5. Wait for deployment to complete

---

## ⚠️ Important Notes

### MongoDB Atlas ✅

- Your MongoDB Atlas is already configured!
- Connection string: `mongodb+srv://shoryatyagi29_db_user:VxyaDTD1BtWFK8cK@cluster0.beqqqrj.mongodb.net/`
- Make sure your MongoDB Atlas allows connections from **0.0.0.0/0** (all IPs) for Vercel

### To Allow Vercel IPs in MongoDB Atlas:

1. Go to https://cloud.mongodb.com
2. Click "Network Access" in sidebar
3. Click "Add IP Address"
4. Click "Allow Access from Anywhere" (0.0.0.0/0)
5. Click "Confirm"

### WebSocket Limitations on Vercel

- Vercel has limitations with WebSockets for real-time multiplayer
- Consider using **Vercel Blob** or **Pusher** for production multiplayer
- Or deploy the WebSocket server separately (e.g., Railway, Render)

---

## 🎯 Quick Checklist

Before deploying:

- [ ] Get your Vercel deployment URL
- [ ] Add all environment variables in Vercel
- [ ] Replace `your-app-name.vercel.app` with actual URL
- [ ] Update Google OAuth redirect URIs
- [ ] Allow Vercel IPs in MongoDB Atlas (0.0.0.0/0)
- [ ] Redeploy after adding environment variables

After deploying:

- [ ] Test login with Google
- [ ] Test PDF upload
- [ ] Test AI quiz generation
- [ ] Test solo mode quiz
- [ ] Test multiplayer mode (may have WebSocket issues on Vercel)

---

## 🔐 Keep Your .env.local for Local Development

Your current `.env.local` file should stay as is for local development:

- Keep `localhost:3000` URLs
- Keep local MongoDB if you want to test locally
- Don't commit this file to Git!

---

## 📊 Environment Variables Summary

| Variable                  | Local (Development)                  | Vercel (Production)                            |
| ------------------------- | ------------------------------------ | ---------------------------------------------- |
| NEXT_PUBLIC_WEBSOCKET_URL | http://localhost:3000                | https://your-app-name.vercel.app               |
| NEXT_PUBLIC_SITE_URL      | http://localhost:3000                | https://your-app-name.vercel.app               |
| NEXTAUTH_URL              | http://localhost:3000                | https://your-app-name.vercel.app               |
| MONGODB_URI               | mongodb://localhost:27017 (optional) | mongodb+srv://shoryatyagi29... (same as yours) |

---

## 🆘 Troubleshooting

### Issue: "MongoDB connection failed"

**Solution:** Allow 0.0.0.0/0 in MongoDB Atlas Network Access

### Issue: "Google OAuth error"

**Solution:** Add Vercel URL to Google Console authorized redirect URIs

### Issue: "Multiplayer not working"

**Solution:** Vercel doesn't fully support WebSockets. Consider deploying WebSocket server separately.

### Issue: "Environment variables not working"

**Solution:** Redeploy after adding environment variables

---

## 🚨 Alternative for Multiplayer (WebSocket Server)

Since Vercel has WebSocket limitations, for production multiplayer:

1. **Option 1:** Deploy `server.js` to Railway.app or Render.com
2. **Option 2:** Use Pusher or Ably for real-time features
3. **Option 3:** Use Vercel Edge Functions with polling

For now, deploy and test. Solo mode will work perfectly!
