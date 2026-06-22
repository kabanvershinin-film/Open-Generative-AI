import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildArkSubmitPayload,
    clampArkDuration,
    createRoundRobinPicker,
    normalizeArkResolution,
    parseEndpoints,
} from '../route.helpers.js';

test('parseEndpoints trims values and falls back to defaults', () => {
    assert.deepStrictEqual(parseEndpoints(' ep-a, ,ep-b ', ['fallback']), ['ep-a', 'ep-b']);
    assert.deepStrictEqual(parseEndpoints('', ['fallback']), ['fallback']);
});

test('createRoundRobinPicker rotates full and fast pools independently', () => {
    const pickEndpoint = createRoundRobinPicker(['full-1', 'full-2'], ['fast-1', 'fast-2'], { full: 1, fast: 0 });

    assert.strictEqual(pickEndpoint(false), 'full-2');
    assert.strictEqual(pickEndpoint(false), 'full-1');
    assert.strictEqual(pickEndpoint(true), 'fast-1');
    assert.strictEqual(pickEndpoint(true), 'fast-2');
});

test('normalizeArkResolution downgrades fast 1080p to 720p', () => {
    assert.strictEqual(normalizeArkResolution('1080p', true), '720p');
    assert.strictEqual(normalizeArkResolution('1080P', false), '1080p');
    assert.strictEqual(normalizeArkResolution(undefined, false), undefined);
});

test('clampArkDuration keeps value within supported range', () => {
    assert.strictEqual(clampArkDuration(2), 4);
    assert.strictEqual(clampArkDuration(20), 15);
    assert.strictEqual(clampArkDuration('7'), 7);
    assert.strictEqual(clampArkDuration(''), undefined);
});

test('buildArkSubmitPayload normalizes resolution and optional fields', () => {
    const payload = buildArkSubmitPayload({
        model: 'ep-fast',
        content: [{ type: 'text', text: 'drive' }],
        generateAudio: false,
        faceAsset: 'asset://hero',
        resolution: '1080p',
        ratio: '16:9',
        duration: 20,
        seed: 42,
        returnLastFrame: true,
        fast: true,
    });

    assert.deepStrictEqual(payload, {
        model: 'ep-fast',
        content: [{ type: 'text', text: 'drive' }],
        generate_audio: false,
        watermark: false,
        face_asset: 'asset://hero',
        resolution: '720p',
        ratio: '16:9',
        duration: 15,
        seed: 42,
        return_last_frame: true,
    });
});
