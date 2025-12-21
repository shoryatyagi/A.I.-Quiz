import OpenAI from "openai";

// Groq configuration using OpenAI-compatible API
const groqClient = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const GROQ_MODEL = process.env.GROQ_MODEL;

/**
 * Generate quiz using Groq API
 * @param {string} prompt - The prompt for quiz generation
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<string>} - AI response text
 */
async function generateWithGroq(prompt, maxRetries = 2) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error(
      "Groq API key not configured. Please set GROQ_API_KEY environment variable."
    );
  }

  let retryCount = 0;
  while (retryCount <= maxRetries) {
    try {
      console.log(`🚀 Using Groq model: ${GROQ_MODEL}`);

      const response = await groqClient.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
      });

      const responseText = response.choices[0]?.message?.content;

      if (!responseText) {
        throw new Error("No response from Groq");
      }

      return responseText;
    } catch (apiError) {
      console.error(
        `❌ Groq API Error (attempt ${retryCount + 1}/${maxRetries + 1}):`,
        apiError
      );

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
          `Groq API Error: ${apiError.message || "Unknown error"}`
        );
      }
    }
  }
}

export const generateQuizFromText = async (text, numberOfQuestions = 10) => {
  try {
    console.log(`🚀 Using Groq AI for quiz generation`);

    const prompt = `Analyze the following content and create EXACTLY ${numberOfQuestions} multiple-choice quiz questions based on the key concepts and facts in the text.

🎯 CRITICAL: You MUST generate EXACTLY ${numberOfQuestions} questions. NOT ${
      numberOfQuestions - 1
    }, NOT ${numberOfQuestions + 1}, but EXACTLY ${numberOfQuestions} questions.

CONTENT TO ANALYZE:
${text.substring(0, 8000)}

YOUR TASK:
Generate ${numberOfQuestions} questions that test understanding of the content above. Each question must have 4 options and 1 correct answer.

KEY RULES:
- Questions must be based ONLY on the actual content provided above
- If content is about a sport (soccer, football, basketball, etc.), ask about the sport itself - rules, players, teams, tournaments, tactics, history
- If content is about a programming language, ask about syntax, concepts, libraries, features
- Focus on the SUBJECT MATTER in the content, not meta topics
- Do NOT ask "Which country..." if the content is about a sport - focus on the sport aspects

OUTPUT FORMAT:
Return a JSON array with this structure:
[
  {
    "question": "Your question text here based on the content",
    "options": ["First option text", "Second option text", "Third option text", "Fourth option text"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct"
  }
]

RULES:
- Generate EXACTLY ${numberOfQuestions} questions - count them before submitting
- correctAnswer is a number: 0 for first option, 1 for second, 2 for third, 3 for fourth
- Do NOT use letters like "A", "B", "C", "D" - use numbers 0, 1, 2, 3
- Do NOT add "Option A:" or similar prefixes to the options
- Questions must be based on the actual content provided, not generic examples
- Return ONLY the JSON array, no other text or explanations`;

    let responseText = await generateWithGroq(prompt);

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
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Remove control characters
      .trim();

    console.log("Cleaned JSON (first 500 chars):", jsonText.substring(0, 500));

    let questions;
    try {
      questions = JSON.parse(jsonText);
    } catch (parseError) {
      console.error("❌ JSON Parse Error:", parseError.message);
      console.error(
        "📄 Problematic JSON (first 1000 chars):",
        jsonText.substring(0, 1000)
      );

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
          .replace(/[\r\n\t]/g, " ") // Replace newlines, carriage returns, tabs with space
          .replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
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
            `Response preview: ${responseText.substring(0, 300)}...`
        );
      }
    }

    // Validate the structure
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid quiz format: Expected an array of questions");
    }

    console.log(`✅ Parsed ${questions.length} questions successfully`);

    // ✅ HANDLE QUESTION COUNT MISMATCH
    if (questions.length !== numberOfQuestions) {
      console.warn(
        `⚠️ AI generated ${questions.length} questions but ${numberOfQuestions} were requested`
      );

      if (questions.length > numberOfQuestions) {
        console.log(
          `🔧 Trimming ${questions.length - numberOfQuestions} extra questions`
        );
        questions = questions.slice(0, numberOfQuestions);
      } else if (questions.length < numberOfQuestions) {
        const missingCount = numberOfQuestions - questions.length;
        console.log(
          `🔧 Generating ${missingCount} additional questions to reach ${numberOfQuestions}`
        );

        try {
          const additionalPrompt = `Analyze the following content and create EXACTLY ${missingCount} MORE multiple-choice quiz questions.

CONTENT TO ANALYZE:
${text.substring(0, 8000)}

🎯 CRITICAL: Generate EXACTLY ${missingCount} questions to add to an existing quiz.

OUTPUT FORMAT:
[
  {
    "question": "Your question text here",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct"
  }
]

Return ONLY the JSON array, no markdown, no extra text.`;

          let additionalResponseText = await generateWithGroq(additionalPrompt);

          let additionalJsonText = additionalResponseText;
          if (additionalResponseText.includes("```json")) {
            additionalJsonText = additionalResponseText
              .split("```json")[1]
              .split("```")[0]
              .trim();
          } else if (additionalResponseText.includes("```")) {
            additionalJsonText = additionalResponseText
              .split("```")[1]
              .split("```")[0]
              .trim();
          }

          additionalJsonText = additionalJsonText
            .replace(/<[^>]*>/g, "")
            .replace(/｜[^｜]*｜/g, "")
            .replace(/\s*<｜.*$/g, "")
            .replace(/,(\s*[}\]])/g, "$1")
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
            .trim();

          let additionalQuestions;
          try {
            additionalQuestions = JSON.parse(additionalJsonText);
          } catch (parseError) {
            const firstBracket = additionalJsonText.indexOf("[");
            const lastBracket = additionalJsonText.lastIndexOf("]");
            if (firstBracket !== -1 && lastBracket !== -1) {
              const extractedJson = additionalJsonText.substring(
                firstBracket,
                lastBracket + 1
              );
              const fixedJson = extractedJson
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
                .replace(/[\r\n\t]/g, " ")
                .replace(/,(\s*[}\]])/g, "$1")
                .trim();
              additionalQuestions = JSON.parse(fixedJson);
            } else {
              throw parseError;
            }
          }

          if (
            Array.isArray(additionalQuestions) &&
            additionalQuestions.length > 0
          ) {
            const questionsToAdd = additionalQuestions.slice(0, missingCount);
            questions = questions.concat(questionsToAdd);
            console.log(
              `✅ Successfully added ${questionsToAdd.length} questions. Total: ${questions.length}`
            );
          } else {
            console.warn(
              `⚠️ Could not generate additional questions. Proceeding with ${questions.length} questions.`
            );
          }
        } catch (retryError) {
          console.error(
            `❌ Failed to generate additional questions:`,
            retryError
          );
          console.log(
            `⚠️ Proceeding with ${questions.length} questions instead of ${numberOfQuestions}`
          );
        }
      }
    }

    // Validate and clean each question
    const validQuestions = questions.filter((q, index) => {
      // Check if question has all required fields
      if (!q.question || !Array.isArray(q.options)) {
        console.warn(
          `⚠️ Skipping invalid question at index ${index}: Missing question or options`
        );
        return false;
      }

      // Clean up options - remove "Option A:" prefix only
      q.options = q.options.map((opt) => {
        if (typeof opt === "string") {
          return opt
            .replace(/^Option [A-D]:\s*/i, "") // Remove "Option A:"
            .trim();
        }
        return opt;
      });

      // Check if options are valid
      if (
        q.options.length !== 4 ||
        q.options.some(
          (opt) => !opt || typeof opt !== "string" || opt.trim() === ""
        )
      ) {
        console.warn(
          `⚠️ Skipping question with invalid options at index ${index}`
        );
        return false;
      }

      // Convert correctAnswer to number if it's a letter (A, B, C, D)
      if (typeof q.correctAnswer === "string") {
        const letterToIndex = {
          A: 0,
          B: 1,
          C: 2,
          D: 3,
          a: 0,
          b: 1,
          c: 2,
          d: 3,
        };
        if (letterToIndex.hasOwnProperty(q.correctAnswer)) {
          q.correctAnswer = letterToIndex[q.correctAnswer];
          console.log(
            `✅ Converted correctAnswer "${q.correctAnswer}" to index ${
              letterToIndex[q.correctAnswer]
            } for question ${index + 1}`
          );
        } else {
          // Try parsing as number
          const parsed = parseInt(q.correctAnswer);
          if (!isNaN(parsed)) {
            q.correctAnswer = parsed;
          } else {
            console.warn(
              `⚠️ Skipping question with invalid correctAnswer at index ${index}: "${q.correctAnswer}"`
            );
            return false;
          }
        }
      }

      // Check if correctAnswer is valid number
      if (
        typeof q.correctAnswer !== "number" ||
        q.correctAnswer < 0 ||
        q.correctAnswer >= q.options.length
      ) {
        console.warn(
          `⚠️ Skipping question with invalid correctAnswer at index ${index}: ${q.correctAnswer}`
        );
        return false;
      }

      return true;
    });

    if (validQuestions.length === 0) {
      throw new Error("No valid questions generated. Please try again.");
    }

    if (validQuestions.length < questions.length) {
      console.log(
        `⚠️ Filtered out ${
          questions.length - validQuestions.length
        } invalid questions`
      );
    }

    // Shuffle answer options randomly for each question
    const shuffledQuestions = validQuestions.map((q) => {
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
        question: q.question,
        options: shuffledOptions,
        correctAnswer: newCorrectIndex,
        explanation: q.explanation || "No explanation provided.",
      };
    });

    console.log(
      `✅ Successfully generated ${shuffledQuestions.length} valid questions`
    );
    return shuffledQuestions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw new Error("Failed to generate quiz questions. Please try again.");
  }
};

