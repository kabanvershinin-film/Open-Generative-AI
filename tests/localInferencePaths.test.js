const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
    LOCAL_AI_DIR_ENV,
    resolveLocalAiPaths,
} = require('../electron/lib/localInferencePaths');

test('resolveLocalAiPaths defaults under the Electron user data directory', () => {
    const userDataPath = path.join(process.cwd(), 'fixtures', 'user-data');
    const paths = resolveLocalAiPaths({ userDataPath, env: {} });
    const dataDir = path.resolve(userDataPath, 'local-ai');

    assert.deepEqual(paths, {
        dataDir,
        binDir: path.join(dataDir, 'bin'),
        modelsDir: path.join(dataDir, 'models'),
        tmpDir: path.join(dataDir, 'tmp'),
    });
});

test('resolveLocalAiPaths honors a custom local AI directory', () => {
    const customDir = path.join(process.cwd(), 'fixtures', 'custom-ai-store');
    const paths = resolveLocalAiPaths({
        userDataPath: path.join(process.cwd(), 'fixtures', 'ignored-user-data'),
        env: { [LOCAL_AI_DIR_ENV]: customDir },
    });
    const dataDir = path.resolve(customDir);

    assert.equal(paths.dataDir, dataDir);
    assert.equal(paths.modelsDir, path.join(dataDir, 'models'));
});

test('resolveLocalAiPaths explicitly shows override wins over userDataPath', () => {
    const customDir = path.join(process.cwd(), 'fixtures', 'custom-ai-store');
    const userDataPath = path.join(process.cwd(), 'fixtures', 'user-data');
    const paths = resolveLocalAiPaths({ userDataPath, env: { [LOCAL_AI_DIR_ENV]: customDir } });
    
    assert.equal(paths.dataDir, path.resolve(customDir));
    assert.notEqual(paths.dataDir, path.resolve(userDataPath, 'local-ai'));
});

test('resolveLocalAiPaths handles empty string in LOCAL_AI_DIR_ENV', () => {
    const userDataPath = path.join(process.cwd(), 'fixtures', 'user-data');
    const paths = resolveLocalAiPaths({ userDataPath, env: { [LOCAL_AI_DIR_ENV]: '' } });
    const dataDir = path.resolve(userDataPath, 'local-ai');

    assert.equal(paths.dataDir, dataDir);
});

test('resolveLocalAiPaths resolves relative paths correctly', () => {
    const relativeCustomDir = './fixtures/custom-ai-store';
    const userDataPath = path.join(process.cwd(), 'fixtures', 'user-data');
    const paths = resolveLocalAiPaths({ userDataPath, env: { [LOCAL_AI_DIR_ENV]: relativeCustomDir } });
    
    assert.equal(paths.dataDir, path.resolve(process.cwd(), relativeCustomDir));
});

test('resolveLocalAiPaths handles paths with spaces and unicode', () => {
    const customDir = path.join(process.cwd(), 'fixtures', 'my custom ai dir 🌟');
    const paths = resolveLocalAiPaths({ env: { [LOCAL_AI_DIR_ENV]: customDir } });
    
    assert.equal(paths.dataDir, path.resolve(customDir));
});

test('resolveLocalAiPaths returns exactly the expected 4 keys with no extras', () => {
    const userDataPath = path.join(process.cwd(), 'fixtures', 'user-data');
    const paths = resolveLocalAiPaths({ userDataPath, env: {} });
    const keys = Object.keys(paths);
    
    assert.equal(keys.length, 4);
    assert(keys.includes('dataDir'));
    assert(keys.includes('binDir'));
    assert(keys.includes('modelsDir'));
    assert(keys.includes('tmpDir'));
});

test('resolveLocalAiPaths trims accidental whitespace around the override', () => {
    const customDir = path.join(process.cwd(), 'fixtures', 'spaced-ai-store');
    const paths = resolveLocalAiPaths({
        env: { [LOCAL_AI_DIR_ENV]: `  ${customDir}  ` },
    });

    assert.equal(paths.dataDir, path.resolve(customDir));
});

test('resolveLocalAiPaths requires userDataPath when no override is set', () => {
    assert.throws(
        () => resolveLocalAiPaths({ env: {} }),
        /userDataPath is required/
    );
});
