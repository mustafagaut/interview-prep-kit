import assert from 'node:assert/strict';
import test from 'node:test';
import { getFeatureFlags, isFeatureEnabled } from './featureFlags.js';

test('feature flags default on and honor explicit environment values', () => {
  const previous = process.env.FEATURE_LABS;
  delete process.env.FEATURE_LABS;
  assert.equal(isFeatureEnabled('labs'), true);
  process.env.FEATURE_LABS = 'false';
  assert.equal(isFeatureEnabled('labs'), false);
  process.env.FEATURE_LABS = 'true';
  assert.equal(getFeatureFlags().labs, true);
  if (previous === undefined) delete process.env.FEATURE_LABS;
  else process.env.FEATURE_LABS = previous;
});