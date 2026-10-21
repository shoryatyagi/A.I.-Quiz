/**
 * API Helper for Flask Backend
 * Handles all API requests with authentication
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Make an authenticated API request
 */
export async function apiRequest(endpoint, options = {}) {
  const { method = 'GET', body, auth, headers: customHeaders = {} } = options;
  
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  
  // Add auth token if user is authenticated
  if (auth && auth.getIdToken) {
    try {
      const idToken = await auth.getIdToken();
      headers['Authorization'] = `Bearer ${idToken}`;
    } catch (error) {
      console.error('Failed to get auth token:', error);
    }
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }
  
  return data;
}

/**
 * Generate quiz from topic using AI
 */
export async function generateQuiz(topic, numberOfQuestions, difficulty, auth = null) {
  return apiRequest('/api/generate-quiz', {
    method: 'POST',
    body: { topic, numberOfQuestions, difficulty },
    auth,
  });
}

/**
 * Process PDF and extract text chunks
 */
export async function processPdfChunks(file, numberOfQuestions) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('numberOfQuestions', numberOfQuestions.toString());
  
  const response = await fetch(`${API_URL}/api/process-pdf-chunks`, {
    method: 'POST',
    body: formData,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to process PDF');
  }
  
  return data;
}

/**
 * Generate quiz from PDF text chunks
 */
export async function generateQuizFromChunks(chunks, numberOfQuestions, quizName, auth = null) {
  return apiRequest('/api/generate-quiz-from-pdf-chunks', {
    method: 'POST',
    body: { chunks, numberOfQuestions, quizName },
    auth,
  });
}

/**
 * Get user's quiz history
 */
export async function getQuizHistory(auth) {
  return apiRequest('/api/quiz-history', { auth });
}

/**
 * Get specific quiz history by ID
 */
export async function getQuizHistoryById(id, auth) {
  return apiRequest(`/api/quiz-history/${id}`, { auth });
}

/**
 * Save quiz result to history
 */
export async function saveQuizHistory(quizData, auth) {
  return apiRequest('/api/quiz-history', {
    method: 'POST',
    body: quizData,
    auth,
  });
}

/**
 * Delete quiz history
 */
export async function deleteQuizHistory(id, auth) {
  return apiRequest(`/api/quiz-history/${id}`, {
    method: 'DELETE',
    auth,
  });
}

/**
 * Health check
 */
export async function healthCheck() {
  return apiRequest('/api/health');
}
