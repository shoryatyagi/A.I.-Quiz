# Fixes for AI Question Generation Empty Options Issue

## Overview

This document provides step-by-step fixes to resolve the issue where AI-generated quiz questions sometimes show empty options.

---

## Fix 1: Improve JSON Parsing in `src/lib/openai.js`

### Problem

The JSON cleaning logic is corrupting the data by:

1. Over-escaping quotes
2. Aggressively replacing whitespace
3. Replacing control characters with spaces instead of removing them

### Solution

**Change line 378-391 from:**

```javascript
// Clean up common JSON issues
jsonText = jsonText
  .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas before } and ]
  .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ") // Replace control characters with space
  .replace(/\s+/g, " ") // Normalize whitespace
  .trim();

console.log("Cleaned JSON (first 500 chars):", jsonText.substring(0, 500));

let questions;
try {
  questions = JSON.parse(jsonText);
} catch (parseError) {
  console.error("❌ JSON Parse Error:", parseError.message);
  console.error("📄 Full problematic JSON:", jsonText);

  // Try more aggressive fixes
  try {
    console.log("🔧 Attempting aggressive cleanup...");

    // Remove any text before first [ and after last ]
    const firstBracket = jsonText.indexOf("[");
    const lastBracket = jsonText.lastIndexOf("]");

    if (firstBracket === -1 || lastBracket === -1) {
      throw new Error("No JSON array found in response");
    }

    let fixedJson = jsonText.substring(firstBracket, lastBracket + 1);

    // Additional fixes
    fixedJson = fixedJson
      .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
      .replace(/\n/g, " ") // Remove newlines
      .replace(/\r/g, "") // Remove carriage returns
      .replace(/\t/g, " ") // Replace tabs with spaces
      .replace(/\\/g, "\\\\") // Escape backslashes
      .replace(/([^\\])"/g, '$1\\"') // Escape unescaped quotes (careful!)
      .replace(/^\s*\\"/, '"') // Fix over-escaped quotes at start
      .replace(/\\"\s*$/g, '"'); // Fix over-escaped quotes at end

    console.log(
      "🔧 Fixed JSON (first 500 chars):",
      fixedJson.substring(0, 500)
    );

    questions = JSON.parse(fixedJson);
    console.log("✅ Successfully parsed after aggressive cleanup!");
  } catch (secondError) {
```

**To:**

```javascript
// Clean up common JSON issues - MINIMALLY
jsonText = jsonText
  .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas before } and ]
  .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // REMOVE control characters (not replace with space)
  .trim();

console.log("Cleaned JSON (first 500 chars):", jsonText.substring(0, 500));

let questions;
try {
  questions = JSON.parse(jsonText);
} catch (parseError) {
  console.error("❌ JSON Parse Error:", parseError.message);
  console.error("📄 Full problematic JSON:", jsonText);

  // Try extraction of JSON array only
  try {
    console.log("🔧 Attempting to extract JSON array...");

    // Remove any text before first [ and after last ]
    const firstBracket = jsonText.indexOf("[");
    const lastBracket = jsonText.lastIndexOf("]");

    if (firstBracket === -1 || lastBracket === -1) {
      throw new Error("No JSON array found in response");
    }

    const extractedJson = jsonText.substring(firstBracket, lastBracket + 1);

    // Minimal cleanup - only remove control chars and newlines
    const fixedJson = extractedJson
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .replace(/[\r\n\t]/g, " ") // Only replace newlines, carriage returns, tabs with space
      .trim();

    console.log(
      "🔧 Extracted JSON (first 500 chars):",
      fixedJson.substring(0, 500)
    );

    questions = JSON.parse(fixedJson);
    console.log("✅ Successfully parsed after extraction!");
  } catch (secondError) {
```

---

## Fix 2: Add Content Validation in `src/lib/openai.js`

### Problem

Validation only checks if options array exists and has 4 items, but doesn't verify the content.

### Solution

**Change lines 414-434 from:**

```javascript
// Validate each question has required fields
questions.forEach((q, index) => {
  if (!q.question || typeof q.question !== "string") {
    throw new Error(
      `Question ${index + 1} missing or invalid 'question' field`
    );
  }
  if (!Array.isArray(q.options)) {
    throw new Error(`Question ${index + 1} 'options' must be an array`);
  }
  if (q.options.length !== 4) {
    throw new Error(
      `Question ${index + 1} must have exactly 4 options, got ${
        q.options.length
      }`
    );
  }
  if (
    typeof q.correctAnswer !== "number" ||
    q.correctAnswer < 0 ||
    q.correctAnswer > 3
  ) {
    throw new Error(
      `Question ${index + 1} has invalid correctAnswer: ${q.correctAnswer}`
    );
  }
});
```

