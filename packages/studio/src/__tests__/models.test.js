import test from 'node:test';
import assert from 'node:assert/strict';
import * as models from '../models.js';

test('image model getters return exact known model metadata', () => {
    const model = models.getModelById('gpt-image-2');
    assert.ok(model);
    assert.strictEqual(model.name, 'GPT Image 2');
    assert.strictEqual(model.apiId, 'gpt-image-2');
    assert.deepStrictEqual(models.getAspectRatiosForModel('gpt-image-2'), [
        '1:1',
        '16:9',
        '9:16',
        '3:2',
        '2:3',
    ]);
    assert.deepStrictEqual(models.getImageInputOptions('gpt-image-2', 'imageSize'), ['1K', '2K']);
    assert.strictEqual(models.getImageInputDefault('gpt-image-2', 'imageSize'), '1K');
    assert.deepStrictEqual(models.getResolutionsForModel('gpt-image-2'), []);
    assert.strictEqual(models.getQualityFieldForModel('gpt-image-2'), null);
});

test('image input option helpers expose shared options and defaults', () => {
    assert.deepStrictEqual(models.getAspectRatiosForModel('gemini-3.1-flash-image-preview'), [
        '1:1',
        '16:9',
        '9:16',
        '4:3',
        '3:4',
        '2:3',
        '3:2',
        '4:5',
        '5:4',
        '1:4',
        '4:1',
        '1:8',
        '8:1',
        '21:9',
    ]);
    assert.deepStrictEqual(models.getImageInputOptions('gpt-image-2', 'format'), ['jpeg', 'png', 'webp']);
    assert.strictEqual(models.getImageInputDefault('gpt-image-2', 'format'), 'jpeg');
    assert.strictEqual(models.getImageInputDefault('gpt-image-2-edit', 'background'), 'auto');
    assert.deepStrictEqual(models.getImageInputOptions('unknown-model', 'format'), []);
    assert.strictEqual(models.getImageInputDefault('unknown-model', 'format'), null);
    assert.strictEqual(models.getMaxImagesForI2IModel('gpt-image-2-edit'), 16);
    assert.strictEqual(models.getMaxImagesForI2IModel('gemini-3.1-flash-image-preview-edit'), 14);
    assert.strictEqual(models.getMaxImagesForI2IModel('gemini-3-pro-image-preview-edit'), 8);
    assert.strictEqual(models.getMaxImagesForI2IModel('unknown-model'), 1);
});

test('video model getters expose exact capabilities for t2v and i2v models', () => {
    const t2v = models.getVideoModelById('seedance-2.0-t2v');
    const miniT2v = models.getVideoModelById('seedance-2.0-mini-t2v');
    const i2v = models.getVideoModelById('seedance-2.0-i2v');
    const miniI2v = models.getVideoModelById('seedance-2.0-mini-i2v');

    assert.ok(t2v);
    assert.ok(miniT2v);
    assert.ok(i2v);
    assert.ok(miniI2v);
    assert.strictEqual(t2v.provider, 'ark');
    assert.strictEqual(t2v.platform, 'unified');
    assert.strictEqual(miniT2v.apiId, 'doubao-seedance-2-0-mini-260615');
    assert.strictEqual(i2v.provider, 'ark');
    assert.strictEqual(i2v.platform, 'unified');
    assert.strictEqual(miniI2v.apiId, 'doubao-seedance-2-0-mini-260615');

    assert.deepStrictEqual(models.getAspectRatiosForVideoModel('seedance-2.0-fast-t2v'), [
        'adaptive',
        '16:9',
        '9:16',
        '1:1',
        '4:3',
        '3:4',
        '21:9',
    ]);
    assert.deepStrictEqual(models.getResolutionsForVideoModel('seedance-2.0-fast-t2v'), ['720p', '480p']);
    assert.deepStrictEqual(models.getResolutionsForVideoModel('seedance-2.0-mini-t2v'), ['720p', '480p']);
    assert.deepStrictEqual(models.getDurationsForModel('seedance-2.0-fast-t2v'), [4, 5, 6, 8, 10, 12, 15]);

    assert.deepStrictEqual(models.getAspectRatiosForI2VModel('seedance-2.0-i2v'), [
        'adaptive',
        '16:9',
        '9:16',
        '1:1',
        '4:3',
        '3:4',
        '21:9',
    ]);
    assert.deepStrictEqual(models.getResolutionsForI2VModel('seedance-2.0-i2v'), ['720p', '1080p', '480p']);
    assert.deepStrictEqual(models.getResolutionsForI2VModel('seedance-2.0-mini-i2v'), ['720p', '480p']);
    assert.deepStrictEqual(models.getDurationsForI2VModel('seedance-2.0-i2v'), [4, 5, 6, 8, 10, 12, 15]);
});

test('unknown model ids safely return empty option lists', () => {
    assert.deepStrictEqual(models.getAspectRatiosForModel('missing'), []);
    assert.deepStrictEqual(models.getAspectRatiosForI2IModel('missing'), []);
    assert.deepStrictEqual(models.getAspectRatiosForVideoModel('missing'), ['16:9', '9:16', '1:1']);
    assert.deepStrictEqual(models.getDurationsForModel('missing'), []);
    assert.deepStrictEqual(models.getResolutionsForVideoModel('missing'), []);
    assert.deepStrictEqual(models.getResolutionsForI2VModel('missing'), []);
    assert.deepStrictEqual(models.getModesForModel('missing'), []);
});

test('video model catalog has no duplicate ids and keeps ark contract', () => {
    const videoModels = [...models.getT2vModels(), ...models.getI2vModels()];
    const ids = videoModels.map((model) => model.id);
    const uniqueIds = new Set(ids);

    assert.strictEqual(uniqueIds.size, ids.length);
    assert.ok(videoModels.length >= 6);
    assert.ok(videoModels.every((model) => model.provider === 'ark'));
    assert.ok(videoModels.every((model) => model.platform === 'unified'));
    assert.ok(videoModels.every((model) => Array.isArray(model.inputs?.aspect_ratio?.enum)));
});

test('mode and effect helpers stay empty for current seedance catalog', () => {
    assert.deepStrictEqual(models.getModesForModel('seedance-2.0-t2v'), []);
    assert.deepStrictEqual(models.getEffectsForI2IModel('gpt-image-2-edit'), []);
    assert.strictEqual(models.getDefaultEffectForI2IModel('gpt-image-2-edit'), null);
    assert.deepStrictEqual(models.getEffectsForI2VModel('seedance-2.0-i2v'), []);
    assert.strictEqual(models.getDefaultEffectForI2VModel('seedance-2.0-i2v'), null);
});
