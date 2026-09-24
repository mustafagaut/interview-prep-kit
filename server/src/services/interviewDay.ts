import type { IFlashcard, IKit, IQuestion } from '../models/Kit.js';

export interface InterviewDayPlan {
  top_question_ids: string[];
  flashcard_ids: string[];
  company_summary: string;
  introduction: string;
  star_story_ids: string[];
  questions_to_ask: string[];
}

export interface DebriefInput {
  remembered_questions: string[];
  unanswered_topics: string[];
  interviewer_feedback: string;
  confidence: number;
  outcome: string;
}

export interface InterviewDebrief extends DebriefInput {
  predicted_topics: string[];
  predicted_question_ids: string[];
  gaps: string[];
  next_focus: string[];
  created_at: string;
}

export function createInterviewDayPlan(kit: Pick<IKit, 'questions' | 'flashcards' | 'company_brief' | 'role' | 'stories'>): InterviewDayPlan {
  const rankedQuestions = [...kit.questions].sort((left, right) => Number(right.difficulty) - Number(left.difficulty));
  const weakCards = [...kit.flashcards].sort((left, right) => (left.confidence_score || 0) - (right.confidence_score || 0));
  return {
    top_question_ids: rankedQuestions.slice(0, 5).map(question => question.id),
    flashcard_ids: weakCards.slice(0, 3).map(card => card.id),
    company_summary: kit.company_brief.summary,
    introduction: `I am preparing for the ${kit.role.title || 'target role'} by connecting my experience to the role requirements and the company's needs.`,
    star_story_ids: (kit.stories || []).slice(0, 3).map(story => story.id),
    questions_to_ask: [
      'What would success look like in the first 90 days?',
      'Which technical trade-offs is the team thinking about this year?',
      'How does the team learn from production incidents?',
    ],
  };
}

export function analyzeDebrief(input: DebriefInput, kit: Pick<IKit, 'questions' | 'role'>): InterviewDebrief {
  const predictedTopics = kit.questions.map(question => question.prompt);
  const rememberedText = input.remembered_questions.join(' ').toLowerCase();
  const gaps = kit.questions.filter(question => !rememberedText.includes(question.category.replace('-', ' ')) && !rememberedText.includes(question.prompt.toLowerCase().slice(0, 20))).slice(0, 5).map(question => question.prompt);
  const nextFocus = [...input.unanswered_topics, ...gaps].filter(Boolean).slice(0, 5);
  return { ...input, predicted_topics: predictedTopics.slice(0, 10), predicted_question_ids: kit.questions.slice(0, 10).map(question => question.id), gaps, next_focus: nextFocus, created_at: new Date().toISOString() };
}