**To:**

```javascript
// Validate each question has required fields AND valid content
questions.forEach((q, index) => {
  if (!q.question || typeof q.question !== "string") {
    throw new Error(
      `Question ${index + 1} missing or invalid 'question' field`
    );
  }
  if (!Array.isArray(q.options)) {
    throw new Error(`Question ${index + 1} 'options' must be an array`);
  }
  if (q.options.length !== 4) {
    throw new Error(
      `Question ${index + 1} must have exactly 4 options, got ${
        q.options.length
      }`
    );
  }

  // ✅ NEW: Validate option content
  q.options.forEach((option, optIndex) => {
    if (typeof option !== "string") {
      throw new Error(
        `Question ${index + 1}, Option ${
          optIndex + 1
        }: must be a string, got ${typeof option}`
      );
    }
    if (!option || !option.trim()) {
      throw new Error(
        `Question ${index + 1}, Option ${optIndex + 1}: cannot be empty`
      );
    }
    // Warn if option is suspiciously short (might be data corruption)
    if (option.trim().length < 2) {
      console.warn(
        `⚠️ Question ${index + 1}, Option ${
          optIndex + 1
        }: Very short option: "${option}"`
      );
    }
  });

  if (
    typeof q.correctAnswer !== "number" ||
    q.correctAnswer < 0 ||
    q.correctAnswer > 3
  ) {
    throw new Error(
      `Question ${index + 1} has invalid correctAnswer: ${q.correctAnswer}`
    );
  }

  // ✅ NEW: Validate correct answer content
  const correctAnswerText = q.options[q.correctAnswer];
  if (!correctAnswerText || !correctAnswerText.trim()) {
    throw new Error(
      `Question ${index + 1}: correct answer (Option ${
        q.correctAnswer + 1
      }) is empty`
    );
  }
});
```

---

## Fix 3: Add Better Error Logging for Shuffling

### Problem

When shuffling fails due to corrupted data, the issue is not clearly logged.

### Solution

**Change lines 437-448 to:**

```javascript
// Shuffle answer options randomly for each question
const shuffledQuestions = questions.map((q, qIndex) => {
  const correctAnswerText = q.options[q.correctAnswer];

  // ✅ Validate before shuffling
  if (!correctAnswerText || !correctAnswerText.trim()) {
    throw new Error(
      `Question ${qIndex + 1}: Cannot shuffle - correct answer is empty`
    );
  }

  // Shuffle the options array
  const shuffledOptions = [...q.options];
  for (let i = shuffledOptions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledOptions[i], shuffledOptions[j]] = [
      shuffledOptions[j],
      shuffledOptions[i],
    ];
  }

  // Find new index of correct answer after shuffling
  const newCorrectIndex = shuffledOptions.indexOf(correctAnswerText);

  // ✅ Validate after shuffling
  if (newCorrectIndex === -1) {
    console.error(`❌ Question ${qIndex + 1} shuffling failed:`, {
      originalCorrectAnswer: q.correctAnswer,
      correctAnswerText,
      shuffledOptions,
    });
    throw new Error(
      `Question ${
        qIndex + 1
      }: Failed to find correct answer after shuffling. This indicates data corruption.`
    );
  }

  return {
    ...q,
    options: shuffledOptions,
    correctAnswer: newCorrectIndex,
  };
});
```

---

## Fix 4: Add Frontend Validation in `src/components/QuizQuestion.js`

### Problem

The component displays options without checking if they're empty.

### Solution

**Add validation before rendering options (around line 102):**

```javascript
// Add this right before the options mapping
const hasEmptyOptions = question.options.some((opt) => !opt || !opt.trim());

if (hasEmptyOptions) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-3xl mx-auto p-8"
    >
      <div className="bg-red-50 border-2 border-red-400 rounded-2xl shadow-xl p-8 text-center">
        <h3 className="text-xl font-bold text-red-600 mb-2">
          ⚠️ Question Data Error
        </h3>
        <p className="text-red-700 mb-4">
          This question has incomplete data with empty options. This should not
          happen.
        </p>
        <p className="text-sm text-red-600">
          Please report this issue to support and try generating the quiz again.
        </p>
      </div>
    </motion.div>
  );
}
```

**Also update the options mapping to safely display:**