export const generateQuizFromPrompt = async (
  topic,
  numberOfQuestions = 10,
  difficulty = "medium"
) => {
  try {
    console.log(`🚀 Using Groq AI for quiz generation`);

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

    const prompt = `You are an expert quiz generator. Create EXACTLY ${numberOfQuestions} multiple-choice questions about the topic: "${cleanedTopic}"

🎯 CRITICAL: You MUST generate EXACTLY ${numberOfQuestions} questions. NOT ${
      numberOfQuestions - 1
    }, NOT ${numberOfQuestions + 1}, but EXACTLY ${numberOfQuestions} questions.

TOPIC FOCUS AND INTERPRETATION:
- If topic is "soccer" or "football": Create questions about the SPORT itself - rules, gameplay, famous players, clubs/teams, leagues, tournaments (World Cup, Champions League, etc.), tactics, positions, equipment, history of the sport
- If topic is "Python": Create questions about the Python programming language - syntax, libraries, concepts, functions
- If topic is "History": Create questions about historical events, dates, figures, civilizations
- If topic is "Science": Create questions about scientific concepts, discoveries, principles, theories
- If topic is a subject/field: Create questions testing knowledge OF that subject/field

KEY RULES:
- ALL questions must be DIRECTLY RELATED to the subject matter of "${cleanedTopic}"
- Questions should test knowledge ABOUT "${cleanedTopic}" as a subject/topic/field
- DO NOT create meta questions about quizzes, AI, or question generation itself
- DO NOT ask "Which country..." when the topic is a sport - instead ask about teams, players, tournaments, rules, etc.
- Focus ONLY on factual knowledge about "${cleanedTopic}"

CRITICAL REQUIREMENTS:
1. Generate EXACTLY ${numberOfQuestions} questions - count them before submitting
2. Create questions SPECIFICALLY about the subject matter of "${cleanedTopic}" itself
3. Questions should test knowledge OF "${cleanedTopic}", not ABOUT how to create quizzes on it
4. EVERY question MUST have exactly 4 options - NO MORE, NO LESS
5. EVERY option MUST be a non-empty string with at least 2 characters
6. The correct answer must be one of the 4 options (index 0-3)
7. Return ONLY a valid JSON array - NO markdown, NO explanations, NO extra text

Difficulty Level: ${difficulty.toUpperCase()}
${difficultyInstructions[difficulty]}

For EACH question:
- Write a clear, specific question testing knowledge about "${cleanedTopic}"
- Provide exactly 4 plausible answer options (all must be non-empty strings)
- Mark which option (0, 1, 2, or 3) is correct
- Provide a 2-3 sentence explanation

EXAMPLE OUTPUT FORMAT (adapt to your topic):
Topic "Soccer/Football" examples:
[
  {
    "question": "Which club has won the most UEFA Champions League titles?",
    "options": ["Real Madrid", "Barcelona", "AC Milan", "Bayern Munich"],
    "correctAnswer": 0,
    "explanation": "Real Madrid has won the UEFA Champions League 14 times, more than any other club."
  },
  {
    "question": "What is the standard duration of a professional soccer match?",
    "options": ["80 minutes", "90 minutes", "100 minutes", "120 minutes"],
    "correctAnswer": 1,
    "explanation": "A standard professional soccer match consists of two 45-minute halves, totaling 90 minutes."
  }
]

Topic "Python Programming" examples:
[
  {
    "question": "Which keyword is used to define a function in Python?",
    "options": ["func", "define", "def", "function"],
    "correctAnswer": 2,
    "explanation": "The 'def' keyword is used to define functions in Python."
  }
]

DO NOT include any prefixes like "A.", "B.", "C.", "D." or "Option A:", "Option B:" in the options.
Just provide the plain answer text.

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

    let responseText = await generateWithGroq(prompt);

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

    // ✅ HANDLE QUESTION COUNT MISMATCH
    if (questions.length !== numberOfQuestions) {
      console.warn(
        `⚠️ AI generated ${questions.length} questions but ${numberOfQuestions} were requested`
      );

      if (questions.length > numberOfQuestions) {
        // If we got more than requested, trim to exact count
        console.log(
          `🔧 Trimming ${questions.length - numberOfQuestions} extra questions`
        );
        questions = questions.slice(0, numberOfQuestions);
      } else if (questions.length < numberOfQuestions) {
        // Generate missing questions
        const missingCount = numberOfQuestions - questions.length;
        console.log(
          `🔧 Generating ${missingCount} additional questions to reach ${numberOfQuestions}`
        );

        try {
          const additionalPrompt = `You are an expert quiz generator. Create EXACTLY ${missingCount} MORE multiple-choice questions about the topic: "${cleanedTopic}"

🎯 CRITICAL: You MUST generate EXACTLY ${missingCount} questions to add to an existing quiz.

TOPIC INTERPRETATION:
- If topic is "soccer" or "football": Create questions about the SPORT itself - rules, gameplay, famous players, clubs/teams, leagues, tournaments, tactics, positions
- If topic is a subject/field: Create questions testing knowledge OF that subject/field
- DO NOT ask "Which country..." when the topic is a sport - focus on sport-specific questions
- Focus ONLY on factual knowledge about "${cleanedTopic}"

TOPIC: "${cleanedTopic}"
Difficulty Level: ${difficulty.toUpperCase()}
${difficultyInstructions[difficulty]}

REQUIREMENTS:
1. Generate EXACTLY ${missingCount} questions - no more, no less
2. Each question must have exactly 4 options
3. Each option must be a non-empty string
4. correctAnswer must be 0, 1, 2, or 3
5. Return ONLY valid JSON array

OUTPUT FORMAT:
[
  {
    "question": "Your question text here",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0,
    "explanation": "Why this answer is correct"
  }
]

Return ONLY the JSON array, no markdown, no extra text.`;

          let additionalResponseText = await generateWithGroq(additionalPrompt);

          // Parse additional questions
          let additionalJsonText = additionalResponseText;
          if (additionalResponseText.includes("```json")) {
            additionalJsonText = additionalResponseText
              .split("```json")[1]
              .split("```")[0]
              .trim();
          } else if (additionalResponseText.includes("```")) {
            additionalJsonText = additionalResponseText
              .split("```")[1]
              .split("```")[0]
              .trim();
          }

          additionalJsonText = additionalJsonText
            .replace(/<[^>]*>/g, "")
            .replace(/｜[^｜]*｜/g, "")
            .replace(/\s*<｜.*$/g, "")
            .replace(/,(\s*[}\]])/g, "$1")
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
            .trim();

          let additionalQuestions;
          try {
            additionalQuestions = JSON.parse(additionalJsonText);
          } catch (parseError) {
            const firstBracket = additionalJsonText.indexOf("[");
            const lastBracket = additionalJsonText.lastIndexOf("]");
            if (firstBracket !== -1 && lastBracket !== -1) {
              const extractedJson = additionalJsonText.substring(
                firstBracket,
                lastBracket + 1
              );
              const fixedJson = extractedJson
                .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
                .replace(/[\r\n\t]/g, " ")
                .replace(/,(\s*[}\]])/g, "$1")
                .trim();
              additionalQuestions = JSON.parse(fixedJson);
            } else {
              throw parseError;
            }
          }

          if (
            Array.isArray(additionalQuestions) &&
            additionalQuestions.length > 0
          ) {
            // Take only what we need
            const questionsToAdd = additionalQuestions.slice(0, missingCount);
            questions = questions.concat(questionsToAdd);
            console.log(
              `✅ Successfully added ${questionsToAdd.length} questions. Total: ${questions.length}`
            );
          } else {
            console.warn(
              `⚠️ Could not generate additional questions. Proceeding with ${questions.length} questions.`
            );
          }
        } catch (retryError) {
          console.error(
            `❌ Failed to generate additional questions:`,
            retryError
          );
          console.log(
            `⚠️ Proceeding with ${questions.length} questions instead of ${numberOfQuestions}`
          );
        }
      }
    }

    // Validate each question has required fields AND valid content
    questions.forEach((q, index) => {
      if (!q.question || typeof q.question !== "string") {
        throw new Error(
          `Question ${index + 1} missing or invalid 'question' field`
        );
      }

      // Clean up options - remove "Option A:" prefix only
      if (Array.isArray(q.options)) {
        q.options = q.options.map((opt) => {
          if (typeof opt === "string") {
            return opt
              .replace(/^Option [A-D]:\s*/i, "") // Remove "Option A:"
              .trim();
          }
          return opt;
        });
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

      // Convert correctAnswer to number if it's a letter (A, B, C, D)
      if (typeof q.correctAnswer === "string") {
        const letterToIndex = {
          A: 0,
          B: 1,
          C: 2,
          D: 3,
          a: 0,
          b: 1,
          c: 2,
          d: 3,
        };
        if (letterToIndex.hasOwnProperty(q.correctAnswer)) {
          q.correctAnswer = letterToIndex[q.correctAnswer];
          console.log(
            `✅ Converted correctAnswer from letter to index for question ${
              index + 1
            }`
          );
        } else {
          // Try parsing as number
          const parsed = parseInt(q.correctAnswer);
          if (!isNaN(parsed)) {
            q.correctAnswer = parsed;
          }
        }
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

    console.log("✅ Quiz generated and shuffled successfully!");
    return shuffledQuestions;
  } catch (error) {
    console.error("❌ Error generating quiz from prompt:", error);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
};

// PDF functionality removed - generateQuizFromPDFUrl has been deleted
