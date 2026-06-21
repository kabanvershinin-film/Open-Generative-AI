const test = require('node:test');
const assert = require('node:assert/strict');

const {
    formatStartupProgressMessage,
    parseGenerationProgressChunk,
    resolveGenerationSteps,
    resolveGuidanceScale,
    stripAnsiSequences,
} = require('../electron/lib/localInferenceRuntime');

test('resolveGenerationSteps prefers explicit request over model defaults', () => {
    const steps = resolveGenerationSteps({ steps: 3 }, { defaultSteps: 20 });
    assert.equal(steps, 3);
});

test('resolveGenerationSteps uses model default when no steps in request', () => {
    const steps = resolveGenerationSteps({}, { defaultSteps: 15 });
    assert.equal(steps, 15);
});

test('resolveGenerationSteps falls back to 20 when both values missing', () => {
    const steps = resolveGenerationSteps({}, {});
    assert.equal(steps, 20);
});

test('resolveGenerationSteps handles steps: 0', () => {
    const steps = resolveGenerationSteps({ steps: 0 }, { defaultSteps: 20 });
    assert.equal(steps, 20);
});

test('resolveGenerationSteps handles negative steps', () => {
    const steps = resolveGenerationSteps({ steps: -5 }, { defaultSteps: 20 });
    assert.equal(steps, 20);
});

test('resolveGenerationSteps rounds to integer', () => {
    const steps = resolveGenerationSteps({ steps: 3.7 }, { defaultSteps: 20 });
    assert.equal(steps, 4);
});

test('resolveGuidanceScale prefers explicit request over model defaults', () => {
    const guidance = resolveGuidanceScale({ guidance_scale: 5.25 }, { defaultGuidance: 7.5 });
    assert.equal(guidance, 5.25);
});

test('resolveGuidanceScale uses model default when no guidance_scale in request', () => {
    const guidance = resolveGuidanceScale({}, { defaultGuidance: 4.0 });
    assert.equal(guidance, 4.0);
});

test('resolveGuidanceScale falls back to 7.5 when both values missing', () => {
    const guidance = resolveGuidanceScale({}, {});
    assert.equal(guidance, 7.5);
});

test('resolveGuidanceScale accepts guidance_scale: 0 as valid', () => {
    const guidance = resolveGuidanceScale({ guidance_scale: 0 }, { defaultGuidance: 7.5 });
    assert.equal(guidance, 0);
});

test('stripAnsiSequences removes terminal control codes', () => {
    const cleaned = stripAnsiSequences('\u001b[32mhello\u001b[0m');
    assert.equal(cleaned, 'hello');
});

test('formatStartupProgressMessage surfaces elapsed startup time', () => {
    assert.equal(formatStartupProgressMessage(0), 'Starting local model...');
    assert.equal(formatStartupProgressMessage(12_400), 'Loading local model (12s)...');
    assert.equal(formatStartupProgressMessage(65_000), 'Loading local model (1m 5s)...');
});

test('formatStartupProgressMessage handles exactly 1 second boundary', () => {
    assert.equal(formatStartupProgressMessage(1000), 'Starting local model...');
});

test('formatStartupProgressMessage handles exactly 10 second boundary', () => {
    assert.equal(formatStartupProgressMessage(10000), 'Loading local model (10s)...');
});

test('formatStartupProgressMessage handles exactly 1 minute boundary', () => {
    assert.equal(formatStartupProgressMessage(60000), 'Loading local model (1m 0s)...');
});

test('formatStartupProgressMessage handles very large values (1 hour)', () => {
    assert.equal(formatStartupProgressMessage(3600000), 'Loading local model (60m 0s)...');
});

test('parseGenerationProgressChunk extracts sd-cli sampling progress from carriage-return output', () => {
    const state = { tail: '', lastStep: 0, lastTotalSteps: 0 };
    const chunk = '\r  |==>                                               | 1/20 - 7.16s/it\u001b[K\r  |=====>                                            | 2/20 - 6.98s/it\u001b[K';
    const events = parseGenerationProgressChunk(chunk, state);

    assert.deepEqual(events, [
        { step: 1, totalSteps: 20, progress: 0.05 },
        { step: 2, totalSteps: 20, progress: 0.1 },
    ]);
});

