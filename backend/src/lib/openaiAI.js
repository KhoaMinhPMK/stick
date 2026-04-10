const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 2,
});

// Defaults — overridden by AppConfig values read in the route layer
const DEFAULT_CHAT_MODEL = 'gpt-4.1';
const DEFAULT_FAST_MODEL = 'gpt-4.1-mini';

/**
 * Generate AI feedback for a journal entry.
 * Falls back to rule-based scoring if OpenAI API is unreachable.
 */
async function generateJournalFeedback({
  content,
  language = 'en',
  level = 'intermediate',
  goal = '',
  knownWords = [],
  errorPatterns = [],
  lexiconContext = null,
  isPremium = false,
  config = {},
}) {
  // Config from AppConfig DB (passed by route layer)
  const cfgModel = config.model || DEFAULT_CHAT_MODEL;
  const cfgTemp  = config.temperature ?? 0.3;
  const cfgMax   = config.maxTokens || (isPremium ? 4000 : 2500);
  const learnerGoal = goal || 'build a daily English habit';

  const patternHint =
    Array.isArray(errorPatterns) && errorPatterns.length > 0
      ? `\nThis student's known recurring problem areas (address these if relevant in this entry): ${errorPatterns.map((p) => p.errorType.replace(/_/g, ' ')).join(', ')}.`
      : '';

  let lexiconBlock = '';
  if (lexiconContext && (lexiconContext.activeCount > 0 || lexiconContext.masteredCount > 0)) {
    const parts = [];
    if (lexiconContext.learningItems) {
      parts.push(
        `Expressions the learner is currently acquiring (suggest as REINFORCE if they fit a meaning gap):\n${lexiconContext.learningItems}`
      );
    }
    if (lexiconContext.masteredList) {
      parts.push(
        `Expressions the learner already owns (do NOT suggest these): ${lexiconContext.masteredList}`
      );
    }
    lexiconBlock = `\n\nLEARNER'S LANGUAGE MEMORY:\n${parts.join('\n\n')}`;
  } else {
    const knownWordsList =
      Array.isArray(knownWords) && knownWords.length > 0
        ? knownWords.slice(0, 12).join(', ')
        : 'none yet';
    lexiconBlock = `\nWords or phrases already saved in the learner's notebook: ${knownWordsList}.`;
  }

  const tutorPersonality = config.tutorStyle
    || 'You are a warm, encouraging English tutor for the STICK app — a daily micro-learning tool that helps Vietnamese learners think in English.';

  const systemPrompt = `${tutorPersonality}

Student proficiency level: ${level}
Student learning goal: ${learnerGoal}${lexiconBlock}${patternHint}

CRITICAL RULES:
1. The student may write in Vietnamese, English, or a mix. This is NORMAL — never penalize it. Produce a FULLY ENGLISH "enhancedText" that preserves the student's original meaning and tone.
2. "enhancedText" must be natural, conversational English — not formal or academic.
3. For Vietnamese food names, cultural terms, or proper nouns (e.g. "bánh mì", "phở", "Tết"), keep them as-is inside the English text.
4. Keep corrections concise (max ${isPremium ? 6 : 4}). Focus on the most impactful improvements only.
5. "learningCandidates" contains 0–${isPremium ? 5 : 3} expressions tied to the learner's MEANING GAPS in this entry.
   Each must have a candidateType:
   - "new": expression the learner has never encountered — fills a clear meaning gap
   - "reinforce": learner has seen/saved it before but never used it naturally — now there's real context
   - "upgrade": learner attempted a phrase but used it awkwardly — suggest a better/more natural form
6. Each learningCandidate must fill a MEANING GAP — something the learner tried to express but couldn't say naturally. Describe the gap in "meaningGap".
7. Prefer phrases/collocations over single words. Prefer "reinforce" over "new" when both fit equally.
8. Do NOT suggest expressions the learner has already mastered (listed in LANGUAGE MEMORY as "do NOT suggest").
9. "expressionUsage": scan the learner's text for any expressions from their LANGUAGE MEMORY. Report each with correct/incorrect usage and the relevant context quote.
10. Still include "vocabularyBoosters" as a simplified mirror of learningCandidates for backward compatibility.
11. The "meaning" field should be short and learner-facing: explain the meaning AND when to use it in this exact context.
12. Include 0–2 "sentencePatterns" that are reusable and directly match the learner's message topic.
13. "encouragement" must be warm and personal — reference something specific the student wrote.
14. Score 0–100: effort (30%), English usage (30%), clarity (20%), grammar (20%). Full-Vietnamese entry still earns 20–40 for effort + clarity.

Return ONLY a valid JSON object — no markdown fences, no extra text:
{
  "overallScore": <number 0-100>,
  "enhancedText": "<natural English version>",
  "corrections": [
    { "original": "<original text>", "corrected": "<improved text>", "explanation": "<brief friendly explanation>" }
  ],
  "learningCandidates": [
    {
      "expression": "<word, phrase, collocation, or chunk>",
      "expressionType": "<word|phrase|collocation|chunk>",
      "candidateType": "<new|reinforce|upgrade>",
      "meaning": "<short definition + when to use>",
      "example": "<natural example sentence>",
      "level": "<CEFR level A1-C2>",
      "meaningGap": "<what the learner was trying to say but couldn't>"
    }
  ],
  "expressionUsage": [
    { "expression": "<expression from language memory>", "usedCorrectly": <true|false>, "context": "<quote from learner's text>" }
  ],
  "vocabularyBoosters": [
    { "word": "<expression>", "meaning": "<short definition>", "level": "<CEFR level>" }
  ],
  "sentencePatterns": [
    { "pattern": "<reusable sentence structure>", "example": "<example using this pattern>" }
  ],
  "encouragement": "<warm personal message>"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: cfgModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Journal entry (original language: ${language}):\n\n${content}` },
      ],
      temperature: cfgTemp,
      max_tokens: cfgMax,
      response_format: { type: 'json_object' },
    });

    const text = response.choices[0]?.message?.content || '{}';
    try {
      return JSON.parse(text);
    } catch {
      return { overallScore: 0, summary: 'Unable to parse AI feedback', raw: text };
    }
  } catch (err) {
    console.error('OpenAI API error, using fallback scoring:', err.message || err);
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

  const lengthScore = Math.min(100, wordCount * 2);
  const fluencyScore = avgWordsPerSentence >= 5 && avgWordsPerSentence <= 20 ? 75 : 50;
  const overallScore = Math.round((lengthScore + fluencyScore) / 2);

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
    _fallback: true,
  };
}

