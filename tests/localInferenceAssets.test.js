const test = require('node:test');
const assert = require('node:assert/strict');

const {
    pickBinaryAssetForPlatform,
    getBundledBinaryResourceDir,
} = require('../electron/lib/localInferenceAssets');

test('pickBinaryAssetForPlatform prefers native linux arm64 assets', () => {
    const zipNames = [
        'sd-master-abc-bin-Linux-Ubuntu-24.04-x86_64.zip',
        'sd-master-abc-bin-Linux-Ubuntu-24.04-aarch64.zip',
        'sd-master-abc-bin-Linux-Ubuntu-24.04-aarch64-vulkan.zip',
    ];

    const picked = pickBinaryAssetForPlatform({
        platform: 'linux',
        arch: 'arm64',
        zipNames,
    });

    assert.equal(picked, 'sd-master-abc-bin-Linux-Ubuntu-24.04-aarch64.zip');
});

test('pickBinaryAssetForPlatform picks linux x86_64 assets', () => {
    const zipNames = [
        'sd-master-abc-bin-Linux-Ubuntu-24.04-x86_64.zip',
        'sd-master-abc-bin-Linux-Ubuntu-24.04-aarch64.zip',
    ];

    const picked = pickBinaryAssetForPlatform({
        platform: 'linux',
        arch: 'x64',
        zipNames,
    });

    assert.equal(picked, 'sd-master-abc-bin-Linux-Ubuntu-24.04-x86_64.zip');
});

test('pickBinaryAssetForPlatform picks darwin arm64 assets', () => {
    const zipNames = [
        'sd-master-abc-bin-Darwin-arm64.zip',
        'sd-master-abc-bin-Linux-Ubuntu-24.04-x86_64.zip',
    ];

    const picked = pickBinaryAssetForPlatform({
        platform: 'darwin',
        arch: 'arm64',
        zipNames,
    });

    assert.equal(picked, 'sd-master-abc-bin-Darwin-arm64.zip');
});

test('pickBinaryAssetForPlatform returns null for darwin x64', () => {
    const zipNames = [
        'sd-master-abc-bin-Darwin-x64.zip',
        'sd-master-abc-bin-Linux-Ubuntu-24.04-x86_64.zip',
    ];

    const picked = pickBinaryAssetForPlatform({
        platform: 'darwin',
        arch: 'x64',
        zipNames,
    });

    assert.equal(picked, null);
});

test('pickBinaryAssetForPlatform picks win32 x64 assets in order of preference', () => {
    const zipNames = [
        'sd-master-abc-bin-win-noavx-x64.zip',
        'sd-master-abc-bin-win-avx-x64.zip',
        'sd-master-abc-bin-win-avx2-x64.zip',
        'sd-master-abc-bin-win-avx512-x64.zip',
        'sd-master-abc-bin-win-cuda12-x64.zip',
        'sd-master-abc-bin-win-cu12-x64.zip',
    ];

    assert.equal(pickBinaryAssetForPlatform({ platform: 'win32', arch: 'x64', zipNames }), 'sd-master-abc-bin-win-avx2-x64.zip');
    
    const withoutAvx2 = zipNames.filter(n => !n.includes('avx2'));
    assert.equal(pickBinaryAssetForPlatform({ platform: 'win32', arch: 'x64', zipNames: withoutAvx2 }), 'sd-master-abc-bin-win-avx-x64.zip');
});

test('pickBinaryAssetForPlatform handles empty zipNames list', () => {
    const picked = pickBinaryAssetForPlatform({
        platform: 'linux',
        arch: 'x64',
        zipNames: [],
    });

    assert.equal(picked, null);
});

test('pickBinaryAssetForPlatform handles no matching assets for platform', () => {
    const zipNames = ['sd-master-abc-bin-Linux-Ubuntu-24.04-aarch64.zip'];

    const picked = pickBinaryAssetForPlatform({
        platform: 'win32',
        arch: 'x64',
        zipNames,
    });

    assert.equal(picked, null);
});

test('pickBinaryAssetForPlatform picks vulkan variant when only vulkan is available', () => {
    const zipNames = ['sd-master-abc-bin-Linux-Ubuntu-24.04-aarch64-vulkan.zip'];

    const picked = pickBinaryAssetForPlatform({
        platform: 'linux',
        arch: 'arm64',
        zipNames,
    });

    assert.equal(picked, 'sd-master-abc-bin-Linux-Ubuntu-24.04-aarch64-vulkan.zip');
});

test('getBundledBinaryResourceDir resolves linux arm64 bundled path', () => {
    const bundledDir = getBundledBinaryResourceDir({
        resourcesPath: '/opt/Open Generative AI/resources',
        platform: 'linux',
        arch: 'arm64',
    });

    assert.equal(
        bundledDir,
        '/opt/Open Generative AI/resources/local-ai/linux-arm64/bin'
    );
});

test('getBundledBinaryResourceDir resolves linux x86_64 bundled path', () => {
    const bundledDir = getBundledBinaryResourceDir({
        resourcesPath: '/opt/Open Generative AI/resources',
        platform: 'linux',
        arch: 'x64',
    });

    assert.equal(
        bundledDir,
        '/opt/Open Generative AI/resources/local-ai/linux-x64/bin'
    );
});

test('getBundledBinaryResourceDir resolves darwin arm64 bundled path', () => {
    const bundledDir = getBundledBinaryResourceDir({
        resourcesPath: '/Applications/Open Generative AI.app/Contents/Resources',
        platform: 'darwin',
        arch: 'arm64',
    });

    assert.equal(
        bundledDir,
        '/Applications/Open Generative AI.app/Contents/Resources/local-ai/darwin-arm64/bin'
    );
});

test('getBundledBinaryResourceDir resolves win32 x64 bundled path', () => {
    const bundledDir = getBundledBinaryResourceDir({
        resourcesPath: 'C:\\Program Files\\Open Generative AI\\resources',
        platform: 'win32',
        arch: 'x64',
    });

    assert.equal(
        bundledDir,
        'C:\\Program Files\\Open Generative AI\\resources\\local-ai\\win32-x64\\bin'
    );
});

test('getBundledBinaryResourceDir handles paths with spaces correctly', () => {
    const bundledDir = getBundledBinaryResourceDir({
        resourcesPath: 'C:\\My App With Spaces\\resources',
        platform: 'win32',
        arch: 'x64',
    });

    assert.equal(
        bundledDir,
        'C:\\My App With Spaces\\resources\\local-ai\\win32-x64\\bin'
    );
});
