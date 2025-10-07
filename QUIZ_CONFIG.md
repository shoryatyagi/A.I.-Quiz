# 🎯 Quiz Configuration Environment Variables

## Overview
This app now uses environment variables to configure the maximum number of questions allowed in quizzes, making it easy to adjust limits without changing code.

---

## 📋 Environment Variables

### `NEXT_PUBLIC_MAX_QUESTIONS_PDF`
- **Purpose:** Maximum number of questions for PDF-based quizzes
- **Default:** `50`
- **Range:** Recommended 10-100
- **Usage:** Controls the max value in the slider when generating quizzes from PDF files

### `NEXT_PUBLIC_MAX_QUESTIONS_AI`
- **Purpose:** Maximum number of questions for AI-generated quizzes
- **Default:** `20`
- **Range:** Recommended 5-30 (higher values may take longer to generate)
- **Usage:** Controls the max value in the slider when generating AI quizzes

---

## ⚙️ Configuration

### 1. Set Environment Variables

Add these to your `.env.local` file:

```bash
# Quiz Configuration
NEXT_PUBLIC_MAX_QUESTIONS_PDF=50
NEXT_PUBLIC_MAX_QUESTIONS_AI=20
```

### 2. Customization Examples

**For faster AI generation (lower limits):**
```bash
NEXT_PUBLIC_MAX_QUESTIONS_AI=15
```

**For comprehensive PDF quizzes (higher limits):**
```bash
NEXT_PUBLIC_MAX_QUESTIONS_PDF=100
```

**For educational settings (moderate limits):**
```bash
NEXT_PUBLIC_MAX_QUESTIONS_PDF=30
NEXT_PUBLIC_MAX_QUESTIONS_AI=15
```

---

## 🔧 How It Works

### PDF Uploader (`PDFUploader.js`)
```javascript
const MAX_QUESTIONS = parseInt(process.env.NEXT_PUBLIC_MAX_QUESTIONS_PDF) || 50;

<input
  type="range"
  min="5"
  max={MAX_QUESTIONS}  // ✅ Uses environment variable
  step="5"
  value={numberOfQuestions}
/>
```

The slider labels automatically adjust based on the max value:
- Min: 5
- 30% of max
- 50% of max
- 70% of max
- Max: Your configured value

### AI Quiz Generator (`AIQuizGenerator.js`)
```javascript
const MAX_QUESTIONS = parseInt(process.env.NEXT_PUBLIC_MAX_QUESTIONS_AI) || 20;

<input
  type="range"
  min="5"
  max={MAX_QUESTIONS}  // ✅ Uses environment variable
  value={numberOfQuestions}
/>
```

---

## 🎨 Benefits

1. **✅ Centralized Configuration**
   - Change limits in one place (`.env.local`)
   - No need to edit component code

2. **✅ Environment-Specific Settings**
   - Development: Higher limits for testing
   - Production: Optimized limits for performance
   - Educational: Restricted limits for students

3. **✅ Easy Deployment**
   - Different limits for different deployments
   - Configure via hosting platform (Vercel, Netlify, etc.)

4. **✅ Dynamic UI**
   - Slider labels automatically adjust
   - Max value displayed in UI matches configuration

---

## 🚀 Deployment

### Vercel / Netlify
Add environment variables in your hosting dashboard:

**Vercel:**
1. Go to Project Settings → Environment Variables
2. Add:
   - `NEXT_PUBLIC_MAX_QUESTIONS_PDF` = `50`
   - `NEXT_PUBLIC_MAX_QUESTIONS_AI` = `20`

**Netlify:**
1. Site Settings → Build & Deploy → Environment
2. Add the same variables

---

## ⚠️ Important Notes

1. **`NEXT_PUBLIC_` prefix is required** for client-side variables in Next.js
2. **Restart dev server** after changing `.env.local`
3. **Fallback values** are set (50 for PDF, 20 for AI) if env vars are missing
4. **Step size** remains fixed at 5 for PDF slider

---

## 🧪 Testing

After configuration, verify:

1. **PDF Uploader:**
   - Check slider max value = `NEXT_PUBLIC_MAX_QUESTIONS_PDF`
   - Verify labels show correct intervals

2. **AI Quiz Generator:**
   - Check slider max value = `NEXT_PUBLIC_MAX_QUESTIONS_AI`
   - Verify max label shows correct number

3. **Console Check:**
   ```bash
   # Run in browser console
   console.log(process.env.NEXT_PUBLIC_MAX_QUESTIONS_PDF);
   console.log(process.env.NEXT_PUBLIC_MAX_QUESTIONS_AI);
   ```

---

## 📝 Example Configurations

### Conservative (Faster, Lighter)
```bash
NEXT_PUBLIC_MAX_QUESTIONS_PDF=30
NEXT_PUBLIC_MAX_QUESTIONS_AI=10
```

### Balanced (Recommended)
```bash
NEXT_PUBLIC_MAX_QUESTIONS_PDF=50
NEXT_PUBLIC_MAX_QUESTIONS_AI=20
```

### Comprehensive (Slower, More Thorough)
```bash
NEXT_PUBLIC_MAX_QUESTIONS_PDF=100
NEXT_PUBLIC_MAX_QUESTIONS_AI=30
```

---

## 🎓 Use Cases

**Schools/Universities:**
- Limit AI questions to prevent overload
- Allow more PDF questions for study materials
```bash
NEXT_PUBLIC_MAX_QUESTIONS_PDF=40
NEXT_PUBLIC_MAX_QUESTIONS_AI=15
```

**Corporate Training:**
- Moderate limits for quick assessments
```bash
NEXT_PUBLIC_MAX_QUESTIONS_PDF=25
NEXT_PUBLIC_MAX_QUESTIONS_AI=15
```

**Personal Study:**
- Maximum flexibility
```bash
NEXT_PUBLIC_MAX_QUESTIONS_PDF=100
NEXT_PUBLIC_MAX_QUESTIONS_AI=30
```

---

## 🔍 Troubleshooting

**Slider not showing correct max value?**
- Restart dev server: `npm run dev`
- Clear `.next` cache: `rm -rf .next`

**Environment variable not working?**
- Ensure `NEXT_PUBLIC_` prefix is present
- Check `.env.local` file exists in project root
- Verify no typos in variable names

**Need different values for development vs production?**
- Use `.env.local` for local development
- Set production values in hosting platform dashboard

---

Your quiz limits are now fully configurable! 🎉
