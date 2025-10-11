# Cloudinary PDF Upload - Complete Implementation Guide

## 🎉 Implementation Complete!

Your PDF upload system now uses **Cloudinary** for cloud storage, supporting up to **50MB PDFs** with automatic upload on file selection.

---

## 📋 What Was Implemented

### 1. **Cloudinary Integration** (`src/lib/cloudinary.js`)

- ✅ Upload PDFs to Cloudinary cloud storage
- ✅ Download PDFs from Cloudinary with retry logic
- ✅ Automatic file validation (PDF format, magic bytes)
- ✅ 50MB file size support
- ✅ Files stored in customizable folder

### 2. **Auto-Upload Feature** (`src/components/PDFUploader.js`)

- ✅ PDF automatically uploads when selected (drag & drop or file picker)
- ✅ Loading state: "Uploading to Cloudinary..."
- ✅ Success state: "PDF Uploaded Successfully to Cloudinary!"
- ✅ 50MB max file size with validation
- ✅ Clear error messages
- ✅ File removal clears upload state

### 3. **API Endpoints**

#### `/api/upload-pdf-only`

- Accepts PDF file (max 50MB)
- Uploads to Cloudinary
- Returns Cloudinary URL
- Auto-triggered when user selects file

#### `/api/generate-quiz-from-pdf`

- Accepts Cloudinary URL + quiz settings
- Downloads PDF from Cloudinary (with retry)
- Parses PDF text
- Generates quiz using AI
- 60-second timeout for large files

---

## 🚀 Setup Instructions

### Step 1: Create Cloudinary Account

1. Go to **https://cloudinary.com/users/register_free**
2. Sign up for a **FREE** account
3. Verify your email
4. You get:
   - ✅ 25 GB storage
   - ✅ 25 GB bandwidth/month
   - ✅ Perfect for thousands of PDFs

### Step 2: Get Your Cloudinary Credentials

1. Login to Cloudinary
2. Go to **Dashboard**: https://console.cloudinary.com/
3. You'll see three values:

```
Cloud name:  dxxxxxxxxx
API Key:     123456789012345
API Secret:  abcdefghijklmnopqrstuvwxyz
```

### Step 3: Add to Environment Variables

Create or update your `.env.local` file:

```env
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dxxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
CLOUDINARY_FOLDER_NAME=quiz-app
```

**Important Notes:**

- Replace the values with YOUR actual credentials from Cloudinary dashboard
- `CLOUDINARY_FOLDER_NAME` can be any name (e.g., "my-quiz-pdfs", "quizmaster", etc.)
- All PDFs will be stored in this folder in Cloudinary

### Step 4: Install Dependencies (Already Done!)

```bash
npm install cloudinary
```

✅ This is already installed!

### Step 5: Test the Implementation

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Start the Socket.IO server:**

   ```bash
   node server.js
   ```

3. **Test the upload flow:**
   - Go to Quiz Creator page
   - Select or drag & drop a PDF (up to 50MB)
   - Watch for "Uploading to Cloudinary..." message
   - See "PDF Uploaded Successfully to Cloudinary!" when done
   - Click "Generate Quiz" to create the quiz

---

## 🔄 How It Works

### User Flow:

```
1. User selects PDF file (drag & drop or file picker)
   ↓
2. PDF automatically uploads to Cloudinary (loading state shows)
   ↓
3. Cloudinary returns URL
   ↓
4. Success message appears: "PDF Uploaded Successfully!"
   ↓
5. User clicks "Generate Quiz"
   ↓
6. Server downloads PDF from Cloudinary
   ↓
7. AI analyzes PDF and generates quiz
   ↓
8. Quiz ready to play!
```

### Technical Flow:

```javascript
// When user selects file:
handleFileChange()
  → autoUploadPDF()
  → POST /api/upload-pdf-only
  → uploadPDFToCloudinary()
  → Returns: https://res.cloudinary.com/.../file.pdf
  → State updated: uploadedPdfUrl

// When user clicks "Generate Quiz":
handleSubmit()
  → POST /api/generate-quiz-from-pdf { pdfUrl: "..." }
  → downloadPDFFromCloudinary()
  → parsePDF()
  → generateQuizFromText()
  → Returns: quiz questions
```

---

## 📁 Where PDFs Are Stored

### In Cloudinary:

- **Path**: `quiz-app/` folder (or your custom folder name)
- **Format**: `1234567890-filename.pdf`
- **Access**: Public URLs (read-only)
- **Example**: `https://res.cloudinary.com/your-cloud/raw/upload/v123/quiz-app/1234567890-myfile.pdf`

### In Your Dashboard:

1. Go to **Media Library** in Cloudinary
2. Navigate to your folder (e.g., "quiz-app")
3. See all uploaded PDFs with timestamps

---

## ⚙️ Configuration Options

### File Size Limit

Currently set to **50MB** in:

