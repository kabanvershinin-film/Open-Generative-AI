import test from 'node:test';
import assert from 'node:assert/strict';
import * as models from '../models.js';

test('getModelById returns correct model', () => {
    const model = models.getModelById('gpt-image-2');
    assert.strictEqual(model.name, 'GPT Image 2');
    assert.strictEqual(model.apiId, 'gpt-image-2');
});

test('getVideoModelById returns correct model from t2v or i2v', () => {
    // Test a T2V model
    const t2v = models.getVideoModelById('seedance-2.0-t2v');
    assert.ok(t2v);
    
    // Test an I2V model
    const i2v = models.getVideoModelById('seedance-2.0-i2v');
    assert.ok(i2v);
});

test('getAspectRatiosForModel returns enums or empty array', () => {
    const ar = models.getAspectRatiosForModel('gpt-image-2');
    assert.ok(Array.isArray(ar));
});

test('getDurationsForModel handles unified and sora platforms', () => {
    const seedanceDuration = models.getDurationsForModel('seedance-2.0-t2v');
    assert.ok(seedanceDuration.includes(5));
    assert.ok(seedanceDuration.includes(10));
});

test('getResolutionsForVideoModel returns defaults for unified platform', () => {
    const res = models.getResolutionsForVideoModel('seedance-2.0-t2v');
    assert.ok(res.includes('720p'));
    assert.ok(res.includes('1080p'));
});

test('getModesForModel returns modes if present', () => {
    const modes = models.getModesForModel('seedance-2.0-t2v');
    assert.ok(Array.isArray(modes));
});
