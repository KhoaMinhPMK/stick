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
  generateDailyChallenge,
  generateGrammarQuiz,
  generateReadingContent,
};

/**
 * Generate a daily challenge (idiom/phrase/prompt) using Groq AI.
 * Deterministic per date via seed.
 */
async function generateDailyChallenge(dateStr) {
  const fallback = {
    phrase: 'Break the ice',
    meaning: 'To initiate conversation in a social setting, especially with strangers.',
    type: 'idiom',
    task: 'Write a short journal entry (at least 3 sentences) about a time you had to "break the ice" with someone new.',
    example: "I had to break the ice with my new classmates on the first day of school.",
  };

  try {
    const seed = dateStr.replace(/-/g, '');
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `You generate daily English challenges for a language learning app called STICK. Return ONLY valid JSON. The challenge should rotate between idioms, phrasal verbs, and useful expressions. Today's seed: ${seed}.

Return JSON:
{
  "phrase": "<the idiom or expression>",
  "meaning": "<clear definition>",
  "type": "<idiom|phrasal_verb|expression>",
  "task": "<a writing prompt using this phrase>",
  "example": "<example sentence using the phrase>"
}` },
        { role: 'user', content: `Generate a daily English challenge for date: ${dateStr}` }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      seed: parseInt(seed, 10) % 2147483647,
    });
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return parsed.phrase ? parsed : fallback;
  } catch (err) {
    console.error('generateDailyChallenge error:', err.message);
    return fallback;
  }
}

/**
 * Generate grammar quiz questions using Groq AI.
 */
async function generateGrammarQuiz(level = 'intermediate', count = 5) {
  const fallback = {
    questions: [{
      question: 'She _____ to the store yesterday.',
      options: ['go', 'goes', 'went', 'gone'],
      correct: 2,
      explanation: "Use past simple 'went' for completed actions in the past."
    }]
  };

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `You generate English grammar quiz questions for level: ${level}. Return ONLY valid JSON.

Return JSON:
{
  "questions": [
    {
      "question": "<sentence with _____ blank>",
      "options": ["<option1>", "<option2>", "<option3>", "<option4>"],
      "correct": <0-based index of correct answer>,
      "explanation": "<brief explanation why>"
    }
  ]
}

Generate exactly ${count} questions covering different grammar topics.` },
        { role: 'user', content: `Generate ${count} grammar questions for ${level} level.` }
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return Array.isArray(parsed.questions) && parsed.questions.length > 0 ? parsed : fallback;
  } catch (err) {
    console.error('generateGrammarQuiz error:', err.message);
    return fallback;
  }
}

/**
 * Generate reading content + comprehension using Groq AI.
 */
async function generateReadingContent(topic, level = 'intermediate') {
  const fallback = {
    title: 'The Power of Daily Habits',
    content: 'Building good habits is one of the most effective ways to improve your life. When you repeat a small action every day, it becomes automatic over time. The key is to start small and be consistent.',
    vocabulary: [
      { word: 'effective', meaning: 'successful in producing a desired result' },
      { word: 'consistent', meaning: 'acting the same way over time' },
    ],
  };

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `You generate short English reading passages for language learners at ${level} level. Return ONLY valid JSON.

Return JSON:
{
  "title": "<article title>",
  "content": "<150-250 word article paragraph>",
  "vocabulary": [
    { "word": "<key vocabulary word>", "meaning": "<simple definition>" }
  ]
}` },
        { role: 'user', content: `Write a short reading passage about: ${topic || 'daily life and personal growth'}` }
      ],
      temperature: 0.6,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return parsed.title ? parsed : fallback;
  } catch (err) {
    console.error('generateReadingContent error:', err.message);
    return fallback;
  }
}
