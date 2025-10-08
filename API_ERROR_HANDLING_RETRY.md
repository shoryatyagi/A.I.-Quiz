# API Error Handling with Retry Logic

## Issue

Getting 502 upstream errors from OpenRouter API when the free DeepSeek model is temporarily unavailable:

```
Upstream error from OpenInference: Error from model endpoint
code: 502
```

## Solution Implemented

### Automatic Retry Mechanism

Added intelligent retry logic to both quiz generation functions that:

1. Detects 502 upstream errors
2. Automatically retries up to 2 times
3. Waits 2 seconds between retries
4. Provides clear error messages if all retries fail

## Code Changes

### Before:

```javascript
let completion;
try {
  completion = await openai.chat.completions.create({...});
} catch (apiError) {
  console.error("❌ OpenRouter API Error:", apiError);
  if (apiError.message.includes("404")) {
    throw new Error("Free model access blocked...");
  }
  throw new Error(`API Error: ${apiError.message}`);
}
```

### After:

```javascript
let completion;
let retryCount = 0;
const maxRetries = 2;

while (retryCount <= maxRetries) {
  try {
    completion = await openai.chat.completions.create({...});
    break; // Success - exit retry loop
  } catch (apiError) {
    console.error(`❌ OpenRouter API Error (attempt ${retryCount + 1}/${maxRetries + 1}):`, apiError);

    // Handle 404 privacy errors
    if (apiError.message.includes("404")) {
      throw new Error("Free model access blocked...");
    }

    // Handle 502 upstream errors with retry
    if (apiError.status === 502 || apiError.message.includes("502")) {
      if (retryCount < maxRetries) {
        retryCount++;
        console.log(`⏳ Retrying in 2 seconds... (attempt ${retryCount + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue; // Retry
      } else {
        throw new Error(
          "The AI model is temporarily unavailable (upstream server error). Please try again in a few moments, or contact support if the issue persists."
        );
      }
    }

    // For other errors, throw immediately
    throw new Error(`API Error: ${apiError.message}`);
  }
}
```

## Error Types Handled

### 1. **404 Privacy Error** (No Retry)

- **Cause**: OpenRouter privacy settings blocking free models
- **Action**: Immediate error with instructions
- **Message**: "Free model access blocked. Please go to https://openrouter.ai/settings/privacy..."

### 2. **502 Upstream Error** (With Retry)

- **Cause**: DeepSeek model server temporarily down
- **Action**: Retry up to 2 times with 2-second delay
- **Message**: "The AI model is temporarily unavailable (upstream server error). Please try again in a few moments..."

### 3. **Other Errors** (No Retry)

- **Cause**: Various API issues
- **Action**: Immediate error
- **Message**: "API Error: {error message}"

## Retry Flow

```
Attempt 1: API Call
    ↓ (502 error)
    ↓
Wait 2 seconds
    ↓
Attempt 2: API Call
    ↓ (502 error)
    ↓
Wait 2 seconds
    ↓
Attempt 3: API Call (Final)
    ↓ (502 error)
    ↓
Throw error with clear message
```

## User Experience

### Before:

- ❌ Immediate failure on first 502 error
- ❌ Generic error message
- ❌ User has to manually retry

### After:

- ✅ Automatic retry on 502 errors
- ✅ Clear console logs showing retry attempts
- ✅ User-friendly error message after all retries fail
- ✅ 2-second delays prevent rapid API hammering

## Console Output Example

### Successful Retry:

```
📝 Original topic: "basic definitions of the environment"
🎯 Cleaned topic: "basic definitions of the environment"
📊 Generating 10 questions at medium difficulty
❌ OpenRouter API Error (attempt 1/3): Error: 502 Upstream error
⏳ Retrying in 2 seconds... (attempt 2/3)
API Response: { id: "...", choices: [...], ... }
✅ Quiz generated and shuffled successfully!
```

### Failed After Retries:

```
📝 Original topic: "basic definitions of the environment"
🎯 Cleaned topic: "basic definitions of the environment"
📊 Generating 10 questions at medium difficulty
❌ OpenRouter API Error (attempt 1/3): Error: 502 Upstream error
⏳ Retrying in 2 seconds... (attempt 2/3)
❌ OpenRouter API Error (attempt 2/3): Error: 502 Upstream error
⏳ Retrying in 2 seconds... (attempt 3/3)
❌ OpenRouter API Error (attempt 3/3): Error: 502 Upstream error
Error: The AI model is temporarily unavailable (upstream server error).
Please try again in a few moments, or contact support if the issue persists.
```

## Configuration

### Retry Settings:

- **Max Retries**: 2 (total of 3 attempts)
- **Retry Delay**: 2000ms (2 seconds)
- **Retry Condition**: 502 status code or "502" in error message

### Can be adjusted:

```javascript
const maxRetries = 2; // Change to 3 for 4 total attempts
await new Promise((resolve) => setTimeout(resolve, 2000)); // Change delay
```

## Functions Updated

1. ✅ `generateQuizFromText()` - PDF quiz generation
2. ✅ `generateQuizFromPrompt()` - AI prompt quiz generation

Both functions now have identical retry logic.

## Benefits

### Reliability:

- 🔄 Handles temporary API outages gracefully
- 🎯 Distinguishes between retry-able and non-retry-able errors
- ⏱️ Prevents rapid API calls with delays

### User Experience:

- 💬 Clear error messages for each scenario
- 📊 Progress logging shows retry attempts
- ✅ Higher success rate without user intervention

### Developer Experience:

- 🐛 Detailed console logs for debugging
- 📝 Attempt counters for monitoring
- 🔍 Easy to identify if issue is temporary or persistent

## Testing

### Test 502 Error Handling:

1. Trigger 502 error (free model overloaded)
2. Observe retry attempts in console
3. Verify 2-second delays between retries
4. Check final error message is user-friendly

### Test 404 Error Handling:

1. Trigger privacy settings error
2. Verify immediate error (no retry)
3. Check error message includes settings URL

### Test Success After Retry:

1. Wait for temporary 502 error
2. Observe retry
3. Verify quiz generation succeeds on retry
4. Confirm user sees no error

## Alternative Solutions

If 502 errors persist:

### Option 1: Use Different Model

```javascript
model: "meta-llama/llama-3.1-8b-instruct:free";
// or
model: "google/gemini-flash-1.5";
```

### Option 2: Increase Retry Count

```javascript
const maxRetries = 4; // Total of 5 attempts
```

### Option 3: Exponential Backoff

```javascript
const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s, 8s...
await new Promise((resolve) => setTimeout(resolve, delay));
```

## Files Modified

1. ✅ `src/lib/openai.js`
   - Added retry logic to `generateQuizFromText()`
   - Added retry logic to `generateQuizFromPrompt()`
   - Enhanced error detection and handling
   - Added delay between retries

## Result

The application now handles temporary API outages gracefully with automatic retries, improving reliability and user experience! 🚀
