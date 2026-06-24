import test from 'node:test';
import assert from 'node:assert/strict';

import {
  formatGenerationErrorNotice,
  isInsufficientFundsError,
} from '../components/generationErrorNotice.js';

test('isInsufficientFundsError распознает нехватку средств', () => {
  assert.strictEqual(
    isInsufficientFundsError('Недостаточно средств. Нужно 100₽, на балансе 0₽.'),
    true,
  );
  assert.strictEqual(
    isInsufficientFundsError('insufficient funds'),
    true,
  );
  assert.strictEqual(
    isInsufficientFundsError('Ошибка генерации'),
    false,
  );
});

test('formatGenerationErrorNotice добавляет подсказку о пополнении счета', () => {
  assert.deepStrictEqual(
    formatGenerationErrorNotice('Недостаточно средств. Нужно 100₽, на балансе 0₽.'),
    {
      tone: 'warning',
      title: 'Недостаточно средств',
      description:
        'Недостаточно средств. Нужно 100₽, на балансе 0₽. Пополните счет и повторите генерацию.',
    },
  );
});

test('formatGenerationErrorNotice возвращает обычную ошибку для прочих сбоев', () => {
  assert.deepStrictEqual(
    formatGenerationErrorNotice('Image API 502'),
    {
      tone: 'error',
      title: 'Ошибка генерации',
      description: 'Image API 502',
    },
  );
  assert.strictEqual(formatGenerationErrorNotice(''), null);
});
