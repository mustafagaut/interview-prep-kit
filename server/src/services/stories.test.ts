import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeStory } from './stories.js';

test('story analysis identifies missing STAR components', () => {
  const analysis = analyzeStory({ title: 'Production incident', category: 'production-incident', situation: 'A payment outage affected checkout traffic.', task: 'Restore service and protect customers.', action: 'I coordinated rollback and added monitoring.', result: '' });
  assert.deepEqual(analysis.missing, ['result']);
  assert.equal(analysis.completeness, 75);
  assert.ok(analysis.follow_ups.length > 0);
});

test('complete story receives full completeness', () => {
  const analysis = analyzeStory({ title: 'Difficult bug', category: 'difficult-bug', situation: 'A production memory leak appeared after a release.', task: 'Find the source before peak traffic.', action: 'I profiled the service, isolated a listener leak, and shipped a fix.', result: 'Error rates returned to baseline and the team added a regression test.' });
  assert.deepEqual(analysis.missing, []);
  assert.equal(analysis.completeness, 100);
});