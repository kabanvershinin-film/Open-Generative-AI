import test from 'node:test';
import assert from 'node:assert/strict';
import { stableStringify } from '../stableStringify.js';

test('stableStringify sorts keys and handles nested objects', () => {
    const obj1 = { b: 2, a: 1, c: { y: 2, x: 1 } };
    const obj2 = { a: 1, b: 2, c: { x: 1, y: 2 } };
    
    const str1 = stableStringify(obj1);
    const str2 = stableStringify(obj2);
    
    assert.strictEqual(str1, str2);
    assert.strictEqual(str1, '{"a":1,"b":2,"c":{"x":1,"y":2}}');
});

test('stableStringify handles arrays', () => {
    const obj = { list: [3, 1, 2], b: 1 };
    const str = stableStringify(obj);
    // It doesn't sort arrays, only object keys
    assert.strictEqual(str, '{"b":1,"list":[3,1,2]}');
});