/**
 * Generate a daily challenge using OpenAI.
 */
async function generateDailyChallenge(dateStr) {
  const fallback = {
    phrase: 'Break the ice',
    meaning: 'To initiate conversation in a social setting, especially with strangers.',
    type: 'idiom',
    task: 'Write a short journal entry (at least 3 sentences) about a time you had to "break the ice" with someone new.',
    example: 'I had to break the ice with my new classmates on the first day of school.',
  };

  try {
    const seed = dateStr.replace(/-/g, '');
    const response = await openai.chat.completions.create({
      model: DEFAULT_FAST_MODEL,
      messages: [
        {
          role: 'system',
          content: `You generate daily English challenges for a language learning app called STICK. Return ONLY valid JSON. Rotate between idioms, phrasal verbs, and useful expressions. Today's date seed: ${seed}.

Return JSON:
{
  "phrase": "<the idiom or expression>",
  "meaning": "<clear definition>",
  "type": "<idiom|phrasal_verb|expression>",
  "task": "<a writing prompt using this phrase>",
  "example": "<example sentence using the phrase>"
}`,
        },
        { role: 'user', content: `Generate a daily English challenge for date: ${dateStr}` },
      ],
      temperature: 0.9,
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return parsed.phrase ? parsed : fallback;
  } catch (err) {
    console.error('generateDailyChallenge error:', err.message);
    return fallback;
  }
}

/**
 * Generate grammar quiz questions using OpenAI.
 */
async function generateGrammarQuiz(level = 'intermediate', count = 5) {
  const fallback = {
    questions: [
      {
        question: 'She _____ to the store yesterday.',
        options: ['go', 'goes', 'went', 'gone'],
        correct: 2,
        explanation: "Use past simple 'went' for completed actions in the past.",
      },
    ],
  };

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_FAST_MODEL,
      messages: [
        {
          role: 'system',
          content: `You generate English grammar quiz questions for level: ${level}. Return ONLY valid JSON.

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

Generate exactly ${count} questions covering different grammar topics.`,
        },
        { role: 'user', content: `Generate ${count} grammar questions for ${level} level.` },
      ],
      temperature: 0.7,
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
 * Generate reading content + comprehension using OpenAI.
 */
async function generateReadingContent(topic, level = 'intermediate') {
  const fallback = {
    title: 'The Power of Daily Habits',
    content:
      'Building good habits is one of the most effective ways to improve your life. When you repeat a small action every day, it becomes automatic over time. The key is to start small and be consistent.',
    vocabulary: [
      { word: 'effective', meaning: 'successful in producing a desired result' },
      { word: 'consistent', meaning: 'acting the same way over time' },
    ],
  };

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_FAST_MODEL,
      messages: [
        {
          role: 'system',
          content: `You generate short English reading passages for language learners at ${level} level. Return ONLY valid JSON.

Return JSON:
{
  "title": "<article title>",
  "content": "<150-250 word article paragraph>",
  "vocabulary": [
    { "word": "<key vocabulary word>", "meaning": "<simple definition>" }
  ]
}`,
        },
        {
          role: 'user',
          content: `Write a short reading passage about: ${topic || 'daily life and personal growth'}`,
        },
      ],
      temperature: 0.8,
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

/**
 * Generate exercises for a lesson based on topic, level, and vocabulary
 * @param {Object} opts - { topic, level, category, vocabulary, exerciseCount, exerciseTypes }
 * @returns {Object} - { exercises: [...] }
 */
async function generateLessonExercises(opts = {}) {
  const {
    topic = 'daily conversation',
    level = 'beginner',
    category = 'grammar',
    vocabulary = [],
    exerciseCount = 5,
    exerciseTypes = ['multiple_choice', 'fill_blank'],
  } = opts;

  const vocabContext = vocabulary.length > 0
    ? `Use these vocabulary items where possible: ${vocabulary.map(v => `${v.word} (${v.meaning})`).join(', ')}`
    : '';

  const fallback = {
    exercises: [
      {
        type: 'multiple_choice',
        question: 'What is the correct form?',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        points: 10,
        explanation: 'This is a placeholder exercise. Please regenerate.',
      },
    ],
  };

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_FAST_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a professional English language exercise creator for a mobile learning app.
Create ${exerciseCount} exercises for ${level} level learners. Category: ${category}. Topic: ${topic}.
${vocabContext}

Allowed exercise types: ${exerciseTypes.join(', ')}

RULES:
- Each exercise must be clear, concise, and appropriate for the level
- Avoid trick questions
- Provide helpful explanations for each answer
- For fill_blank exercises, include acceptableAnswers as an array of valid answers
- For match exercises, provide correctPairs as [[left, right], ...]
- For reorder exercises, provide correctOrder as an array of words/phrases in correct order
- Points per exercise: 10 for standard, 15 for harder ones

Return ONLY valid JSON:
{
  "exercises": [
    {
      "type": "multiple_choice",
      "question": "<question text>",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "<correct option text>",
      "points": 10,
      "explanation": "<why this is correct>"
    },
    {
      "type": "fill_blank",
      "question": "I ___ to school every day.",
      "correctAnswer": "go",
      "acceptableAnswers": ["go", "walk"],
      "points": 10,
      "explanation": "<explanation>"
    },
    {
      "type": "match",
      "instruction": "Match the words with their meanings",
      "correctPairs": [["hello", "xin chao"], ["goodbye", "tam biet"]],
      "points": 15,
      "explanation": "<explanation>"
    },
    {
      "type": "reorder",
      "instruction": "Put the words in the correct order",
      "words": ["to", "I", "school", "go"],
      "correctOrder": ["I", "go", "to", "school"],
      "points": 10,
      "explanation": "<explanation>"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Create ${exerciseCount} exercises about "${topic}" for ${level} ${category} learners. Use types: ${exerciseTypes.join(', ')}.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return parsed.exercises ? parsed : fallback;
  } catch (err) {
    console.error('generateLessonExercises error:', err.message);
    return fallback;
  }
}

/**
 * Generate complete lesson content from a topic
 * @param {Object} opts - { topic, level, category, includeExercises }
 * @returns {Object} - { title, titleVi, description, sections: [...] }
 */
async function generateLessonContent(opts = {}) {
  const {
    topic = 'daily conversation',
    level = 'beginner',
    category = 'grammar',
    includeExercises = true,
  } = opts;

  const fallback = {
    title: topic,
    titleVi: null,
    description: `Learn about ${topic}`,
    sections: [
      { type: 'text', title: 'Introduction', content: `This lesson covers ${topic}.` },
    ],
  };

  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a professional English language lesson creator for a mobile learning app called STICK.
STICK helps Vietnamese learners build the habit of thinking in English daily.

Create a complete lesson about "${topic}" for ${level} level. Category: ${category}.

RULES:
- Content must be practical, relatable to daily life
- Language must be appropriate for ${level} level
- Vietnamese translations are helpful where noted
- Keep sections short and scannable (mobile-first)
- Exercises should be fun, not exam-like
- Total lesson should take about 5 minutes

Return ONLY valid JSON with this structure:
{
  "title": "<lesson title in English>",
  "titleVi": "<Vietnamese title>",
  "description": "<1-2 sentence description>",
  "sections": [
    {
      "type": "text",
      "title": "<section heading>",
      "content": "<explanatory text, keep short>"
    },
    {
      "type": "vocab",
      "title": "Key Vocabulary",
      "items": [
        { "word": "<word>", "meaning": "<Vietnamese meaning>", "example": "<example sentence>", "pronunciation": "<IPA if helpful>" }
      ]
    },
    {
      "type": "grammar",
      "title": "<grammar point>",
      "pattern": "<pattern like: S + V + O>",
      "examples": ["<example 1>", "<example 2>"],
      "notes": "<brief note in Vietnamese if helpful>"
    },
    {
      "type": "exercises",
      "title": "Practice",
      "exercises": [
        {
          "type": "multiple_choice",
          "question": "<question>",
          "options": ["A", "B", "C", "D"],
          "correctAnswer": "<correct>",
          "points": 10,
          "explanation": "<why>"
        },
        {
          "type": "fill_blank",
          "question": "She ___ to work every day.",
          "correctAnswer": "goes",
          "acceptableAnswers": ["goes", "walks"],
          "points": 10,
          "explanation": "<why>"
        }
      ]
    },
    {
      "type": "summary",
      "title": "Quick Review",
      "content": "<brief summary of key takeaways>"
    }
  ]
}`,
        },
        {
          role: 'user',
          content: `Create a complete ${level} ${category} lesson about: ${topic}${includeExercises ? '. Include 3-5 exercises.' : '. No exercises needed.'}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return parsed.title ? parsed : fallback;
  } catch (err) {
    console.error('generateLessonContent error:', err.message);
    return fallback;
  }
}

/**
 * Evaluate whether a user's sentence correctly uses the daily challenge phrase.
 * Returns { correct, feedback, suggestion }.
 */
async function evaluateDailyChallenge({ sentence, phrase, meaning }) {
  const fallback = {
    correct: true,
    feedback: 'Great attempt! Keep practising to express yourself more naturally.',
    suggestion: sentence,
  };
  try {
    const response = await openai.chat.completions.create({
      model: DEFAULT_FAST_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are a friendly English language coach helping learners use phrases naturally. 
Evaluate whether the user's sentence correctly and naturally uses the given phrase. 
Respond in JSON only:
{
  "correct": true|false,
  "feedback": "<short, encouraging 1-2 sentence comment>",
  "suggestion": "<an improved or alternative version of the sentence if needed, otherwise repeat the user's sentence>"
}`,
        },
        {
          role: 'user',
          content: `Phrase: "${phrase}" (meaning: "${meaning}")
User's sentence: "${sentence}"
Evaluate the usage.`,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
      response_format: { type: 'json_object' },
    });
    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      correct: parsed.correct !== false,
      feedback: parsed.feedback || fallback.feedback,
      suggestion: parsed.suggestion || sentence,
    };
  } catch (err) {
    console.error('evaluateDailyChallenge error:', err.message);
    return fallback;
  }
}

/**
 * Transcribe audio using OpenAI Whisper (speech-to-text).
 * @param {Buffer} buffer - raw audio bytes (webm/mp4/m4a/ogg etc.)
 * @returns {Promise<string>} transcript text in English
 */
async function transcribeAudio(buffer) {
  const os = require('os');
  const path = require('path');
  const crypto = require('crypto');
  const fs = require('fs');
  const tmpPath = path.join(os.tmpdir(), `stick_${crypto.randomUUID()}.webm`);
  fs.writeFileSync(tmpPath, buffer);
  try {
    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: 'whisper-1',
      language: 'en',
      response_format: 'text',
    });
    return typeof response === 'string' ? response : (response.text || '');
  } finally {
    try { fs.unlinkSync(tmpPath); } catch (_) {}
  }
}

/**
 * Convert text to speech using OpenAI TTS API.
 * Returns a Buffer containing MP3 audio.
 * @param {string} text - Text to speak (max 4096 chars)
 * @param {string} [voice='nova'] - OpenAI voice: alloy, echo, fable, onyx, nova, shimmer
 */
async function textToSpeech(text, voice = 'nova') {
  const response = await openai.audio.speech.create({
    model: 'tts-1',
    voice,
    input: text,
    response_format: 'mp3',
  });
  return Buffer.from(await response.arrayBuffer());
}

module.exports = {
  generateJournalFeedback,
  generateDailyChallenge,
  generateGrammarQuiz,
  generateReadingContent,
  generateLessonExercises,
  generateLessonContent,
  evaluateDailyChallenge,
  transcribeAudio,
  textToSpeech,
};
