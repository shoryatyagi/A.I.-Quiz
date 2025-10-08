import OpenAI from "openai";

export const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1", // ✅ FIXED
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": process.env.NEXT_PUBLIC_SITE_NAME || "Quiz Generator App",
  },
});

export const generateQuizFromText = async (text, numberOfQuestions = 10) => {
  try {
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

    let completion;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        completion = await openai.chat.completions.create({
          model: "openrouter/auto",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful quiz generator that creates educational multiple-choice questions. Always return valid JSON arrays only.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 4000,
        });

        // If successful, break out of retry loop
        break;
      } catch (apiError) {
        console.error(
          `❌ OpenRouter API Error (attempt ${retryCount + 1}/${
            maxRetries + 1
          }):`,
          apiError
        );

        // Check for specific error types
        if (apiError.message && apiError.message.includes("404")) {
          throw new Error(
            "Free model access blocked. Please go to https://openrouter.ai/settings/privacy and enable free model usage by allowing your data to be used for training."
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
              "The AI model is temporarily unavailable (upstream server error). Please try again in a few moments, or contact support if the issue persists."
            );
          }
        }

        // For other errors, throw immediately
        throw new Error(`API Error: ${apiError.message}`);
      }
    }

    // Add error checking
    console.log("API Response:", JSON.stringify(completion, null, 2));

    if (!completion || !completion.choices || completion.choices.length === 0) {
      console.error("Invalid API response:", completion);
      throw new Error(
        "No response from AI model. Please check your API settings."
      );
    }

    const responseText = completion.choices[0].message.content.trim();

    // Extract JSON from markdown code blocks if present
    let jsonText = responseText;
    if (responseText.includes("```json")) {
      jsonText = responseText.split("```json")[1].split("```")[0].trim();
    } else if (responseText.includes("```")) {
      jsonText = responseText.split("```")[1].split("```")[0].trim();
    }

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
  difficulty = "medium"
) => {
  try {
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

IMPORTANT: Create questions specifically about the subject "${cleanedTopic}" - NOT about creating quizzes or the number of questions.

Difficulty Level: ${difficulty.toUpperCase()}
${difficultyInstructions[difficulty]}

Requirements for each question:
- Clear, specific question about ${cleanedTopic}
- Four answer options (make them plausible but distinguishable)
- One correct answer
- Brief explanation (2-3 sentences) of why it's correct

Ensure questions:
- Cover different aspects of ${cleanedTopic}
- Are ${difficulty} difficulty level
- Are fact-based and accurate
- Have clear, unambiguous correct answers

Return ONLY a valid JSON array with NO additional text, markdown, or explanations. Use this EXACT format:
[
  {
    "question": "What is...",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "This is correct because..."
  }
]

IMPORTANT: 
- NO trailing commas in JSON
- Use double quotes for all strings
- Escape any quotes inside strings with backslash
- Return ONLY the JSON array, nothing else`;

    let completion;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        completion = await openai.chat.completions.create({
          model: "deepseek/deepseek-chat-v3.1:free",
          messages: [
            {
              role: "system",
              content:
                "You are an expert educational quiz generator. Create high-quality, accurate multiple-choice questions. ALWAYS return ONLY valid JSON arrays with NO markdown, NO explanations, NO additional text. Ensure proper JSON formatting with no trailing commas.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.8,
          max_tokens: 4000,
        });

        // If successful, break out of retry loop
        break;
      } catch (apiError) {
        console.error(
          `❌ OpenRouter API Error (attempt ${retryCount + 1}/${
            maxRetries + 1
          }):`,
          apiError
        );

        // Check for specific error types
        if (apiError.message && apiError.message.includes("404")) {
          throw new Error(
            "Free model access blocked. Please go to https://openrouter.ai/settings/privacy and enable free model usage by allowing your data to be used for training."
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
              "The AI model is temporarily unavailable (upstream server error). Please try again in a few moments, or contact support if the issue persists."
            );
          }
        }

        // For other errors, throw immediately
        throw new Error(`API Error: ${apiError.message}`);
      }
    }

    // Add error checking
    console.log("API Response:", JSON.stringify(completion, null, 2));

    if (!completion || !completion.choices || completion.choices.length === 0) {
      console.error("Invalid API response:", completion);
      throw new Error(
        "No response from AI model. Please check your API settings."
      );
    }

    let responseText = completion.choices[0].message.content.trim();

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

    console.log("✅ Quiz generated and shuffled successfully!");
    return shuffledQuestions;
  } catch (error) {
    console.error("❌ Error generating quiz from prompt:", error);
    throw new Error(`Failed to generate quiz: ${error.message}`);
  }
};
