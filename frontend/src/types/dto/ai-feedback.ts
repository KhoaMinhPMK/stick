// Shared AI Feedback DTO and parser
// Single source of truth for reading feedback from journal.feedback field

export interface FeedbackCorrection {
  original: string;
  corrected: string;
  explanation: string;
}

export interface FeedbackVocabBooster {
  word: string;
  meaning: string;
  level?: string;
}

export interface LearningCandidate {
  expression: string;
  expressionType: 'word' | 'phrase' | 'collocation' | 'chunk';
  candidateType: 'new' | 'reinforce' | 'upgrade';
  meaning: string;
  example?: string;
  level?: string;
  meaningGap?: string;
}

export interface ExpressionUsage {
  expression: string;
  usedCorrectly: boolean;
  context?: string;
}

export interface FeedbackSentencePattern {
  pattern: string;
  example: string;
}

export interface AiFeedbackDto {
  overallScore: number;
  enhancedText: string;
  corrections: FeedbackCorrection[];
  vocabularyBoosters: FeedbackVocabBooster[];
  learningCandidates: LearningCandidate[];
  expressionUsage: ExpressionUsage[];
  sentencePatterns: FeedbackSentencePattern[];
  encouragement: string;
  mood?: string;
  _fallback?: boolean;
}

const EMPTY_FEEDBACK: AiFeedbackDto = {
  overallScore: 0,
  enhancedText: '',
  corrections: [],
  vocabularyBoosters: [],
  learningCandidates: [],
  expressionUsage: [],
  sentencePatterns: [],
  encouragement: '',
};

/**
 * Parse feedback from a journal record.
 * Handles: string JSON, object, null/undefined, and malformed input.
 */
export function parseFeedback(raw: string | object | null | undefined): AiFeedbackDto {
  if (!raw) return { ...EMPTY_FEEDBACK };

  let parsed: Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ...EMPTY_FEEDBACK };
    }
  } else if (typeof raw === 'object') {
    parsed = raw as Record<string, unknown>;
  } else {
    return { ...EMPTY_FEEDBACK };
  }

  const vocabularyBoosters = Array.isArray(parsed.vocabularyBoosters)
    ? (parsed.vocabularyBoosters as FeedbackVocabBooster[])
    : [];

  const learningCandidates = Array.isArray(parsed.learningCandidates)
    ? (parsed.learningCandidates as LearningCandidate[])
    : [];

  const expressionUsage = Array.isArray(parsed.expressionUsage)
    ? (parsed.expressionUsage as ExpressionUsage[])
    : [];

  return {
    overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : 0,
    enhancedText: typeof parsed.enhancedText === 'string'
      ? parsed.enhancedText
      : (typeof parsed.enhancedContent === 'string' ? parsed.enhancedContent : ''),
    corrections: Array.isArray(parsed.corrections) ? (parsed.corrections as FeedbackCorrection[]) : [],
    vocabularyBoosters,
    learningCandidates,
    expressionUsage,
    sentencePatterns: Array.isArray(parsed.sentencePatterns)
      ? (parsed.sentencePatterns as FeedbackSentencePattern[])
      : [],
    encouragement: typeof parsed.encouragement === 'string' ? parsed.encouragement : '',
    mood: typeof parsed.mood === 'string' ? parsed.mood : undefined,
    _fallback: parsed._fallback === true,
  };
}
