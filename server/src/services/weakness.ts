import type { IFlashcard, IQuestion, IRequirement } from '../models/Kit.js';

export interface BlindSpot {
  requirement_id: string;
  topic: string;
  priority: 'must' | 'nice';
  question_count: number;
  average_confidence: number;
  reason: string;
  impact: 'high' | 'medium';
}

export interface DailyWeakness {
  date: string;
  requirement_id: string;
  topic: string;
  why_it_matters: string;
  explanation: string;
  flashcard_ids: string[];
  question_ids: string[];
  practical_scenario: string;
  follow_up: string;
}

function confidenceFor(requirementId: string, flashcards: IFlashcard[]): number {
  const related = flashcards.filter(card => card.requirement_ids.includes(requirementId));
  return related.length === 0 ? 0 : related.reduce((total, card) => total + (card.confidence_score || 0), 0) / related.length;
}

export function findBlindSpots(requirements: IRequirement[], questions: IQuestion[], flashcards: IFlashcard[]): BlindSpot[] {
  return requirements.map(requirement => {
    const questionCount = questions.filter(question => question.requirement_ids.includes(requirement.id)).length;
    const averageConfidence = confidenceFor(requirement.id, flashcards);
    const missingPractice = averageConfidence < 2;
    const thinCoverage = questionCount < (requirement.priority === 'must' ? 2 : 1);
    return { requirement, questionCount, averageConfidence, missingPractice, thinCoverage };
  }).filter(item => item.missingPractice || item.thinCoverage)
    .sort((left, right) => Number(right.requirement.priority === 'must') - Number(left.requirement.priority === 'must') || left.averageConfidence - right.averageConfidence)
    .map(item => ({
      requirement_id: item.requirement.id,
      topic: item.requirement.text,
      priority: item.requirement.priority,
      question_count: item.questionCount,
      average_confidence: Number(item.averageConfidence.toFixed(1)),
      reason: item.thinCoverage && item.missingPractice ? 'Important JD topic has thin question coverage and low practice confidence.' : item.thinCoverage ? 'Important JD topic has too few linked questions.' : 'Practice confidence is below 2/3 for this JD topic.',
      impact: item.requirement.priority === 'must' ? 'high' : 'medium',
    }));
}

export function createDailyWeakness(requirements: IRequirement[], questions: IQuestion[], flashcards: IFlashcard[], date = new Date().toISOString().slice(0, 10)): DailyWeakness | null {
  const blindSpots = findBlindSpots(requirements, questions, flashcards);
  const weakest = blindSpots[0];
  if (!weakest) return null;
  const topicQuestions = questions.filter(question => question.requirement_ids.includes(weakest.requirement_id)).slice(0, 2);
  const topicCards = flashcards.filter(card => card.requirement_ids.includes(weakest.requirement_id)).slice(0, 3);
  return {
    date,
    requirement_id: weakest.requirement_id,
    topic: weakest.topic,
    why_it_matters: `${weakest.priority === 'must' ? 'This is a must-have JD requirement' : 'This is a relevant JD requirement'} with ${weakest.question_count} linked question${weakest.question_count === 1 ? '' : 's'} and ${weakest.average_confidence}/3 average confidence.`,
    explanation: `Spend three minutes explaining ${weakest.topic} from first principles, then connect it to one production example.`,
    flashcard_ids: topicCards.map(card => card.id),
    question_ids: topicQuestions.map(question => question.id),
    practical_scenario: `A production issue appears in ${weakest.topic}. Describe your diagnosis, mitigation, and verification steps.`,
    follow_up: `What trade-off would you revisit if the scale or constraints around ${weakest.topic} changed?`,
  };
}