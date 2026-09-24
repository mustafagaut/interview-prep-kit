import assert from 'node:assert/strict';
import test from 'node:test';
import type { IQuestion, IRequirement } from '../models/Kit.js';
import { createPressureSession } from './pressure.js';

const requirements: IRequirement[] = [{ id: 'r1', text: 'Redis caching', kind: 'technical', priority: 'must' }];
const questions: IQuestion[] = [{ id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Explain your Redis design.', answer_outline: 'Discuss trade-offs.', difficulty: 3 }];

test('pressure mode creates linked progressive follow-ups', () => {
  const session = createPressureSession(questions, requirements, 'hard', 'senior-staff-engineer');
  assert.equal(session.level, 'hard');
  assert.equal(session.personality, 'senior-staff-engineer');
  assert.ok(session.turns.some(turn => turn.purpose === 'trade-off'));
  assert.ok(session.turns.some(turn => turn.purpose === 'failure-mode'));
  assert.ok(session.turns.every(turn => turn.requirement_ids.includes('r1')));
  assert.match(session.guidance, /not adversarial/);
});

test('rapid-fire personality adds a concise implementation probe', () => {
  const session = createPressureSession(questions, requirements, 'normal', 'rapid-fire-technical');
  assert.ok(session.turns.some(turn => turn.prompt.includes('concise implementation sequence')));
});