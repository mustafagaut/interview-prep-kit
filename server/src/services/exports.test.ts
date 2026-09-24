import assert from 'node:assert/strict';
import test from 'node:test';
import type { IKit } from '../models/Kit.js';
import { exportKitCsv, exportKitMarkdown } from './exports.js';

const kit = { source: { company: 'Example', role: 'Engineer' }, role: { title: 'Engineer', requirements: [{ id: 'r1', text: 'APIs', priority: 'must' }] }, questions: [{ id: 'q1', category: 'technical', prompt: 'Design an API', answer_outline: 'Discuss trade-offs', difficulty: 2 }], flashcards: [], schedule: { days_available: 1, days: [{ day: 1, focus: 'APIs', question_ids: ['q1'], minutes: 30 }] } } as unknown as Pick<IKit, 'source' | 'role' | 'questions' | 'flashcards' | 'schedule'>;

test('markdown export includes kit sections and question content', () => {
  const markdown = exportKitMarkdown(kit);
  assert.match(markdown, /# Engineer Interview Kit/);
  assert.match(markdown, /Design an API/);
  assert.match(markdown, /Schedule/);
});

test('CSV export escapes question fields', () => {
  const csv = exportKitCsv(kit);
  assert.match(csv, /id,category,prompt,answer_outline,difficulty/);
  assert.match(csv, /q1/);
});