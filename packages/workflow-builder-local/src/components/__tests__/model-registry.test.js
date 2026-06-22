import test from 'node:test';
import assert from 'node:assert/strict';

import { imageModels } from '../model-registry/imageModels.js';
import { videoModels } from '../model-registry/videoModels.js';
import { textModels } from '../model-registry/textModels.js';
import { audioModels } from '../model-registry/audioModels.js';
import { concatModels } from '../model-registry/concatModels.js';
import { videoCombinerModels } from '../model-registry/videoCombinerModels.js';
import { apiNodeModels } from '../model-registry/apiNodeModels.js';

function assertUniqueIds(models, name) {
    const ids = models.map((model) => model.id);
    assert.strictEqual(new Set(ids).size, ids.length, `${name}: duplicate ids found`);
}

test('model registries keep unique ids and stay populated', () => {
    const registries = {
        imageModels,
        videoModels,
        textModels,
        audioModels,
        concatModels,
        videoCombinerModels,
        apiNodeModels,
    };

    for (const [name, models] of Object.entries(registries)) {
        assert.ok(Array.isArray(models), `${name} must be an array`);
        assert.ok(models.length > 0, `${name} must not be empty`);
        assertUniqueIds(models, name);
    }
});

test('passthrough registries require the correct input fields', () => {
    const imagePassthrough = imageModels.find((model) => model.id === 'image-passthrough');
    const videoPassthrough = videoModels.find((model) => model.id === 'video-passthrough');
    const textPassthrough = textModels.find((model) => model.id === 'text-passthrough');
    const audioPassthrough = audioModels.find((model) => model.id === 'audio-passthrough');

    assert.deepStrictEqual(imagePassthrough.input_params.required, ['image_url']);
    assert.deepStrictEqual(videoPassthrough.input_params.required, ['video_url']);
    assert.deepStrictEqual(textPassthrough.input_params.required, ['prompt']);
    assert.deepStrictEqual(audioPassthrough.input_params.required, ['audio_url']);
});

test('workflow builder utility registries keep expected key models', () => {
    assert.ok(imageModels.find((model) => model.id === 'wan2.5-text-to-image'));
    assert.ok(videoModels.find((model) => model.id === 'seedance-lite-i2v'));
    assert.ok(concatModels.find((model) => model.id === 'prompt-concatenator'));
    assert.ok(videoCombinerModels.find((model) => model.id === 'video-combiner'));
    assert.ok(apiNodeModels.find((model) => model.id === 'wavespeed'));
});
