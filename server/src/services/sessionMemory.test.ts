import assert from 'node:assert/strict';
import test from 'node:test';
import { updateSessionMemory } from './sessionMemory.js';

test('session memory records claims and unfinished topics without inventing facts', () => {
  const session = { memory: { claims: [], weaknesses: [], contradictions: [], unfinished_topics: [] } };
  updateSessionMemory(session, { answer: 'I designed and implemented a Redis cache for our API.', topic: 'Redis' });
  updateSessionMemory(session, { answer: "I don't know how failover was configured.", topic: 'Redis failure handling' });
  assert.equal(session.memory.claims.length, 1);
  assert.deepEqual(session.memory.unfinished_topics, ['Redis failure handling']);
  assert.deepEqual(session.memory.weaknesses, ['Redis failure handling']);
});