import test from 'node:test';
import assert from 'node:assert/strict';
import { mock } from 'node:test';

// Mock dependencies before importing the module
// (Using a simple mock since mock.module might not be available)
global.axios = { post: mock.fn() };
global.toast = { error: mock.fn(), success: mock.fn() };

// Now import the module.
import * as utility from '../utility.js';

test('stableStringify sorts keys and handles nested objects', () => {
    const obj1 = { b: 2, a: 1, c: { y: 2, x: 1 } };
    const obj2 = { a: 1, b: 2, c: { x: 1, y: 2 } };
    
    const str1 = utility.stableStringify(obj1);
    const str2 = utility.stableStringify(obj2);
    
    assert.strictEqual(str1, str2);
    assert.strictEqual(str1, '{"a":1,"b":2,"c":{"x":1,"y":2}}');
});

test('stableStringify handles arrays', () => {
    const obj = { list: [3, 1, 2], b: 1 };
    const str = utility.stableStringify(obj);
    // It doesn't sort arrays, only object keys
    assert.strictEqual(str, '{"b":1,"list":[3,1,2]}');
});

test('models arrays are exported and non-empty', () => {
    assert.ok(Array.isArray(utility.imageModels));
    assert.ok(utility.imageModels.length > 0);
    assert.ok(Array.isArray(utility.videoModels));
    assert.ok(utility.videoModels.length > 0);
});

test('imageModels have expected structure', () => {
    const first = utility.imageModels[0];
    assert.ok(first.id);
    assert.ok(first.name);
    assert.ok(first.input_params);
});
