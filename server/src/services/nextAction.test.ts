import assert from 'node:assert/strict';
import test from 'node:test';
import type { IFlashcard, IQuestion, IRequirement } from '../models/Kit.js';
import { getNextBestAction } from './nextAction.js';

const requirements: IRequirement[] = [{ id: 'r1', text: 'Redis caching', kind: 'technical', priority: 'must' }];
const questions: IQuestion[] = [{ id: 'q1', requirement_ids: ['r1'], category: 'system-design', prompt: 'Design caching', answer_outline: 'Trade-offs', difficulty: 3 }];

test('next action prioritizes high-impact blind spots', () => {
  const action = getNextBestAction({ questions, flashcards: [{ id: 'f1', front: 'Redis', back: 'Answer', requirement_ids: ['r1'], confidence_score: 1 }] as IFlashcard[], role: { title: 'Senior Engineer', seniority: 'Senior', responsibilities: [], requirements }, company_brief: { summary: '', what_they_do: '', sources: [] }, stories: [] });
  assert.equal(action.type, 'fix-blind-spot');
  assert.equal(action.target_tab, 'blind-spots');
});

test('next action reaches pressure practice after weak topics improve', () => {
  const action = getNextBestAction({ questions: [...questions, { ...questions[0] as IQuestion, id: 'q2', prompt: 'Second design question' }], flashcards: [{ id: 'f1', front: 'Redis', back: 'Answer', requirement_ids: ['r1'], confidence_score: 3 }] as IFlashcard[], role: { title: 'Senior Engineer', seniority: 'Senior', responsibilities: [], requirements }, company_brief: { summary: 'Detailed brief', what_they_do: '', sources: ['source'] }, stories: [] });
  assert.equal(action.type, 'run-pressure-session');
  assert.equal(action.target_tab, 'pressure');
});