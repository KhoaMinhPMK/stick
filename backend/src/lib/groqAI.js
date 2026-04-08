const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  timeout: 5000, // 5 seconds timeout since this endpoint blocks the UI waiting for feedback
});

/**
 * Generate AI feedback for a journal entry.
 * Falls back to rule-based scoring if Groq API is unreachable.
 */
async function generateJournalFeedback({ content, language = 'en', level = 'intermediate', goal = '', knownWords = [], errorPatterns = [], lexiconContext = null, isPremium = false }) {
  const learnerGoal = goal || 'build a daily English habit';

  // Build recurring error context so the AI coaches specifically on weak spots
  const patternHint = Array.isArray(errorPatterns) && errorPatterns.length > 0
    ? `\nThis student's known recurring problem areas (address these if relevant in this entry): ${errorPatterns.map(p => p.errorType.replace(/_/g, ' ')).join(', ')}.`
    : '';

  // Build learner lexicon context (new system — overrides knownWords when available)
  let lexiconBlock = '';
  if (lexiconContext && (lexiconContext.activeCount > 0 || lexiconContext.masteredCount > 0)) {
    const parts = [];
    if (lexiconContext.learningItems) {
      parts.push(`Expressions the learner is currently acquiring (suggest as REINFORCE if they fit a meaning gap):\n${lexiconContext.learningItems}`);
    }
    if (lexiconContext.masteredList) {
      parts.push(`Expressions the learner already owns (do NOT suggest these): ${lexiconContext.masteredList}`);
    }
    lexiconBlock = `\n\nLEARNER'S LANGUAGE MEMORY:\n${parts.join('\n\n')}`;
  } else {
    // Fallback to old knownWords list
    const knownWordsList = Array.isArray(knownWords) && knownWords.length > 0
      ? knownWords.slice(0, 12).join(', ')
      : 'none yet';
    lexiconBlock = `\nWords or phrases already saved in the learner's notebook: ${knownWordsList}.`;
  }

  const systemPrompt = `You are a warm, encouraging English tutor for the STICK app — a daily micro-learning tool that helps Vietnamese learners think in English.
The student's proficiency level is: ${level}.
The student's current learning goal is: ${learnerGoal}.${lexiconBlock}${patternHint}

CRITICAL RULES:
1. The student may write in Vietnamese, English, or a mix of both (code-switching). This is NORMAL — never penalize it. Your job is to produce a FULLY ENGLISH version that preserves the student's original meaning and tone.
2. The "enhancedText" must be natural, conversational English — not formal or academic. Write as a native speaker would casually express the same thought.
3. For Vietnamese food names, cultural terms, or proper nouns (e.g. "bánh mì", "phở", "Tết"), keep them in the original Vietnamese form inside the English text — do NOT translate them.
4. Keep corrections concise (max ${isPremium ? 6 : 4}). Focus on the most impactful improvements.
5. "learningCandidates" contains 0-${isPremium ? 5 : 3} expressions worth learning, tied to the learner's meaning gaps. Each must have a candidateType:
   - "new": expression the learner has never encountered — fills a clear meaning gap from this entry
   - "reinforce": expression the learner has seen/saved before but never used naturally — now there's a real context for it
   - "upgrade": expression the learner attempted but used awkwardly — a better/more natural form
6. Each learningCandidate must fill a MEANING GAP — something the learner was trying to express but couldn't say naturally. Describe the gap in "meaningGap".
7. Prefer phrases/collocations over single words. Prefer "reinforce" over "new" when both fit equally well.
8. Do NOT suggest expressions the learner has already mastered/owns (listed above as "do NOT suggest").
9. After 5+ suggestions of the same expression with no user engagement, stop suggesting it.
10. "expressionUsage": scan the learner's text for any expressions from their LANGUAGE MEMORY above. Report whether each detected expression was used correctly and naturally, with the relevant context quote.
11. Still include "vocabularyBoosters" as a simplified mirror of learningCandidates for backward compatibility.
12. The "meaning" field should be short and learner-facing. Explain both the meaning and when to use it in this exact context.
13. Sentence patterns should contain only 0-2 reusable patterns that match the student's message.
14. Encouragement must be warm and personal — reference something specific the student wrote.
15. Score 0-100 based on: effort (30%), English usage (30%), clarity of expression (20%), grammar (20%). A full-Vietnamese entry still gets 20-40 for effort + clarity.

Return a JSON object with this exact structure:
{
  "overallScore": <number 0-100>,
  "enhancedText": "<natural English version preserving original meaning>",
  "corrections": [
    {
      "original": "<the original text>",
      "corrected": "<the improved text>",
      "explanation": "<brief, friendly explanation>"
    }
  ],
  "learningCandidates": [
    {
      "expression": "<a useful word, phrase, collocation, or chunk>",
      "expressionType": "<word|phrase|collocation|chunk>",
      "candidateType": "<new|reinforce|upgrade>",
      "meaning": "<short definition + when to use>",
      "example": "<natural example sentence>",
      "level": "<CEFR level A1-C2>",
      "meaningGap": "<what the learner was trying to say but couldn't>"
    }
  ],
  "expressionUsage": [
    {
      "expression": "<expression from language memory>",
      "usedCorrectly": <true|false>,
      "context": "<quote from learner's text>"
    }
  ],
  "vocabularyBoosters": [
    {
      "word": "<same as first learningCandidate expression>",
      "meaning": "<short definition>",
      "level": "<CEFR level>"
    }
  ],
  "sentencePatterns": [
    {
      "pattern": "<a useful sentence structure>",
      "example": "<example using this pattern>"
    }
  ],
  "encouragement": "<warm, personal message referencing what they wrote>"
}

Before answering, silently check:
- Did I preserve the student's meaning?
- Did I tie each learningCandidate to a real meaning gap?
- Did I check the language memory for expressions the learner attempted?
- Did I avoid suggesting mastered expressions?
- If no meaning gap exists, did I return an empty learningCandidates array rather than forcing suggestions?

IMPORTANT: Return ONLY valid JSON. No markdown fences, no extra text.`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Journal entry (original language: ${language}):\n\n${content}` },
      ],
      temperature: 0.3,
      max_tokens: isPremium ? 3000 : 2000,
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
