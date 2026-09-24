import type { IQuestion, IRequirement } from '../models/Kit.js';

export const pressureLevels = ['warm-up', 'normal', 'technical', 'hard', 'stress'] as const;
export type PressureLevel = typeof pressureLevels[number];

export const interviewerPersonalities = [
  'friendly-engineer',
  'senior-staff-engineer',
  'startup-cto',
  'big-tech-interviewer',
  'skeptical-reviewer',
  'system-design-expert',
  'hr-manager',
  'rapid-fire-technical',
] as const;
export type InterviewerPersonality = typeof interviewerPersonalities[number];

export interface PressureTurn {
  id: string;
  kind: 'opening' | 'follow-up';
  category: IQuestion['category'];
  prompt: string;
  requirement_ids: string[];
  purpose: 'depth' | 'why' | 'trade-off' | 'failure-mode' | 'contradiction' | 'scenario';
}

export interface PressureSession {
  level: PressureLevel;
  personality: InterviewerPersonality;
  turns: PressureTurn[];
  guidance: string;
}

const followUps: Record<PressureLevel, PressureTurn['purpose'][]> = {
  'warm-up': ['why'],
  normal: ['why', 'scenario'],
  technical: ['depth', 'trade-off', 'failure-mode'],
  hard: ['depth', 'trade-off', 'failure-mode', 'contradiction'],
  stress: ['depth', 'failure-mode', 'contradiction', 'scenario'],
};

const followUpCounts: Record<PressureLevel, number> = {
  'warm-up': 1,
  normal: 2,
  technical: 3,
  hard: 4,
  stress: 4,
};

function followUpPrompt(purpose: PressureTurn['purpose'], focus: string): string {
  if (purpose === 'why') return `Why did you choose that approach for ${focus}?`;
  if (purpose === 'trade-off') return `What trade-offs did you accept when designing ${focus}?`;
  if (purpose === 'failure-mode') return `What happens if ${focus} fails in production, and how does the system recover?`;
  if (purpose === 'contradiction') return `You said ${focus} was effective. What evidence would change your mind?`;
  if (purpose === 'scenario') return `Walk through a practical production scenario involving ${focus}.`;
  return `Go deeper on the implementation details of ${focus}.`;
}

export function createPressureSession(
  questions: IQuestion[],
  requirements: IRequirement[],
  level: PressureLevel = 'normal',
  personality: InterviewerPersonality = 'friendly-engineer',
): PressureSession {
  const selectedQuestions = questions.slice(0, level === 'warm-up' ? 3 : 5);
  const turns: PressureTurn[] = [];
  const purposes = followUps[level];
  selectedQuestions.forEach((question, questionIndex) => {
    const requirement = requirements.find(item => question.requirement_ids.includes(item.id));
    const focus = requirement?.text || question.prompt;
    turns.push({ id: `t${turns.length + 1}`, kind: 'opening', category: question.category, prompt: question.prompt, requirement_ids: question.requirement_ids, purpose: 'depth' });
    purposes.slice(0, followUpCounts[level]).forEach(purpose => {
      turns.push({ id: `t${turns.length + 1}`, kind: 'follow-up', category: question.category, prompt: followUpPrompt(purpose, focus), requirement_ids: question.requirement_ids, purpose });
    });
    if (questionIndex === 0 && personality === 'rapid-fire-technical') {
      turns.push({ id: `t${turns.length + 1}`, kind: 'follow-up', category: 'technical', prompt: `Give the concise implementation sequence for ${focus}.`, requirement_ids: question.requirement_ids, purpose: 'depth' });
    }
  });

  return {
    level,
    personality,
    turns,
    guidance: 'Answer from your actual experience. State assumptions, explain trade-offs, and say what evidence you would measure. The session is challenging, not adversarial.',
  };
}