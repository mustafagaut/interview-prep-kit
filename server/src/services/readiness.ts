import type { IFlashcard, IQuestion, IRequirement } from '../models/Kit.js';

export interface ReadinessInput {
  title: string;
  requirements: IRequirement[];
  questions: IQuestion[];
  flashcards: IFlashcard[];
  companyBrief: { summary: string; sources: string[] };
}

export interface ReadinessDimension {
  key: string;
  label: string;
  score: number;
  factors: string[];
}

export interface ReadinessReport {
  overall: number;
  dimensions: ReadinessDimension[];
  weak_topics: { requirement_id: string; topic: string; confidence: number; reason: string }[];
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function confidenceFor(requirementId: string, flashcards: IFlashcard[]): number {
  const related = flashcards.filter(card => card.requirement_ids.includes(requirementId));
  if (related.length === 0) return 0;
  return related.reduce((total, card) => total + (card.confidence_score || 0), 0) / related.length;
}

function practicedCount(questions: IQuestion[], flashcards: IFlashcard[]): number {
  return questions.filter(question => question.requirement_ids.some(id => flashcards.some(card => card.requirement_ids.includes(id) && (card.confidence_score || 0) > 0))).length;
}

export function calculateReadiness(input: ReadinessInput): ReadinessReport {
  const mustRequirements = input.requirements.filter(requirement => requirement.priority === 'must');
  const technicalQuestions = input.questions.filter(question => question.category === 'technical');
  const systemDesignQuestions = input.questions.filter(question => question.category === 'system-design');
  const behaviouralQuestions = input.questions.filter(question => question.category === 'behavioural');
  const companyQuestions = input.questions.filter(question => question.category === 'company-fit');
  const practiced = practicedCount(input.questions, input.flashcards);
  const ratedCards = input.flashcards.filter(card => (card.confidence_score || 0) > 0);
  const averageConfidence = ratedCards.length === 0 ? 0 : ratedCards.reduce((total, card) => total + (card.confidence_score || 0), 0) / ratedCards.length;
  const coverage = mustRequirements.length === 0 ? 100 : clamp((mustRequirements.length - input.requirements.filter(requirement => requirement.priority === 'must' && !input.questions.some(question => question.requirement_ids.includes(requirement.id))).length) / mustRequirements.length * 100);
  const weakTopics = input.requirements
    .map(requirement => ({ requirement, confidence: confidenceFor(requirement.id, input.flashcards) }))
    .filter(item => item.confidence < 2)
    .sort((left, right) => left.confidence - right.confidence)
    .slice(0, 5)
    .map(item => ({
      requirement_id: item.requirement.id,
      topic: item.requirement.text,
      confidence: Number(item.confidence.toFixed(1)),
      reason: item.confidence === 0 ? 'No practice rating recorded.' : 'Average confidence is below 2/3.',
    }));

  const dimensions: ReadinessDimension[] = [
    {
      key: 'technical-depth',
      label: 'Technical depth',
      score: clamp(technicalQuestions.length / Math.max(10, mustRequirements.length) * 60 + (averageConfidence / 3) * 40),
      factors: [`${technicalQuestions.length} technical questions`, `${practiced} questions connected to practice`, `average confidence: ${averageConfidence.toFixed(1)}/3`],
    },
    {
      key: 'jd-coverage',
      label: 'Job-description coverage',
      score: coverage,
      factors: [`${mustRequirements.length} must requirements`, `${Math.round(coverage)}% linked to questions`, `${input.requirements.length - mustRequirements.length} nice-to-have requirements`],
    },
    {
      key: 'company-knowledge',
      label: 'Company knowledge',
      score: clamp((input.companyBrief.summary.length > 80 ? 55 : 25) + Math.min(45, input.companyBrief.sources.length * 15)),
      factors: [`${input.companyBrief.sources.length} research sources`, input.companyBrief.summary.length > 0 ? 'Company brief available' : 'Company brief missing', `${companyQuestions.length} company-fit questions`],
    },
    {
      key: 'behavioral-readiness',
      label: 'Behavioral readiness',
      score: clamp(behaviouralQuestions.length / 3 * 60 + (averageConfidence / 3) * 40),
      factors: [`${behaviouralQuestions.length} behavioral questions`, `${ratedCards.length} rated flashcards`, `average confidence: ${averageConfidence.toFixed(1)}/3`],
    },
    {
      key: 'system-design-readiness',
      label: 'System design readiness',
      score: clamp(systemDesignQuestions.length / 4 * 60 + (averageConfidence / 3) * 40),
      factors: [`${systemDesignQuestions.length} system-design questions`, `${systemDesignQuestions.filter(question => question.difficulty === 3).length} advanced scenarios`, `average confidence: ${averageConfidence.toFixed(1)}/3`],
    },
    {
      key: 'weak-topic-confidence',
      label: 'Weak-topic confidence',
      score: clamp((averageConfidence / 3) * 100),
      factors: [`${weakTopics.length} weak topics detected`, `${ratedCards.length}/${input.flashcards.length} flashcards rated`, `average confidence: ${averageConfidence.toFixed(1)}/3`],
    },
    {
      key: 'communication',
      label: 'Interview communication',
      score: clamp(behaviouralQuestions.length / 3 * 50 + (averageConfidence / 3) * 50),
      factors: [`${behaviouralQuestions.length} experience prompts`, `${practiced} practiced questions`, 'Behavioral and company-fit answers support explanation practice'],
    },
    {
      key: 'practical-coding',
      label: 'Practical coding readiness',
      score: clamp(technicalQuestions.length / 10 * 70 + (ratedCards.length > 0 ? 30 : 0)),
      factors: [`${technicalQuestions.length} technical implementation questions`, `${input.questions.filter(question => question.difficulty === 3).length} difficult questions`, `${ratedCards.length} rated flashcards`],
    },
  ];

  return {
    overall: clamp(dimensions.reduce((total, dimension) => total + dimension.score, 0) / dimensions.length),
    dimensions,
    weak_topics: weakTopics,
  };
}