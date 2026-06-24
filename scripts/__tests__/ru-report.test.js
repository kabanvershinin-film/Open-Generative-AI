const test = require('node:test');
const assert = require('node:assert/strict');

const {
  форматСводкиТестов,
  перевестиЛинт,
  сводкаТестов,
} = require('../ru-report');

test('перевестиЛинт переводит ключевые сообщения ESLint на русский', () => {
  const вывод = перевестиЛинт(`
Warning: problem
Error: failed
✔ No ESLint warnings or errors
Creating an optimized production build ...
Compiled successfully
`);

  assert.match(вывод, /Предупреждение: problem/);
  assert.match(вывод, /Ошибка: failed/);
  assert.match(вывод, /Предупреждений и ошибок ESLint нет/);
  assert.match(вывод, /Создание оптимизированной production-сборки/);
  assert.match(вывод, /Сборка исходников выполнена успешно/);
});

test('сводкаТестов извлекает числа из вывода node --test', () => {
  const данные = сводкаТестов(`
ℹ tests 249
ℹ pass 249
ℹ fail 0
ℹ skipped 1
`);

  assert.deepStrictEqual(данные, {
    всего: 249,
    успешно: 249,
    упало: 0,
    пропущено: 1,
  });
});

test('форматСводкиТестов собирает русскую сводку', () => {
  const строка = форматСводкиТестов(`
ℹ tests 10
ℹ pass 9
ℹ fail 1
ℹ skipped 0
`);

  assert.strictEqual(строка, 'Тесты: всего 10, успешно 9, упало 1, пропущено 0.');
});

test('форматСводкиТестов возвращает запасной текст без статистики', () => {
  assert.strictEqual(
    форматСводкиТестов('без статистики'),
    'Тесты завершились. Подробности смотрите в логе выше.',
  );
});
