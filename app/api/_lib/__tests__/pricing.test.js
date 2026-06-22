import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';

// Set mock environment variables before importing
process.env.CNY_TO_RUB = '10.55';
process.env.PLATFORM_MARKUP = '1.15';
process.env.SUPABASE_URL = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';

// Import module after setting env vars
import * as pricing from '../pricing.js';

test('priceRub returns 0 for free models', async () => {
    const result = await pricing.priceRub('video', 'text-passthrough');
    assert.strictEqual(result, 0);
});

test('seedance2RateCny returns correct values', () => {
    const rate1 = pricing.seedance2RateCny('doubao-seedance-2-0-260128', '720p', false);
    assert.strictEqual(rate1, 46);
    
    const rate2 = pricing.seedance2RateCny('doubao-seedance-2-0-260128', '720p', true);
    assert.strictEqual(rate2, 28);
    
    const rate3 = pricing.seedance2RateCny('doubao-seedance-2-0-fast-260128', '1080p', false);
    assert.strictEqual(rate3, 41);
});

test('seedance2RateCny returns 0 for non-seedance models', () => {
    const rate = pricing.seedance2RateCny('veo3.1', '720p', false);
    assert.strictEqual(rate, 0);
});

test('rubFromTokens calculates correct price', async () => {
    const result = await pricing.rubFromTokens(1000000, 46); // 1M tokens, 46 CNY rate
    assert.ok(result > 0);
    assert.ok(typeof result === 'number');
});

test('priceRub calculates image price', async () => {
    const result = await pricing.priceRub('image', 'flux-1.1-pro');
    assert.ok(result > 0);
    assert.ok(typeof result === 'number');
});

test('priceRub calculates video price for seedance', async () => {
    const result = await pricing.priceRub('video', 'doubao-seedance-2-0-260128', {
        duration: 5,
        resolution: '720p',
        video_url: undefined,
        generate_audio: false
    });
    assert.ok(result > 0);
});
