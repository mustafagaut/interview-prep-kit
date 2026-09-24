import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateArchitectureSubmission, evaluateCodingSubmission } from './labs.js';

test('architecture evaluation explains missing operational dimensions', () => {
  const evaluation = evaluateArchitectureSubmission('Define API endpoints and a MongoDB schema with indexes. Add Redis caching and retries.');
  assert.ok(evaluation.total > 0);
  assert.ok(evaluation.strengths.includes('API design'));
  assert.ok(evaluation.improvements.some(improvement => improvement.includes('Threats')));
});

test('coding evaluation rewards tests and edge-case handling', () => {
  const evaluation = evaluateCodingSubmission('Return the result with O(n) complexity. Add tests for empty and invalid input, validate permissions, and assert errors.');
  assert.equal(evaluation.total, 100);
  assert.deepEqual(evaluation.improvements, []);
});