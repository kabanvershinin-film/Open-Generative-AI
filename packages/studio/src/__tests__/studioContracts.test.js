import test from 'node:test';
import assert from 'node:assert/strict';
import * as muapi from '../muapi.js';
import * as models from '../models.js';

test('ImageStudio contracts stay available through muapi and models', () => {
    assert.strictEqual(typeof muapi.generateImage, 'function');
    assert.strictEqual(typeof muapi.generateI2I, 'function');
    assert.strictEqual(typeof muapi.optimizeImageUploadFile, 'function');
    assert.strictEqual(typeof muapi.uploadFile, 'function');
    assert.strictEqual(typeof muapi.persistImageToTOS, 'function');
    assert.strictEqual(typeof muapi.getUserWorkflows, 'function');
    assert.strictEqual(typeof muapi.validateImageReferenceUploadFile, 'function');

    const t2i = models.getT2iModels();
    const i2i = models.getI2iModels();
    assert.ok(t2i.length > 0);
    assert.ok(i2i.length > 0);
    assert.ok(Array.isArray(models.routingOptions));
    assert.ok(models.routingLabels.default);
});

test('AudioStudio contracts expose audio catalog and generator entry point', () => {
    assert.strictEqual(typeof muapi.generateAudio, 'function');
    assert.strictEqual(typeof muapi.uploadFile, 'function');
    assert.ok(Array.isArray(models.audioModels));
    assert.ok(models.audioModels.length > 0);
    assert.ok(models.getAudioModelById(models.audioModels[0].id));
});

test('LipSyncStudio contracts expose current feature gap explicitly', async () => {
    assert.strictEqual(typeof muapi.processLipSync, 'function');
    assert.ok(Array.isArray(models.lipsyncModels));
    assert.ok(Array.isArray(models.imageLipSyncModels));
    assert.ok(Array.isArray(models.videoLipSyncModels));
    assert.deepStrictEqual(models.getResolutionsForLipSyncModel('missing'), []);
    await assert.rejects(
        () => muapi.processLipSync('key', { model: 'missing-model' }),
        /LipSync модели пока не настроены/
    );
});

test('WorkflowStudio contracts remain available with stable fallbacks', async () => {
    assert.strictEqual(typeof muapi.getTemplateWorkflows, 'function');
    assert.strictEqual(typeof muapi.getUserWorkflows, 'function');
    assert.strictEqual(typeof muapi.getPublishedWorkflows, 'function');
    assert.strictEqual(typeof muapi.createWorkflow, 'function');
    assert.strictEqual(typeof muapi.updateWorkflowName, 'function');
    assert.strictEqual(typeof muapi.deleteWorkflow, 'function');
    assert.strictEqual(typeof muapi.getAllNodeSchemas, 'function');
    assert.strictEqual(typeof muapi.getWorkflowData, 'function');
    assert.strictEqual(typeof muapi.executeWorkflow, 'function');
    assert.deepStrictEqual(await muapi.getTemplateWorkflows('key'), []);
});

test('TOS-реестр pending-задач экспортируется для студий', () => {
    assert.strictEqual(typeof muapi.listPendingGenerations, 'function');
    assert.strictEqual(typeof muapi.savePendingGeneration, 'function');
    assert.strictEqual(typeof muapi.updatePendingGeneration, 'function');
    assert.strictEqual(typeof muapi.deletePendingGeneration, 'function');
    assert.strictEqual(typeof muapi.resumeVideoGeneration, 'function');
});

test('AgentStudio and AppsStudio wrapper contracts are exported', () => {
    assert.strictEqual(typeof muapi.getTemplateAgents, 'function');
    assert.strictEqual(typeof muapi.getUserAgents, 'function');
    assert.strictEqual(typeof muapi.getUserConversations, 'function');
    assert.strictEqual(typeof muapi.registerAppInterest, 'function');
    assert.strictEqual(typeof muapi.getAppInterests, 'function');
});

test('Unported studio actions fail loudly instead of disappearing from exports', async () => {
    await assert.rejects(() => muapi.runClipping('key', {}), /runClipping пока не перенесён/);
    await assert.rejects(() => muapi.generateMarketingStudioAd('key', {}), /generateMarketingStudioAd пока не перенесён/);
    await assert.rejects(() => muapi.runMotionGraphics('key', {}), /runMotionGraphics пока не перенесён/);
    await assert.rejects(() => muapi.runMotionGraphicsEdit('key', {}), /runMotionGraphicsEdit пока не перенесён/);
});
