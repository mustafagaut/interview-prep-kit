import type { IKit } from '../models/Kit.js';
import { calculateReadiness } from './readiness.js';
import { findBlindSpots } from './weakness.js';

export interface NextAction {
  type: 'practice-question' | 'review-flashcards' | 'run-pressure-session' | 'fix-blind-spot' | 'practice-story';
  title: string;
  reason: string;
  target_tab: string;
  target_id?: string;
}

export function getNextBestAction(kit: Pick<IKit, 'questions' | 'flashcards' | 'role' | 'company_brief' | 'stories'>): NextAction {
  const blindSpots = findBlindSpots(kit.role.requirements, kit.questions, kit.flashcards);
  const highImpactSpot = blindSpots.find(spot => spot.impact === 'high');
  if (highImpactSpot) return { type: 'fix-blind-spot', title: `Fix ${highImpactSpot.topic}`, reason: highImpactSpot.reason, target_tab: 'blind-spots', target_id: highImpactSpot.requirement_id };
  const weakFlashcard = kit.flashcards.find(card => (card.confidence_score || 0) < 2);
  if (weakFlashcard) return { type: 'review-flashcards', title: 'Review your weakest flashcard', reason: 'A confidence score below 2/3 is the fastest visible readiness gain.', target_tab: 'flashcards', target_id: weakFlashcard.id };
  const systemDesignQuestion = kit.questions.find(question => question.category === 'system-design');
  if (systemDesignQuestion) return { type: 'run-pressure-session', title: 'Run a system-design pressure session', reason: 'Progressive follow-ups test trade-offs and failure handling beyond recall.', target_tab: 'pressure', target_id: systemDesignQuestion.id };
  if ((kit.stories || []).some(story => (story.analysis?.completeness || 0) < 100)) return { type: 'practice-story', title: 'Complete a STAR story', reason: 'One or more stories are missing evidence in Situation, Task, Action, or Result.', target_tab: 'stories' };
  const nextQuestion = kit.questions.find(question => question.difficulty === 3) || kit.questions[0];
  const action: NextAction = { type: 'practice-question', title: 'Practice your next question', reason: 'Keep the preparation loop moving with a high-value question.', target_tab: 'questions' };
  if (nextQuestion) action.target_id = nextQuestion.id;
  return action;
}

export function createMissionControl(kit: IKit) {
  return {
    kit_id: String(kit._id),
    target_role: kit.role.title || kit.source.role,
    company: kit.source.company,
    readiness: calculateReadiness({ title: kit.role.title, requirements: kit.role.requirements, questions: kit.questions, flashcards: kit.flashcards, companyBrief: kit.company_brief }),
    next_action: getNextBestAction(kit),
    top_risks: findBlindSpots(kit.role.requirements, kit.questions, kit.flashcards).slice(0, 3),
  };
}