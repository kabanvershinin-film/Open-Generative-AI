import test from 'node:test';
import assert from 'node:assert/strict';

// Set mock env vars
process.env.SUPABASE_URL = '';
process.env.SUPABASE_ANON_KEY = '';
process.env.SUPABASE_SERVICE_ROLE_KEY = '';

// Import after setting env vars
import * as balance from '../balance.js';

test('BILLING_ENABLED is false without all env vars', () => {
    assert.strictEqual(balance.BILLING_ENABLED, false);
});

test('isAdminUser returns true for admin emails', () => {
    assert.strictEqual(balance.isAdminUser({ email: 'kaban.vershinin@gmail.com' }), true);
    assert.strictEqual(balance.isAdminUser({ email: 'didig.vershinin@yandex.ru' }), true);
});

test('isAdminUser returns false for non-admin emails', () => {
    assert.strictEqual(balance.isAdminUser({ email: 'test@example.com' }), false);
});

test('isAdminUser returns false for null user', () => {
    assert.strictEqual(balance.isAdminUser(null), false);
});

test('verifyBill returns 0 for invalid token', () => {
    assert.strictEqual(balance.verifyBill('invalid.token'), 0);
    assert.strictEqual(balance.verifyBill(null), 0);
    assert.strictEqual(balance.verifyBill(''), 0);
});
