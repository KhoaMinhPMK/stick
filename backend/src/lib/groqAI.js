const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 5000, // 5 seconds timeout since this endpoint blocks the UI waiting for feedback
});

/**
 * Generate AI feedback for a journal entry.
 * Falls back to rule-based scoring if Groq API is unreachable.
 */
async function generateJournalFeedback({ content, language = 'en', level = 'intermediate' }) {
  const systemPrompt = `You are an expert English language tutor for the STICK language-learning app.
The student's proficiency level is: ${level}.

Analyze the following journal entry and return a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "enhancedText": "<a natural, polished version of the original text>",
  "corrections": [
    {
      "original": "<the incorrect text>",
      "corrected": "<the corrected text>",
      "explanation": "<brief explanation of the grammatical or stylistic fix>"
    }
  ],
  "vocabularyBoosters": [
    {
      "word": "<a native-like word or idiom to replace a basic one used>",
      "meaning": "<short definition>",
      "level": "<CEFR level estimate A1-C2>"
    }
  ],
  "sentencePatterns": [
    {
      "pattern": "<a useful sentence structure extracted or recommended>",
      "example": "<an example sentence using this pattern>"
    }
  ],
  "encouragement": "<a warm, motivating message to keep the student going>"
}

IMPORTANT: Return ONLY valid JSON. No markdown fences, no extra text.`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Journal entry (language: ${language}):\n\n${content}` },
      ],
      temperature: 0.3,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const text = response.choices[0]?.message?.content || '{}';

    try {
      return JSON.parse(text);
    } catch {
      return {
        overallScore: 0,
        summary: 'Unable to parse AI feedback',
        raw: text,
      };
    }
  } catch (err) {
    console.error('Groq API error, using fallback scoring:', err.message || err);
    return generateFallbackFeedback(content);
  }
}

/**
 * Simple rule-based feedback when AI is unavailable.
 */
function generateFallbackFeedback(content) {
  const words = content.split(/\s+/).filter(Boolean);
  const sentences = content.split(/[.!?]+/).filter(Boolean);
  const wordCount = words.length;
  const sentenceCount = Math.max(sentences.length, 1);
  const avgWordsPerSentence = wordCount / sentenceCount;

  // Simple scoring heuristics
  const lengthScore = Math.min(100, wordCount * 2);
  const fluencyScore = avgWordsPerSentence >= 5 && avgWordsPerSentence <= 20 ? 75 : 50;
  const overallScore = Math.round((lengthScore + fluencyScore) / 2);

  // Check for common errors
  const errors = [];
  if (content.match(/\bi\b(?![''])/g)) {
    errors.push({
      original: 'i',
      corrected: 'I',
      explanation: "The pronoun 'I' should always be capitalized in English.",
    });
  }

  return {
    overallScore,
    enhancedText: content,
    vocabularyBoosters: [],
    corrections: errors,
    sentencePatterns: [],
    encouragement: 'Great job writing today! Every journal entry helps you improve. Keep it up! 🌟',
    _fallback: true
  };
}

module.exports = {
  generateJournalFeedback,
};