- `src/components/PDFUploader.js` (line ~150)
- `src/app/api/upload-pdf-only/route.js` (line ~25)

To change:

```javascript
const maxSize = 50 * 1024 * 1024; // 50MB
// Change to: 100 * 1024 * 1024 for 100MB
```

### Folder Name

Change in `.env.local`:

```env
CLOUDINARY_FOLDER_NAME=my-custom-folder-name
```

### Timeout for Large Files

In `/api/generate-quiz-from-pdf/route.js`:

```javascript
export const maxDuration = 60; // 60 seconds
```

---

## 🧪 Testing Checklist

- [ ] Upload 1MB PDF → Auto-uploads successfully
- [ ] Upload 10MB PDF → Shows loading, then success
- [ ] Upload 50MB PDF → Works without timeout
- [ ] Upload > 50MB PDF → Shows error "File size must be less than 50MB"
- [ ] Upload non-PDF file → Shows error "Please upload a PDF file"
- [ ] Drag and drop PDF → Auto-uploads
- [ ] File picker PDF → Auto-uploads
- [ ] Generate quiz from uploaded PDF → Works
- [ ] Remove file → Clears upload state
- [ ] Check Cloudinary dashboard → Files appear in folder
- [ ] Generate quiz from same PDF twice → Works both times

---

## 🐛 Troubleshooting

### Issue: "Failed to upload PDF"

**Solution:**

- Check your Cloudinary credentials in `.env.local`
- Verify Cloud Name, API Key, and API Secret are correct
- Restart development server after changing `.env.local`

### Issue: "PDF download timeout"

**Solution:**

- File might be too large
- Increase `maxDuration` in `generate-quiz-from-pdf/route.js`
- Check your internet connection

### Issue: "Invalid PDF file"

**Solution:**

- Make sure the file is actually a PDF
- File might be corrupted
- Try re-uploading the PDF

### Issue: PDFs not appearing in Cloudinary dashboard

**Solution:**

- Check folder name matches `.env.local`
- Go to Media Library → Raw files → Your folder name
- Might take a few seconds to appear

### Issue: "Cannot find module 'cloudinary'"

**Solution:**

```bash
npm install cloudinary
```

---

## 📊 Cloudinary Free Tier Limits

| Feature         | Free Tier   | Your Usage (Est.)      |
| --------------- | ----------- | ---------------------- |
| Storage         | 25 GB       | ~5,000 PDFs (5MB avg)  |
| Bandwidth       | 25 GB/month | ~5,000 downloads/month |
| Uploads         | Unlimited   | ✅ No limit            |
| Downloads       | Unlimited   | ✅ No limit            |
| Transformations | 25 credits  | N/A (PDFs only)        |

**Estimated Capacity:**

- Upload 100 PDFs/day = 3,000/month (well within limits)
- Each PDF ~5MB = 500MB storage used
- Each quiz generated = 1 download (~5MB)
- 5,000 quiz generations/month = 25GB bandwidth

---

## 🚀 Deployment Notes

### For Vercel/Netlify/Railway:

1. **Add Environment Variables:**

   - Go to your deployment platform settings
   - Add the same variables from `.env.local`:
     ```
     CLOUDINARY_CLOUD_NAME
     CLOUDINARY_API_KEY
     CLOUDINARY_API_SECRET
     CLOUDINARY_FOLDER_NAME
     ```

2. **Redeploy:**

   - Push your code
   - Platform will automatically redeploy
   - Cloudinary integration works automatically!

3. **No Additional Setup:**
   - No filesystem needed
   - No server configuration
   - Works out of the box!

---

## 🎯 Key Features

✅ **Auto-Upload**: File uploads immediately when selected
✅ **50MB Support**: Handle large PDFs easily
✅ **Cloud Storage**: Works on any deployment platform
✅ **Retry Logic**: Automatically retries failed downloads (3 attempts)
✅ **Validation**: Checks file type, size, and PDF format
✅ **Loading States**: Clear visual feedback during upload/generation
✅ **Error Handling**: User-friendly error messages
✅ **Scalable**: Free tier supports thousands of PDFs
✅ **Fast**: CDN delivery for quick downloads worldwide
✅ **Reliable**: 99.9% uptime SLA from Cloudinary

---

## 📝 Environment Variables Needed

Copy this to your `.env.local`:

```env
# Required for Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER_NAME=quiz-app

# Your existing variables (keep them)
MONGODB_URI=your_mongodb_uri
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
OPENROUTER_API_KEY=your_openrouter_api_key
NEXT_PUBLIC_MAX_QUESTIONS_PDF=50
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

---

## 🎉 You're All Set!

Your quiz app now has:

- ✅ Professional cloud storage
- ✅ 50MB PDF support
- ✅ Auto-upload on selection
- ✅ Production-ready deployment
- ✅ Scalable infrastructure

Just add your Cloudinary credentials and start uploading PDFs! 🚀
