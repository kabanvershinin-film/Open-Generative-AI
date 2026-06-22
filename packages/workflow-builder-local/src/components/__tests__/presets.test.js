import test from 'node:test';
import assert from 'node:assert/strict';

import { presets } from '../presets/index.js';

test('presets export expected workflow templates', () => {
    const ids = presets.map((preset) => preset.id);

    assert.ok(ids.includes('empty-workflow'));
    assert.ok(ids.includes('image-generator'));
    assert.ok(ids.includes('video-generator'));
    assert.ok(ids.includes('audio-generator'));
    assert.ok(ids.includes('captioning'));
    assert.strictEqual(new Set(ids).size, ids.length);
});

test('each preset keeps minimal workflow shape', () => {
    for (const preset of presets) {
        assert.strictEqual(typeof preset.id, 'string');
        assert.strictEqual(typeof preset.title, 'string');
        assert.ok(Array.isArray(preset.nodes));
        assert.ok(Array.isArray(preset.edges));
    }
});
