# PDF Upload Error Fix - "JSON.parse: unexpected character"

## Problem
Getting error: `JSON.parse: unexpected character at line 1 column 1 of the JSON data` when uploading PDF on Vercel.

## Root Cause
Vercel has a **10-second timeout** for serverless functions on the Free/Hobby plan. PDF processing takes longer, so the function times out and returns an HTML error page instead of JSON.

## ✅ Solution Applied

### 1. Created `vercel.json` Configuration
Added timeout configuration for API routes:

```json
{
  "functions": {
    "src/app/api/generate-quiz-from-pdf/route.js": {
      "maxDuration": 60
    },
    "src/app/api/generate-quiz/route.js": {
      "maxDuration": 60
    },
    "src/app/api/upload-pdf-only/route.js": {
      "maxDuration": 60
    }
  }
}
```

### 2. Enhanced Error Handling
Updated `PDFUploader.js` to detect and report non-JSON responses.

## 🚀 Deployment Steps

### Step 1: Commit and Push
```bash
git add vercel.json src/components/PDFUploader.js
git commit -m "Add Vercel timeout config for PDF processing"
git push
```

### Step 2: Vercel Will Auto-Deploy
- Vercel will detect the changes and redeploy
- Wait for deployment to complete

### Step 3: Verify Environment Variables
Make sure these are set in Vercel:
- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Your Cloudinary API key
- `CLOUDINARY_API_SECRET` - Your Cloudinary API secret
- `MONGODB_URI` - Your MongoDB Atlas connection string

## ⚠️ Vercel Plan Limitations

### Free/Hobby Plan
- **Max Duration:** 10 seconds (default)
- **With Config:** Can extend to 60 seconds for specific routes
- **Issue:** Large PDFs may still timeout

### Pro Plan ($20/month)
- **Max Duration:** 300 seconds (5 minutes)
- **Better for:** Large PDF processing

## 🔍 Alternative Solutions

### Option 1: Use Smaller PDFs
- Keep PDFs under 5 pages
- Process faster within timeout limits

### Option 2: Upgrade Vercel Plan
- Pro plan gives 5-minute timeout
- Better for production use

### Option 3: Move PDF Processing to Separate Service
Deploy PDF processing to:
- **Railway.app** (recommended - more generous timeouts)
- **Render.com**
- **AWS Lambda** with longer timeout

### Option 4: Use Edge Runtime (Not Recommended)
Edge runtime has different limitations and doesn't support all Node.js APIs needed for PDF parsing.

## 🧪 Testing After Deployment

1. **Open browser console** (F12)
2. **Upload a small PDF** (1-2 pages)
3. **Check console logs** for any errors
4. **If still fails**, check:
   - Environment variables in Vercel
   - Function logs in Vercel dashboard
   - API key validity

## 📊 Debugging Checklist

If still getting errors:

- [ ] Verify `vercel.json` is in root directory
- [ ] Check Vercel deployment logs
- [ ] Verify all environment variables are set
- [ ] Test with a very small PDF (1 page)
- [ ] Check OpenRouter API key is valid
- [ ] Check Cloudinary credentials are correct
- [ ] Monitor function execution time in Vercel dashboard

## 🔗 View Function Logs

1. Go to Vercel Dashboard
2. Click your project
3. Go to "Functions" tab
4. Click on the function
5. View execution logs and duration

## 💡 Quick Test

After redeployment, try uploading a **1-page PDF** first to verify:
- If it works → timeout was the issue
- If it still fails → check environment variables and API keys

## 📝 Files Modified

1. **vercel.json** (NEW) - Function timeout configuration
2. **src/components/PDFUploader.js** - Better error handling

## 🚨 If Still Not Working

Check these in order:

1. **Vercel Environment Variables:**
   - All variables from `.env.local` must be in Vercel
   - Especially `OPENROUTER_API_KEY` and Cloudinary credentials

2. **MongoDB Atlas:**
   - Network access allows 0.0.0.0/0

3. **Function Logs:**
   - Check Vercel dashboard for actual error messages

4. **API Keys:**
   - Verify OpenRouter API key is valid
   - Test key at https://openrouter.ai/

5. **Try Different PDF:**
   - Some PDFs are corrupted or protected
   - Try a simple, small PDF first

## 🎯 Expected Behavior After Fix

- Upload PDF → Processing starts
- Within 60 seconds → Quiz generated
- Success message displayed
- Quiz loaded and ready

If it takes longer than 60 seconds with a small PDF, there's another issue (likely API key or network).
