import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// DeepSeek via OpenRouter configuration
export const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": process.env.NEXT_PUBLIC_SITE_NAME || "Quiz Generator App",
  },
});

// Google Gemini configuration
let geminiAI = null;
if (process.env.GEMINI_API_KEY) {
  geminiAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Generate quiz using Google Gemini
 * @param {string} prompt - The prompt for quiz generation
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<string>} - AI response text
 */
async function generateWithGemini(prompt, maxRetries = 2) {
  if (!geminiAI) {
    throw new Error(
      "Gemini API key not configured. Please set GEMINI_API_KEY environment variable."
    );
  }

  let retryCount = 0;
  while (retryCount <= maxRetries) {
    try {
      const model = geminiAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (apiError) {
      console.error(
        `❌ Gemini API Error (attempt ${retryCount + 1}/${maxRetries + 1}):`,
        apiError
      );

      if (retryCount < maxRetries) {
        retryCount++;
        console.log(
          `⏳ Retrying in 2 seconds... (attempt ${retryCount + 1}/${maxRetries + 1})`
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      } else {
        throw new Error(
          `Gemini API Error: ${apiError.message || "Unknown error"}`
        );
      }
    }
  }
}

/**
 * Generate quiz using DeepSeek via OpenRouter
 * @param {string} systemPrompt - System role prompt
 * @param {string} userPrompt - User prompt
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<string>} - AI response text
 */
async function generateWithDeepSeek(systemPrompt, userPrompt, maxRetries = 2) {
  let retryCount = 0;
  while (retryCount <= maxRetries) {
    try {
      const completion = await openai.chat.completions.create({
        model: "deepseek/deepseek-chat-v3.1:free",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 4000,
      });

      if (!completion || !completion.choices || completion.choices.length === 0) {
        throw new Error("No response from AI model");
      }

      return completion.choices[0].message.content.trim();
    } catch (apiError) {
      console.error(
        `❌ OpenRouter API Error (attempt ${retryCount + 1}/${maxRetries + 1}):`,
        apiError
      );

      // Check for specific error types
      if (apiError.message && apiError.message.includes("404")) {
        throw new Error(
          "Free model access blocked. Please go to https://openrouter.ai/settings/privacy and enable free model usage."
        );
      }

      // Check for 502 upstream errors
      if (
        apiError.status === 502 ||
        (apiError.message && apiError.message.includes("502"))
      ) {
        if (retryCount < maxRetries) {
          retryCount++;
          console.log(
            `⏳ Retrying in 2 seconds... (attempt ${retryCount + 1}/${
              maxRetries + 1
            })`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
          continue;
        } else {
          throw new Error(
            "The AI model is temporarily unavailable (upstream server error). Please try again in a few moments."
          );
        }
      }

      // For other errors, throw immediately
      throw new Error(`API Error: ${apiError.message}`);
    }
  }
}

export const generateQuizFromText = async (
  text,
  numberOfQuestions = 10,
  aiModel = "deepseek"
) => {
  try {
    console.log(`🤖 Using AI Model: ${aiModel.toUpperCase()}`);
    
    const prompt = `You are an AI quiz generator. Analyze the following content and generate exactly ${numberOfQuestions} multiple-choice questions. Each question should have:
- A clear, specific question
- Four answer options (labeled A, B, C, D)
- One correct answer (marked)
- A brief explanation (2-3 sentences)

Ensure questions are fact-based, diverse, and relevant to the document content. Format the output as a valid JSON array.

Content to analyze:
${text}

Return ONLY a JSON array in this exact format:
[
  {
    "question": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "This is correct because..."
  }
]`;

    let responseText;
    
    // Generate with selected AI model
    if (aiModel === "gemini") {
      responseText = await generateWithGemini(prompt);
    } else {
      // DeepSeek (default)
      const systemPrompt = "You are a helpful quiz generator that creates educational multiple-choice questions. Always return valid JSON arrays only.";
      responseText = await generateWithDeepSeek(systemPrompt, prompt);
    }

    // Extract JSON from markdown code blocks if present
    let jsonText = responseText;
    if (responseText.includes("```json")) {
      jsonText = responseText.split("```json")[1].split("```")[0].trim();
    } else if (responseText.includes("```")) {
      jsonText = responseText.split("```")[1].split("```")[0].trim();
    }

    // Remove any special tokens or garbage at the end (like <｜begin▁of▁sentence｜>)
    jsonText = jsonText
      .replace(/<[^>]*>/g, "") // Remove any HTML-like tags
      .replace(/｜[^｜]*｜/g, "") // Remove special token patterns
      .replace(/\s*<｜.*$/g, "") // Remove anything starting with <｜
      .trim();

    const questions = JSON.parse(jsonText);

    // Validate the structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid quiz format");
    }

    // Shuffle answer options randomly for each question
    const shuffledQuestions = questions.map((q) => {
      const correctAnswerText = q.options[q.correctAnswer];

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

      return {
        ...q,
        options: shuffledOptions,
        correctAnswer: newCorrectIndex,
      };
    });

    return shuffledQuestions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions. Please try again.");
  }
};

export const generateQuizFromPrompt = async (
  topic,
  numberOfQuestions = 10,
  difficulty = "medium",
  aiModel = "deepseek"
) => {
  try {
    console.log(`🤖 Using AI Model: ${aiModel.toUpperCase()}`);
    
    // Clean the topic to remove common instruction phrases
    // Users now enter the topic separately from the number field,
    // but we still handle cases where they write "create a quiz on X" or "quiz about X"
    let cleanedTopic = topic
      .replace(
        /^\s*(make|generate|create)\s+(a\s+)?(quiz|test)\s+(on|about|for|regarding)\s*/gi,
        ""
      )
      .replace(/^\s*(quiz|test)\s+(on|about|for|regarding)\s*/gi, "")
      .trim();

    // If the cleaned topic is empty, use the original
    if (!cleanedTopic) {
      cleanedTopic = topic;
    }

    console.log(`📝 Original topic: "${topic}"`);
    console.log(`🎯 Cleaned topic: "${cleanedTopic}"`);
    console.log(
      `📊 Generating ${numberOfQuestions} questions at ${difficulty} difficulty`
    );

    const difficultyInstructions = {
      easy: "Create basic, fundamental questions suitable for beginners. Focus on definitions, simple facts, and core concepts.",
      medium:
        "Create moderate difficulty questions that require understanding and application of concepts. Mix recall and reasoning.",
      hard: "Create advanced, challenging questions that require deep understanding, analysis, and critical thinking. Include complex scenarios.",
    };

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
- Provide exactly 4 plausible answer options (all must be non-empty strings)
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

IMPORTANT: 
- NO trailing commas in JSON
- Use double quotes for all strings
- Escape any quotes inside strings with backslash
- Return ONLY the JSON array, nothing else`;

    let responseText;
    
    // Generate with selected AI model
    if (aiModel === "gemini") {
      responseText = await generateWithGemini(prompt);
    } else {
      // DeepSeek (default)
      const systemPrompt = "You are an expert educational quiz generator. Create high-quality, accurate multiple-choice questions. ALWAYS return ONLY valid JSON arrays with NO markdown, NO explanations, NO additional text. Ensure proper JSON formatting with no trailing commas.";
      responseText = await generateWithDeepSeek(systemPrompt, prompt);
    }

    console.log(
      "Raw AI Response (first 500 chars):",
      responseText.substring(0, 500)
    );

    // Extract JSON from markdown code blocks if present
    let jsonText = responseText;
    if (responseText.includes("```json")) {
      jsonText = responseText.split("```json")[1].split("```")[0].trim();
    } else if (responseText.includes("```")) {
      jsonText = responseText.split("```")[1].split("```")[0].trim();
    }

    // Remove any special tokens or garbage at the end (like <｜begin▁of▁sentence｜>)
    jsonText = jsonText
      .replace(/<[^>]*>/g, "") // Remove any HTML-like tags
      .replace(/｜[^｜]*｜/g, "") // Remove special token patterns
      .replace(/\s*<｜.*$/g, "") // Remove anything starting with <｜
      .trim();

    // Clean up common JSON issues - MINIMALLY to prevent corruption
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

      // Try extraction of JSON array only (no aggressive regex)
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
        console.error("❌ Second parse attempt failed:", secondError.message);
        throw new Error(
          `Failed to parse AI response as JSON.\n` +
            `Original error: ${parseError.message}\n` +
            `Second attempt error: ${secondError.message}\n` +
            `AI returned: ${responseText.substring(0, 300)}...`
        );
      }
    }

    // Validate the structure
    if (!Array.isArray(questions)) {
      throw new Error(
        `Invalid quiz format - expected array, got ${typeof questions}`
      );
    }

    if (questions.length === 0) {
      throw new Error("Invalid quiz format - array is empty");
    }

    console.log(`✅ Parsed ${questions.length} questions successfully`);

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
            `Question ${index + 1}, Option ${optIndex + 1}: must be a string, got ${typeof option}`
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
            `⚠️ Question ${index + 1}, Option ${optIndex + 1}: Very short option: "${option}"`
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
          `Question ${index + 1}: correct answer (Option ${q.correctAnswer + 1}) is empty`
        );
      }
    });

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
          `Question ${qIndex + 1}: Failed to find correct answer after shuffling. This indicates data corruption.`
        );
      }

      return {
        ...q,
        options: shuffledOptions,
        correctAnswer: newCorrectIndex,
      };
    });

    console.log("✅ Quiz generated and shuffled successfully!");
    return shuffledQuestions;
  } catch (error) {
    console.error("❌ Error generating quiz from prompt:", error);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
};
