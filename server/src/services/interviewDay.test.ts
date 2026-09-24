import assert from 'node:assert/strict';
import test from 'node:test';
import type { IFlashcard, IKit, IQuestion } from '../models/Kit.js';
import { analyzeDebrief, createInterviewDayPlan } from './interviewDay.js';

const questions: IQuestion[] = Array.from({ length: 6 }, (_, index) => ({ id: `q${index + 1}`, requirement_ids: ['r1'], category: index === 0 ? 'system-design' : 'technical', prompt: `Question ${index + 1}`, answer_outline: 'Answer', difficulty: index === 0 ? 3 : 2 }));
const flashcards: IFlashcard[] = [{ id: 'f1', front: 'Weak', back: 'Answer', requirement_ids: ['r1'], confidence_score: 1 }, { id: 'f2', front: 'Strong', back: 'Answer', requirement_ids: ['r1'], confidence_score: 3 }];

test('interview day selects a compact high-impact plan', () => {
  const plan = createInterviewDayPlan({ questions, flashcards, company_brief: { summary: 'Company summary', what_they_do: 'Builds products', sources: [] }, role: { title: 'Senior Engineer', requirements: [] }, stories: [] } as unknown as Pick<IKit, 'questions' | 'flashcards' | 'company_brief' | 'role' | 'stories'>);
  assert.equal(plan.top_question_ids.length, 5);
  assert.deepEqual(plan.flashcard_ids, ['f1', 'f2']);
  assert.equal(plan.questions_to_ask.length, 3);
});

test('debrief compares remembered questions and creates next focus', () => {
  const debrief = analyzeDebrief({ remembered_questions: ['Question 1'], unanswered_topics: ['Redis'], interviewer_feedback: 'Go deeper on failure handling.', confidence: 2, outcome: 'pending' }, { questions, role: { title: 'Senior Engineer', requirements: [] } } as unknown as Pick<IKit, 'questions' | 'role'>);
  assert.ok(debrief.gaps.length > 0);
  assert.ok(debrief.next_focus.includes('Redis'));
  assert.equal(debrief.confidence, 2);
});