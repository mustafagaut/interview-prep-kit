import assert from 'node:assert/strict';
import test from 'node:test';
import type { IFlashcard, IQuestion, IRequirement } from '../models/Kit.js';
import { createDailyWeakness, findBlindSpots } from './weakness.js';

const requirements: IRequirement[] = [
  { id: 'r1', text: 'MongoDB indexing at scale', kind: 'technical', priority: 'must' },
  { id: 'r2', text: 'Team communication', kind: 'behavioural', priority: 'nice' },
];
const questions: IQuestion[] = [
  { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Index?', answer_outline: 'Explain indexes.', difficulty: 3 },
  { id: 'q2', requirement_ids: ['r2'], category: 'behavioural', prompt: 'Team?', answer_outline: 'Use STAR.', difficulty: 2 },
];
const flashcards: IFlashcard[] = [{ id: 'f1', front: 'Index?', back: 'Answer', requirement_ids: ['r1'], confidence_score: 1 }];

test('blind spots prioritize must requirements with thin coverage', () => {
  const blindSpots = findBlindSpots(requirements, questions, flashcards);
  assert.equal(blindSpots[0]?.requirement_id, 'r1');
  assert.equal(blindSpots[0]?.impact, 'high');
  assert.match(blindSpots[0]?.reason || '', /thin question coverage/);
});

test('daily weakness selects one topic with bounded study material', () => {
  const daily = createDailyWeakness(requirements, questions, flashcards, '2026-09-24');
  assert.equal(daily?.date, '2026-09-24');
  assert.equal(daily?.requirement_id, 'r1');
  assert.equal(daily?.question_ids.length, 1);
  assert.match(daily?.practical_scenario || '', /MongoDB/);
});