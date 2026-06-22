import test from 'node:test';
import assert from 'node:assert/strict';
import { rubFromTokensValue, seedance2RateCny } from './app/api/_lib/pricingCore.js';

test('seedance pricing smoke test', () => {
  const rate = seedance2RateCny('doubao-seedance-2-0-260128', '720p', false);
  const cost = rubFromTokensValue(516_000, rate, 10.55, 1.15);

  assert.strictEqual(rate, 46);
  assert.ok(cost > 0);
});
