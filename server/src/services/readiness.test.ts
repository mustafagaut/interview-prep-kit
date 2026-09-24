import assert from 'node:assert/strict';
import test from 'node:test';
import type { IFlashcard, IQuestion, IRequirement } from '../models/Kit.js';
import { calculateReadiness } from './readiness.js';

const requirements: IRequirement[] = [
  { id: 'r1', text: 'Build scalable APIs', kind: 'technical', priority: 'must' },
  { id: 'r2', text: 'Communicate with stakeholders', kind: 'behavioural', priority: 'must' },
];

const questions: IQuestion[] = [
  { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'API question', answer_outline: 'Trade-offs', difficulty: 3 },
  { id: 'q2', requirement_ids: ['r1'], category: 'system-design', prompt: 'Architecture question', answer_outline: 'Scale', difficulty: 3 },
  { id: 'q3', requirement_ids: ['r2'], category: 'behavioural', prompt: 'Story question', answer_outline: 'STAR', difficulty: 2 },
  { id: 'q4', requirement_ids: ['r1'], category: 'company-fit', prompt: 'Role question', answer_outline: 'Motivation', difficulty: 2 },
];

test('readiness returns bounded explainable dimensions', () => {
  const report = calculateReadiness({
    title: 'Senior MERN Stack Developer',
    requirements,
    questions,
    flashcards: [
      { id: 'f1', front: 'API', back: 'Answer', requirement_ids: ['r1'], confidence_score: 1 },
      { id: 'f2', front: 'Story', back: 'Answer', requirement_ids: ['r2'], confidence_score: 3 },
    ] as IFlashcard[],
    companyBrief: { summary: 'A detailed company brief with enough source context.', sources: ['https://example.com/about'] },
  });

  assert.equal(report.dimensions.length, 8);
  assert.ok(report.overall >= 0 && report.overall <= 100);
  assert.ok(report.dimensions.every(dimension => dimension.score >= 0 && dimension.score <= 100 && dimension.factors.length > 0));
  assert.equal(report.weak_topics[0]?.requirement_id, 'r1');
});