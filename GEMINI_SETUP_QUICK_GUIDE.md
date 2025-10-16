# Quick Setup Guide - Google Gemini AI Model

**Want to use Google's Gemini 2.0 Flash for quiz generation?**

Follow these 3 simple steps:

---

## Step 1: Get Your Gemini API Key (2 minutes)

1. Go to: **https://aistudio.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"** button
4. Copy the generated key (starts with `AIzaSy...`)

### Free Tier Limits (Generous!)
- ✅ **60 requests per minute**
- ✅ **1,500 requests per day**
- ✅ **1 million tokens per minute**
- ✅ No credit card required

---

## Step 2: Add to Environment Variables

### For Local Development
Add to your `.env.local` file:
```bash
GEMINI_API_KEY=AIzaSy_your_actual_api_key_here
```

### For Vercel Production
1. Go to **Vercel Dashboard**
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
5. Name: `GEMINI_API_KEY`
6. Value: Your Gemini API key
7. Environment: **Production**, **Preview**, **Development**
8. Click **Save**
9. **Redeploy** your application

---

## Step 3: Use It!

1. Go to your quiz creator
2. Select either:
   - **AI Generation** mode, or
   - **Upload PDF** mode
3. Look for **"AI Model"** selector
4. Click **"✨ Gemini 2.0"** button
5. Generate your quiz!

---

## That's It! 🎉

You now have two AI models to choose from:
- **🚀 DeepSeek (Free)** - Default, already configured
- **✨ Gemini 2.0** - Google's latest, now available!

---

## Troubleshooting

### ❌ "Gemini API key not configured"
**Fix:** Make sure you added `GEMINI_API_KEY` to `.env.local` and restarted the dev server

### ❌ "Invalid API key"
**Fix:** Check that you copied the entire key from Google AI Studio (starts with `AIzaSy`)

### ❌ Vercel: Still not working after adding key
**Fix:** Make sure you **redeployed** after adding the environment variable

---

## Need Help?

- **Google AI Studio:** https://aistudio.google.com
- **Gemini API Docs:** https://ai.google.dev/docs
- **Pricing & Limits:** https://ai.google.dev/pricing

---

**Enjoy faster, smarter quiz generation with Gemini! ✨**

