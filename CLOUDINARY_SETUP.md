# Cloudinary Setup for PDF Upload

## Why Cloudinary?

When deploying to platforms like Vercel, Netlify, or Railway:

- ❌ Local filesystem storage doesn't work (read-only or temporary)
- ❌ Files get deleted on each deployment
- ❌ Multiple server instances don't share files

Cloudinary provides:

- ✅ Persistent cloud storage
- ✅ Free tier (25GB storage + 25GB bandwidth/month)
- ✅ CDN for fast file delivery
- ✅ Automatic file management
- ✅ Works with serverless deployments

## Setup Instructions

### 1. Create Cloudinary Account

1. Go to https://cloudinary.com/users/register_free
2. Sign up for a free account
3. Verify your email

### 2. Get Your Credentials

After signing in:

1. Go to Dashboard: https://console.cloudinary.com/
2. Copy these values:
   - **Cloud Name** (e.g., `dxxxxxxxxxxxx`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123`)

### 3. Add Environment Variables

Add to your `.env.local` file:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**For deployment**, add these same variables to:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **Railway**: Project → Variables

### 4. Install Cloudinary Package

```bash
npm install cloudinary
```

## How It Works

### Upload Flow

1. User selects PDF in browser
2. PDF sent to `/api/upload-pdf-only`
3. Server uploads PDF to Cloudinary
4. Cloudinary returns secure URL
5. URL stored in state (e.g., `https://res.cloudinary.com/xxx/raw/upload/v123/filename.pdf`)

### Generation Flow

1. User clicks "Generate Quiz"
2. Request sent to `/api/generate-quiz-from-pdf` with Cloudinary URL
3. Server downloads PDF from Cloudinary
4. Parses text and generates quiz
5. Returns quiz to user

## File Storage Locations

### Development (Local)

- Files stored in `/public/uploads/` folder
- Works fine for testing

### Production (Cloudinary)

- Files stored in Cloudinary cloud
- Accessible via CDN URLs
- Automatically managed

## Implementation Files

Updated files for Cloudinary integration:

- `/src/lib/cloudinary.js` - Cloudinary configuration
- `/src/app/api/upload-pdf-only/route.js` - Upload to Cloudinary
- `/src/app/api/generate-quiz-from-pdf/route.js` - Download from Cloudinary

## Cost Estimate

**Cloudinary Free Tier:**

- 25 GB storage
- 25 GB bandwidth/month
- 25 credits/month for transformations

**Typical Usage:**

- Average PDF: 2-5 MB
- 100 PDFs uploaded: ~300 MB storage
- 1000 quiz generations: ~3 GB bandwidth

**Free tier is enough for:**

- ~5,000 PDF uploads
- ~8,000 quiz generations per month

## Alternative: Base64 (No External Service)

If you prefer not to use external services:

**Pros:**

- No external dependency
- No cost
- No account needed

**Cons:**

- Large payload (PDF encoded as text)
- Increased memory usage
- Slower transmission
- Not recommended for files > 5 MB

See `BASE64_UPLOAD_ALTERNATIVE.md` for implementation.

## Testing

After setup, test:

1. ✅ Upload PDF → Check Cloudinary dashboard for file
2. ✅ Generate quiz → Verify file downloads correctly
3. ✅ Check file permissions (should be public read)
4. ✅ Test with large PDF (8-10 MB)
5. ✅ Deploy and test in production environment

## Cleanup

Cloudinary files persist indefinitely. To clean up:

**Manual:**

- Go to Media Library in Cloudinary dashboard
- Delete old PDFs

**Automatic (Future Enhancement):**

- Implement deletion after quiz generation
- Use Cloudinary API to delete files older than 24 hours
