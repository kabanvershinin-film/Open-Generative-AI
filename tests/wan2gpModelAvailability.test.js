const test = require('node:test');
const assert = require('node:assert/strict');

const { withWan2gpAvailability } = require('../electron/lib/wan2gpModelAvailability');

const fluxModel = {
    id: 'wan2gp:flux-dev',
    name: 'Flux.1 Dev (Wan2GP)',
    fn: 'flux',
};

test('withWan2gpAvailability marks models unavailable when the server probe fails', () => {
    const model = withWan2gpAvailability(fluxModel, { ok: false, error: 'Request timed out' });

    assert.equal(model.ready, false);
    assert.equal(model.unavailableReason, 'Request timed out');
});

test('withWan2gpAvailability uses resolved api_name when endpoint metadata matches', () => {
    const model = withWan2gpAvailability(
        fluxModel,
        { ok: true },
        {
            apiNames: ['flux_image'],
            resolved: new Map([['wan2gp:flux-dev', 'flux_image']]),
        }
    );

    assert.equal(model.ready, true);
    assert.equal(model.fn, 'flux_image');
});

test('withWan2gpAvailability keeps default api_name available when Gradio omits endpoint metadata', () => {
    const model = withWan2gpAvailability(
        fluxModel,
        { ok: true },
        {
            apiNames: [],
            resolved: new Map([['wan2gp:flux-dev', null]]),
        }
    );

    assert.equal(model.ready, true);
    assert.equal(model.fn, 'flux');
    assert.match(model.availabilityNote, /default api_name/);
});

test('withWan2gpAvailability rejects unmatched models when endpoint metadata is present', () => {
    const model = withWan2gpAvailability(
        fluxModel,
        { ok: true },
        {
            apiNames: ['qwen_image'],
            resolved: new Map([['wan2gp:flux-dev', null]]),
        }
    );

    assert.equal(model.ready, false);
    assert.match(model.unavailableReason, /no api_name matching "flux"/);
});

test('withWan2gpAvailability handles missing third argument (no metadata at all)', () => {
    const model = withWan2gpAvailability(fluxModel, { ok: true });
    
    assert.equal(model.ready, true);
    assert.equal(model.fn, 'flux');
    assert.match(model.availabilityNote, /default api_name/);
});

test('withWan2gpAvailability handles resolved map with key but value is undefined', () => {
    const model = withWan2gpAvailability(
        fluxModel,
        { ok: true },
        {
            apiNames: ['flux_image'],
            resolved: new Map(),
        }
    );
    
    assert.equal(model.ready, false);
    assert.match(model.unavailableReason, /no api_name matching "flux"/);
});

test('withWan2gpAvailability handles model not found in resolved map (undefined)', () => {
    const model = withWan2gpAvailability(
        { id: 'wan2gp:qwen', name: 'Qwen', fn: 'qwen' },
        { ok: true },
        {
            apiNames: ['flux_image'],
            resolved: new Map([['wan2gp:flux-dev', 'flux_image']]),
        }
    );
    
    assert.equal(model.ready, false);
    assert.match(model.unavailableReason, /no api_name matching "qwen"/);
});

test('withWan2gpAvailability resolves correct model when multiple models in resolved map', () => {
    const qwenModel = { id: 'wan2gp:qwen', name: 'Qwen', fn: 'qwen' };
    const model = withWan2gpAvailability(
        qwenModel,
        { ok: true },
        {
            apiNames: ['flux_image', 'qwen_image'],
            resolved: new Map([
                ['wan2gp:flux-dev', 'flux_image'],
                ['wan2gp:qwen', 'qwen_image'],
            ]),
        }
    );
    
    assert.equal(model.ready, true);
    assert.equal(model.fn, 'qwen_image');
});

test('withWan2gpAvailability does not mutate original model object', () => {
    const originalModel = { ...fluxModel };
    const model = withWan2gpAvailability(
        fluxModel,
        { ok: true },
        {
            apiNames: ['flux_image'],
            resolved: new Map([['wan2gp:flux-dev', 'flux_image']]),
        }
    );
    
    assert.deepEqual(fluxModel, originalModel);
    assert.notEqual(model, fluxModel);
});