test('parseGenerationProgressChunk handles empty chunk', () => {
    const state = { tail: '', lastStep: 0, lastTotalSteps: 0 };
    const events = parseGenerationProgressChunk('', state);
    assert.deepEqual(events, []);
});

test('parseGenerationProgressChunk handles chunk without progress strings', () => {
    const state = { tail: '', lastStep: 0, lastTotalSteps: 0 };
    const events = parseGenerationProgressChunk('Some random log text without progress', state);
    assert.deepEqual(events, []);
});

test('parseGenerationProgressChunk handles partial line at chunk boundary (tail buffering)', () => {
    const state = { tail: '', lastStep: 0, lastTotalSteps: 0 };
    const firstChunk = '\r  |==> | 1/20 - 7.16s/it\u001b[K\r  |==';
    const secondChunk = '==> | 2/20 - 6.98s/it\u001b[K';
    
    const firstEvents = parseGenerationProgressChunk(firstChunk, state);
    const secondEvents = parseGenerationProgressChunk(secondChunk, state);
    
    assert.deepEqual(firstEvents, [{ step: 1, totalSteps: 20, progress: 0.05 }]);
    assert.deepEqual(secondEvents, [{ step: 2, totalSteps: 20, progress: 0.1 }]);
});

test('parseGenerationProgressChunk handles totalSteps: 0 safely', () => {
    const state = { tail: '', lastStep: 0, lastTotalSteps: 0 };
    const events = parseGenerationProgressChunk('\r  |==> | 1/0 - 7.16s/it\u001b[K', state);
    assert.deepEqual(events, []);
});

test('parseGenerationProgressChunk handles step > totalSteps', () => {
    const state = { tail: '', lastStep: 0, lastTotalSteps: 0 };
    const events = parseGenerationProgressChunk('\r  |==> | 21/20 - 7.16s/it\u001b[K', state);
    assert.deepEqual(events, [{ step: 21, totalSteps: 20, progress: 1 }]);
});

test('parseGenerationProgressChunk ensures progress is always between 0 and 1', () => {
    const state = { tail: '', lastStep: 0, lastTotalSteps: 0 };
    const events = parseGenerationProgressChunk('\r  |==> | 50/10 - 7.16s/it\u001b[K', state);
    
    assert.equal(events.length, 1);
    assert(events[0].progress >= 0);
    assert(events[0].progress <= 1);
    assert.equal(events[0].progress, 1);
});

test('parseGenerationProgressChunk de-duplicates repeated progress events across chunks', () => {
    const state = { tail: '', lastStep: 0, lastTotalSteps: 0 };
    const first = parseGenerationProgressChunk('\r  |==> | 1/20 - 7.16s/it\u001b[K', state);
    const second = parseGenerationProgressChunk('\r  |==> | 1/20 - 7.16s/it\u001b[K\r  |=====> | 2/20 - 6.98s/it\u001b[K', state);

    assert.deepEqual(first, [{ step: 1, totalSteps: 20, progress: 0.05 }]);
    assert.deepEqual(second, [{ step: 2, totalSteps: 20, progress: 0.1 }]);
});

test('parseGenerationProgressChunk does not replay old buffered steps when later chunks include earlier output', () => {
    const state = { tail: '', lastStep: 0, lastTotalSteps: 0 };
    const first = parseGenerationProgressChunk('\r  |==> | 1/3 - 1.00s/it\u001b[K\r  |=====> | 2/3 - 1.00s/it\u001b[K', state);
    const second = parseGenerationProgressChunk('\r  |==> | 1/3 - 1.00s/it\u001b[K\r  |=====> | 2/3 - 1.00s/it\u001b[K\r  |========> | 3/3 - 1.00s/it\u001b[K', state);

    assert.deepEqual(first, [
        { step: 1, totalSteps: 3, progress: 1 / 3 },
        { step: 2, totalSteps: 3, progress: 2 / 3 },
    ]);
    assert.deepEqual(second, [
        { step: 3, totalSteps: 3, progress: 1 },
    ]);
});
