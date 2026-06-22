import test from 'node:test';
import assert from 'node:assert/strict';
import { isAdminUser, signBillToken, verifyBillAmount, verifyBillDataToken } from '../balanceCore.js';

test('signBillToken returns empty string when billing is disabled', () => {
    assert.strictEqual(signBillToken(10, 'secret', false), '');
});

test('isAdminUser returns true for admin emails', () => {
    assert.strictEqual(isAdminUser({ email: 'kaban.vershinin@gmail.com' }), true);
    assert.strictEqual(isAdminUser({ email: 'didig.vershinin@yandex.ru' }), true);
});

test('isAdminUser returns false for non-admin emails', () => {
    assert.strictEqual(isAdminUser({ email: 'test@example.com' }), false);
});

test('isAdminUser returns false for null user', () => {
    assert.strictEqual(isAdminUser(null), false);
});

test('verifyBill helpers sign and validate token payload', () => {
    const token = signBillToken(123.456, 'secret', true, { model: 'seedance' }, 1000);
    const data = verifyBillDataToken(token, 'secret', true, 2000);

    assert.ok(token);
    assert.deepStrictEqual(data, { c: 123.46, e: 3601000, model: 'seedance' });
    assert.strictEqual(verifyBillAmount(token, 'secret', true, 2000), 123.46);
});

test('verifyBill returns 0 for invalid token', () => {
    assert.strictEqual(verifyBillAmount('invalid.token', 'secret', true), 0);
    assert.strictEqual(verifyBillAmount(null, 'secret', true), 0);
    assert.strictEqual(verifyBillAmount('', 'secret', true), 0);
});

test('verifyBillDataToken rejects expired or tampered token', () => {
    const token = signBillToken(10, 'secret', true, { userId: 'u1' }, 1000);
    const [payload, sig] = token.split('.');
    const tampered = `${payload}.broken${sig}`;

    assert.strictEqual(verifyBillDataToken(token, 'secret', true, 3601001), null);
    assert.strictEqual(verifyBillDataToken(tampered, 'secret', true, 2000), null);
});
