import pdf from "pdf-parse-fork";

export const parsePDF = async (buffer) => {
  try {
    // Parse PDF using pdf-parse-fork
    const data = await pdf(buffer);

    // Clean and preprocess the text
    let text = data.text
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/\n+/g, "\n") // Replace multiple newlines with single newline
      .trim();

    // Check if we have enough content
    if (text.length < 100) {
      throw new Error(
        "PDF content is too short to generate meaningful questions."
      );
    }

    // Limit text length to avoid token limits (approximately 8000 words)
    const maxLength = 32000; // characters
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + "...";
    }

    return {
      text,
      numPages: data.numpages,
      info: data.info || {},
    };
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error(
      "Failed to parse PDF. Please ensure the file is a valid PDF document."
    );
  }
};
