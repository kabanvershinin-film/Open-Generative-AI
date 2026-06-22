import test from 'node:test';
import assert from 'node:assert/strict';
import { isSeedance2Model, rubFromTokensValue, seedance2RateCny } from '../pricingCore.js';

test('seedance2RateCny returns correct values', () => {
    const rate1 = seedance2RateCny('doubao-seedance-2-0-260128', '720p', false);
    assert.strictEqual(rate1, 46);
    
    const rate2 = seedance2RateCny('doubao-seedance-2-0-260128', '720p', true);
    assert.strictEqual(rate2, 28);
    
    const rate3 = seedance2RateCny('doubao-seedance-2-0-fast-260128', '1080p', false);
    assert.strictEqual(rate3, 41);
});

test('seedance2RateCny returns 0 for non-seedance models', () => {
    const rate = seedance2RateCny('veo3.1', '720p', false);
    assert.strictEqual(rate, 0);
});

test('isSeedance2Model detects supported family', () => {
    assert.strictEqual(isSeedance2Model('doubao-seedance-2-0-260128'), true);
    assert.strictEqual(isSeedance2Model('doubao-seedance-2-0-fast-260128'), true);
    assert.strictEqual(isSeedance2Model('veo3.1'), false);
});

test('rubFromTokensValue calculates correct rounded price', () => {
    const result = rubFromTokensValue(1_000_000, 46, 10.55, 1.15);
    assert.strictEqual(result, 558.09);
});

test('rubFromTokensValue returns 0 for invalid inputs', () => {
    assert.strictEqual(rubFromTokensValue(0, 46, 10.55, 1.15), 0);
    assert.strictEqual(rubFromTokensValue(1_000_000, 0, 10.55, 1.15), 0);
    assert.strictEqual(rubFromTokensValue(1_000_000, 46, 0, 1.15), 0);
    assert.strictEqual(rubFromTokensValue(1_000_000, 46, 10.55, 0), 0);
});
