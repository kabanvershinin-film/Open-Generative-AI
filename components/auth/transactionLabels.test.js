import test from 'node:test';
import assert from 'node:assert/strict';

import { txnLabel } from './transactionLabels.js';

test('txnLabel показывает понятное списание за создание промта Seedance', () => {
    assert.equal(
        txnLabel({
            reason: 'seedance_prompt_claude-sonnet-4-6',
            meta: { model: 'claude-sonnet-4-6' },
        }),
        'Списание · Создание промта',
    );
});

test('txnLabel показывает возврат за создание промта Seedance', () => {
    assert.equal(
        txnLabel({
            reason: 'refund_seedance_prompt_claude-sonnet-4-6',
            meta: { model: 'claude-sonnet-4-6' },
        }),
        'Возврат · Создание промта',
    );
});

test('txnLabel сохраняет стандартную подпись генерации для остальных операций', () => {
    assert.equal(
        txnLabel({
            reason: 'video_generation',
            meta: { model: 'Seedance 2.0' },
        }),
        'Генерация · Seedance 2.0',
    );
});
