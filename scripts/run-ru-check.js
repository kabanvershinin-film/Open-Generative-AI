#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { форматСводкиТестов, перевестиЛинт } = require('./ru-report');

const РЕЖИМ = process.argv[2] || 'lint';
const КОРЕНЬ = path.join(__dirname, '..');

function выполнить(заголовок, команда, { переводчик = null, сводка = null } = {}) {
  console.log(`\n=== ${заголовок} ===`);
  const результат = spawnSync(команда, {
    cwd: КОРЕНЬ,
    shell: true,
    encoding: 'utf8',
  });

  const сыройВывод = `${результат.stdout || ''}${результат.stderr || ''}`.trim();
  const вывод = переводчик ? переводчик(сыройВывод) : сыройВывод;

  if (вывод) console.log(вывод);

  if (сводка) {
    const строкаСводки = сводка(сыройВывод);
    if (строкаСводки) console.log(`\n${строкаСводки}`);
  }

  if (результат.status === 0) {
    console.log(`\n${заголовок}: успешно.`);
  } else {
    console.log(`\n${заголовок}: завершилось с ошибкой.`);
  }

  return результат.status || 0;
}

function запуститьЛинт() {
  const код = выполнить('Линт', 'npm run lint', {
    переводчик: перевестиЛинт,
    сводка: (вывод) => {
      if (вывод.includes('No ESLint warnings or errors')) {
        return 'Линт пройден: предупреждений и ошибок нет.';
      }
      return 'Линт завершён. Проверьте сообщения выше.';
    },
  });
  process.exit(код);
}

function запуститьТесты() {
  const код = выполнить('Тесты', 'npm test', {
    сводка: форматСводкиТестов,
  });
  process.exit(код);
}

function запуститьСборку() {
  const код = выполнить('Сборка', 'npm run build', {
    переводчик: перевестиЛинт,
    сводка: (вывод) => (
      вывод.includes('Compiled successfully')
        ? 'Сборка выполнена успешно.'
        : 'Сборка завершена. Проверьте лог выше.'
    ),
  });
  process.exit(код);
}

function запуститьВсеПроверки() {
  const кодТестов = выполнить('Тесты', 'npm test', {
    сводка: форматСводкиТестов,
  });
  if (кодТестов !== 0) process.exit(кодТестов);

  const кодЛинта = выполнить('Линт', 'npm run lint', {
    переводчик: перевестиЛинт,
    сводка: (вывод) => {
      if (вывод.includes('No ESLint warnings or errors')) {
        return 'Линт пройден: предупреждений и ошибок нет.';
      }
      return 'Линт завершён. Проверьте сообщения выше.';
    },
  });
  if (кодЛинта !== 0) process.exit(кодЛинта);

  const кодСборки = выполнить('Сборка', 'npm run build', {
    переводчик: перевестиЛинт,
    сводка: (вывод) => (
      вывод.includes('Compiled successfully')
        ? 'Сборка выполнена успешно.'
        : 'Сборка завершена. Проверьте лог выше.'
    ),
  });
  process.exit(кодСборки);
}

if (РЕЖИМ === 'lint') запуститьЛинт();
if (РЕЖИМ === 'test') запуститьТесты();
if (РЕЖИМ === 'build') запуститьСборку();
if (РЕЖИМ === 'check') запуститьВсеПроверки();

console.error(`Неизвестный режим: ${РЕЖИМ}`);
process.exit(1);
