import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import Kit from './Kit.js';

const mongoUri = process.env.MONGODB_URI;

test('persists builder and practice state', { skip: !mongoUri }, async () => {
  await mongoose.connect(mongoUri as string);
  const kit = await Kit.create({
    userId: new mongoose.Types.ObjectId(),
    source: { company_url: 'https://example.com' },
    role: {
      requirements: [{ id: 'r1', text: 'Build APIs', kind: 'technical', priority: 'must' }],
    },
    questions: [{
      id: 'q1',
      requirement_ids: ['r1'],
      category: 'technical',
      prompt: 'Original prompt',
      answer_outline: 'Original outline',
      difficulty: 3,
      is_edited: true,
      is_custom: true,
      is_pinned: true,
    }],
    flashcards: [{ id: 'f1', front: 'Question', back: 'Answer', requirement_ids: ['r1'], confidence_score: 1 }],
    schedule: { days_available: 1, days: [{ day: 1, focus: 'Focus', question_ids: ['q1'], minutes: 45 }] },
    coverage: { uncovered_requirement_ids: [], passes: 1 },
  });

  try {
    const persisted = await Kit.findById(kit._id).lean();
    assert.equal(persisted?.questions[0]?.is_edited, true);
    assert.equal(persisted?.questions[0]?.is_custom, true);
    assert.equal(persisted?.questions[0]?.is_pinned, true);
    assert.equal(persisted?.flashcards[0]?.confidence_score, 1);
  } finally {
    await Kit.deleteOne({ _id: kit._id });
    await mongoose.disconnect();
  }
});