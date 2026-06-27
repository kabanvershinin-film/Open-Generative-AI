import test from 'node:test';
import assert from 'node:assert/strict';
import { isSeedance2Model, rubFromTokensValue, seedance2RateCny } from '../pricingCore.js';
import { FIXED_IMAGE_PRICE_RUB, IMAGE_PRICE_RUB_OVERRIDE, priceRub } from '../pricing.js';

test('seedance2RateCny returns correct values', () => {
    const rate1 = seedance2RateCny('doubao-seedance-2-0-260128', '720p', false);
    assert.strictEqual(rate1, 46);
    
    const rate2 = seedance2RateCny('doubao-seedance-2-0-260128', '720p', true);
    assert.strictEqual(rate2, 28);
    
    const rate3 = seedance2RateCny('doubao-seedance-2-0-fast-260128', '1080p', false);
    assert.strictEqual(rate3, 41);

    const rate4 = seedance2RateCny('doubao-seedance-2-0-mini-260615', '720p', false);
    assert.strictEqual(rate4, 23);

    const rate5 = seedance2RateCny('doubao-seedance-2-0-mini-260615', '720p', true);
    assert.strictEqual(rate5, 14);
});

test('seedance2RateCny returns 0 for non-seedance models', () => {
    const rate = seedance2RateCny('veo3.1', '720p', false);
    assert.strictEqual(rate, 0);
});

test('isSeedance2Model detects supported family', () => {
    assert.strictEqual(isSeedance2Model('doubao-seedance-2-0-260128'), true);
    assert.strictEqual(isSeedance2Model('doubao-seedance-2-0-fast-260128'), true);
    assert.strictEqual(isSeedance2Model('doubao-seedance-2-0-mini-260615'), true);
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

test('priceRub делает все image-модели фиксированно по 10 рублей', async () => {
    assert.strictEqual(await priceRub('image', 'gpt-image-2', {}), FIXED_IMAGE_PRICE_RUB);
    assert.strictEqual(await priceRub('image', 'gemini-3.1-flash-image-preview', {}), FIXED_IMAGE_PRICE_RUB);
});

test('priceRub делает Seedream 5.0 Lite по 3 рубля за фото', async () => {
    assert.strictEqual(IMAGE_PRICE_RUB_OVERRIDE['doubao-seedream-5-0-260128'], 3);
    assert.strictEqual(await priceRub('image', 'doubao-seedream-5-0-260128', {}), 3);
});

test('priceRub делает image edit-модели фиксированно по 10 рублей', async () => {
    assert.strictEqual(await priceRub('image', 'gpt-image-2-edit', {}), FIXED_IMAGE_PRICE_RUB);
    assert.strictEqual(await priceRub('image', 'gemini-3.1-flash-image-edit', {}), FIXED_IMAGE_PRICE_RUB);
});
