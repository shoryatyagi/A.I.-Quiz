# Cloudinary Quick Start Guide

## 1️⃣ Get Cloudinary Credentials (2 minutes)

1. Go to: **https://cloudinary.com/users/register_free**
2. Sign up (free account)
3. Go to Dashboard: **https://console.cloudinary.com/**
4. Copy these 3 values:
   - Cloud name: `dxxxxxxxxx`
   - API Key: `123456789012345`
   - API Secret: `abcd123...`

## 2️⃣ Add to .env.local

Create or update `.env.local` in your project root:

```env
CLOUDINARY_CLOUD_NAME=dxxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcd123...
CLOUDINARY_FOLDER_NAME=quiz-app
```

**Replace with YOUR actual values!**

## 3️⃣ Restart Server

```bash
# Stop current servers (Ctrl+C)
# Then restart:
npm run dev
node server.js
```

## 4️⃣ Test It!

1. Go to Quiz Creator
2. Select a PDF file
3. Watch it auto-upload: "Uploading to Cloudinary..."
4. See success: "PDF Uploaded Successfully!"
5. Click "Generate Quiz"
6. Done! 🎉

---

## What Changed?

### Before:

- Select PDF → Click Upload → Click Generate
- 10MB limit
- Local storage (doesn't work when deployed)

### After:

- Select PDF → **Auto-uploads instantly** → Click Generate
- **50MB limit**
- **Cloud storage (works everywhere!)**

---

## Key Features:

✅ **Auto-upload** when file is selected
✅ **50MB** max file size (up from 10MB)
✅ Files stored in **Cloudinary cloud**
✅ **Works on Vercel/Netlify/Railway**
✅ **Free tier**: 25GB storage, unlimited downloads
✅ **Loading states**: "Uploading...", "Success!"

---

## Environment Variables Required:

```env
# NEW - Add these:
CLOUDINARY_CLOUD_NAME=your_value
CLOUDINARY_API_KEY=your_value
CLOUDINARY_API_SECRET=your_value
CLOUDINARY_FOLDER_NAME=quiz-app

# EXISTING - Keep these:
MONGODB_URI=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OPENROUTER_API_KEY=...
NEXT_PUBLIC_MAX_QUESTIONS_PDF=50
NEXT_PUBLIC_SOCKET_URL=...
```

---

## Files Changed:

1. ✅ `src/lib/cloudinary.js` - NEW (Cloudinary helper functions)
2. ✅ `src/app/api/upload-pdf-only/route.js` - Updated (uses Cloudinary)
3. ✅ `src/app/api/generate-quiz-from-pdf/route.js` - Updated (downloads from Cloudinary)
4. ✅ `src/components/PDFUploader.js` - Updated (auto-upload on file select)
5. ✅ `package.json` - Updated (cloudinary package added)

---

## Troubleshooting:

**"Failed to upload PDF"**
→ Check your Cloudinary credentials are correct
→ Restart the server after adding .env.local

**"Cannot find module 'cloudinary'"**
→ Run: `npm install cloudinary`

**PDFs not in Cloudinary dashboard**
→ Go to: Media Library → Raw files → quiz-app folder
→ Check folder name matches CLOUDINARY_FOLDER_NAME

---

## Need Help?

See full documentation: `CLOUDINARY_COMPLETE_SETUP.md`
