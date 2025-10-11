# PDF Upload Separation Implementation

## Overview

Separated the PDF upload process into two distinct steps for better user experience and feedback.

## Changes Made

### 1. Component Updates - `src/components/PDFUploader.js`

#### New State Variables

- `uploadedPdfUrl`: Stores the URL of the uploaded PDF file
- `uploading`: Tracks the upload loading state

#### New Functions

**`handleUploadPdf()`**

- Uploads the selected PDF file to the server
- Calls `/api/upload-pdf-only` endpoint
- Stores the returned PDF URL in state
- Shows success toast on completion

**Updated `handleSubmit()`**

- Now generates quiz from already-uploaded PDF
- Calls `/api/generate-quiz-from-pdf` endpoint
- Sends `pdfUrl`, `quizName`, and `numberOfQuestions` as JSON
- Requires `uploadedPdfUrl` to be set before execution

#### UI Updates

**Drag and Drop Area**

- Shows green border when PDF is uploaded (`uploadedPdfUrl` exists)
- Displays "Upload PDF" button when file is selected but not uploaded
- Shows checkmark icon and success message when uploaded
- Button disabled during upload or quiz generation

**Submit Buttons Section**

- "Generate Quiz" button only enabled when `uploadedPdfUrl` exists
- Helper text shows appropriate message:
  - "Please select a PDF file to continue" - No file selected
  - "Please upload the PDF first before generating quiz" - File selected but not uploaded
- Test Demo button always available (unless loading)

**File Removal**

- Clears both `file` and `uploadedPdfUrl` states
- Resets the entire upload flow

### 2. API Endpoints

#### `/api/upload-pdf-only` (NEW)

**Purpose**: Upload PDF file and save it to server storage

**Request**:

- Method: POST
- Content-Type: multipart/form-data
- Body: FormData with `file` field

**Response**:

```json
{
  "success": true,
  "pdfUrl": "/uploads/1234567890-filename.pdf",
  "fileName": "filename.pdf",
  "fileSize": 524288
}
```

**Features**:

- Validates file type (must be PDF)
- Validates file size (max 10MB)
- Creates `/public/uploads/` directory if needed
- Generates unique filename with timestamp
- Saves file to disk
- Returns public URL path

#### `/api/generate-quiz-from-pdf` (NEW)

**Purpose**: Generate quiz from previously uploaded PDF

**Request**:

- Method: POST
- Content-Type: application/json
- Body:

```json
{
  "pdfUrl": "/uploads/1234567890-filename.pdf",
  "quizName": "My Quiz",
  "numberOfQuestions": 10
}
```

**Response**:

```json
{
  "success": true,
  "quiz": [...],
  "metadata": {
    "quizName": "My Quiz",
    "fileName": "filename",
    "numPages": 5,
    "numberOfQuestions": 10
  }
}
```

**Features**:

- Validates `pdfUrl` is provided
- Validates `numberOfQuestions` (5-50)
- Reads PDF from disk using the URL
- Parses PDF text
- Generates quiz using AI
- Returns quiz data and metadata

### 3. File Storage

**Location**: `/public/uploads/`

- Files stored in public directory for easy access
- Accessible via `/uploads/filename` URL
- Timestamped filenames prevent collisions

**Filename Format**: `{timestamp}-{sanitized-original-name}.pdf`

- Example: `1735123456789-my_document.pdf`

**Cleanup**: Manual cleanup recommended

- Files persist until manually deleted
- Consider implementing automatic cleanup:
  - After quiz generation completes
  - After X hours of inactivity
  - On app restart

## User Flow

### Previous Flow (Single Step)

1. User selects PDF file
2. User clicks "Generate Quiz"
3. Wait for upload + parsing + AI generation
4. Quiz ready

### New Flow (Two Steps)

1. User selects PDF file
2. User clicks "Upload PDF"
   - PDF uploads to server
   - Success message appears
3. User clicks "Generate Quiz"
   - Server reads uploaded PDF
   - Parses text and generates quiz with AI
4. Quiz ready

## Benefits

### Better User Experience

- Clear separation of upload and generation
- Immediate feedback when upload completes
- Can verify file uploaded before generating
- Shorter perceived wait time for quiz generation

### Better Error Handling

- Upload failures separate from generation failures
- Can retry upload without re-selecting file
- Can retry generation without re-uploading

### Flexibility

- Could generate multiple quizzes from same PDF
- Could allow editing PDF content before generation
- Could implement PDF preview after upload

## Testing Checklist

- [ ] Select PDF file → Upload button appears
- [ ] Click Upload PDF → Success message shows
- [ ] Remove file → Upload URL cleared
- [ ] Upload PDF → Generate Quiz button enabled
- [ ] Generate without upload → Button disabled
- [ ] Test Demo works without uploading
- [ ] Large PDF (near 10MB) uploads successfully
- [ ] Invalid file type rejected
- [ ] File too large rejected
- [ ] Quiz generates from uploaded PDF
- [ ] Error handling for missing uploaded file
- [ ] Multiple uploads overwrite previous URL

## Future Improvements

1. **Cloud Storage**: Move from local filesystem to S3/Cloudinary
2. **Cleanup**: Automatic file deletion after quiz generation
3. **Progress**: Upload progress bar for large files
4. **Preview**: Show PDF preview after upload
5. **Persistence**: Store upload records in database
6. **Multi-quiz**: Generate multiple quizzes from one upload
7. **Editing**: Allow text editing before generation

## Technical Notes

- File storage is synchronous using `fs/promises`
- Files saved to `/public/uploads/` for static serving
- No database persistence of file records
- Filenames sanitized to prevent injection
- MIME type validation ensures PDF only
- Buffer conversion handles binary data properly