```javascript
{
  question.options.map((option, index) => (
    <motion.button
      key={index}
      whileHover={!answered ? { scale: 1.02 } : {}}
      whileTap={!answered ? { scale: 0.98 } : {}}
      onClick={() => handleAnswer(index)}
      disabled={answered}
      className={`w-full p-4 border-2 rounded-xl text-left transition-all flex items-center gap-3 cursor-pointer ${getOptionClass(
        index
      )}`}
    >
      <div className="w-8 h-8 rounded-full border-2 border-current flex items-center justify-center font-semibold">
        {String.fromCharCode(65 + index)}
      </div>
      <span className="flex-1 font-medium text-gray-800">
        {option && option.trim() ? option : "(Empty option - Data Error)"}
      </span>
    </motion.button>
  ));
}
```

---

## Fix 5: Add Retry Logic with Better AI Prompt in `src/lib/openai.js`

### Problem

Sometimes the AI returns incomplete JSON. We need better retry logic and clearer prompts.

### Solution

**Update the AI prompt to be more explicit (around line 225):**

```javascript
const prompt = `You are an expert quiz generator. Create exactly ${numberOfQuestions} multiple-choice questions about: "${cleanedTopic}"

CRITICAL REQUIREMENTS:
1. Create questions SPECIFICALLY about "${cleanedTopic}", NOT about quiz creation or the number of questions
2. EVERY question MUST have exactly 4 options - NO MORE, NO LESS
3. EVERY option MUST be a non-empty string with at least 2 characters
4. The correct answer must be one of the 4 options (index 0-3)
5. Return ONLY a valid JSON array - NO markdown, NO explanations, NO extra text

Difficulty Level: ${difficulty.toUpperCase()}
${difficultyInstructions[difficulty]}

For EACH question:
- Write a clear, specific question about "${cleanedTopic}"
- Provide exactly 4 plausible answer options (all must be non-empty)
- Mark which option (0, 1, 2, or 3) is correct
- Provide a 2-3 sentence explanation

EXACT OUTPUT FORMAT (no deviations):
[
  {
    "question": "What is...",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": 0,
    "explanation": "This is correct because..."
  },
  {
    "question": "When did...",
    "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
    "correctAnswer": 2,
    "explanation": "This is correct because..."
  }
]

VALIDATION CHECKS:
- Exactly ${numberOfQuestions} questions in array
- Each question has 'question', 'options', 'correctAnswer', 'explanation' fields
- Each 'options' array has exactly 4 non-empty strings
- Each 'correctAnswer' is 0, 1, 2, or 3

Return ONLY the JSON array, nothing else.`;
```

---

## Implementation Order

1. **First:** Apply Fix 2 (add content validation) - this will catch data issues early
2. **Second:** Apply Fix 1 (improve JSON parsing) - prevents corruption
3. **Third:** Apply Fix 3 (add shuffling validation) - gives better error messages
4. **Fourth:** Apply Fix 5 (better AI prompt) - prevents bad data from being generated
5. **Fifth:** Apply Fix 4 (frontend validation) - graceful error display

---

## Testing After Fixes

### Test 1: Generate Multiple Quizzes

- Generate 5+ quizzes with different topics
- Verify all options render correctly
- Check browser console for any validation errors

### Test 2: Edge Case Topics

- "JavaScript" (single word)
- "Machine Learning and Artificial Intelligence" (long phrase)
- "C++" (special characters)
- "What is the difference between XML and JSON?" (question format)

### Test 3: Difficulty Levels

- Generate quiz at Easy level
- Generate quiz at Medium level
- Generate quiz at Hard level
- All should have complete options

### Test 4: Logging

- Check console logs for:
  - "✅ Parsed X questions successfully"
  - NO "JSON Parse Error" messages
  - NO empty option warnings
  - NO "-1 correctAnswer" issues

### Test 5: Answer Submission

- Generate a quiz
- Answer all questions
- Submit and verify results show correct/incorrect
- No "undefined" answers should appear

---

## Rollback Plan

If issues occur after implementing fixes:

1. Revert `src/lib/openai.js` to previous version
2. Check if issue was in JSON parsing (Fix 1) or validation (Fix 2)
3. Apply fixes one at a time to isolate problem
4. Test after each fix

---

## Success Criteria

✅ All generated questions have exactly 4 non-empty options
✅ No blank option buttons appear in quiz display
✅ All answer submissions are graded correctly
✅ Console logs show no validation errors
✅ Quiz generation succeeds for all tested topics
✅ Shuffle logic maintains correct answer integrity
