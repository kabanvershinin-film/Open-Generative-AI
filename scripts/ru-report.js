const ПОДСТАНОВКИ_ЛИНТА = [
  [/Warning:/g, 'Предупреждение:'],
  [/Error:/g, 'Ошибка:'],
  [/No ESLint warnings or errors/g, 'Предупреждений и ошибок ESLint нет'],
  [/`next lint` is deprecated and will be removed in Next\.js 16\./g, '`next lint` устарел и будет удалён в Next.js 16.'],
  [/For new projects, use create-next-app to choose your preferred linter\./g, 'Для новых проектов используйте create-next-app, чтобы выбрать предпочитаемый линтер.'],
  [/For existing projects, migrate to the ESLint CLI:/g, 'Для существующих проектов перейдите на ESLint CLI:'],
  [/Need to disable some ESLint rules\?/g, 'Если нужно отключить некоторые правила ESLint, см. документацию:'],
  [/Creating an optimized production build \.\.\./g, 'Создание оптимизированной production-сборки...'],
  [/Compiled successfully/g, 'Сборка исходников выполнена успешно'],
  [/Linting and checking validity of types \.\.\./g, 'Проверка линта и корректности типов...'],
  [/Collecting page data \.\.\./g, 'Сбор данных страниц...'],
  [/Generating static pages/g, 'Генерация статических страниц'],
  [/Finalizing page optimization \.\.\./g, 'Финализация оптимизации страниц...'],
  [/Collecting build traces \.\.\./g, 'Сбор трассировки сборки...'],
  [/Route \(app\)/g, 'Маршруты (app)'],
  [/First Load JS shared by all/g, 'Общий JS первой загрузки'],
];

function перевестиЛинт(вывод = '') {
  return ПОДСТАНОВКИ_ЛИНТА.reduce(
    (текст, [шаблон, замена]) => текст.replace(шаблон, замена),
    String(вывод || ''),
  );
}

function извлечьЧисло(вывод, имя) {
  const совпадение = String(вывод || '').match(new RegExp(`ℹ ${имя} (\\d+)`));
  return совпадение ? Number(совпадение[1]) : null;
}

function сводкаТестов(вывод = '') {
  return {
    всего: извлечьЧисло(вывод, 'tests'),
    успешно: извлечьЧисло(вывод, 'pass'),
    упало: извлечьЧисло(вывод, 'fail'),
    пропущено: извлечьЧисло(вывод, 'skipped'),
  };
}

function форматСводкиТестов(вывод = '') {
  const данные = сводкаТестов(вывод);
  if (данные.всего === null || данные.успешно === null || данные.упало === null) {
    return 'Тесты завершились. Подробности смотрите в логе выше.';
  }

  return `Тесты: всего ${данные.всего}, успешно ${данные.успешно}, упало ${данные.упало}, пропущено ${данные.пропущено ?? 0}.`;
}

module.exports = {
  форматСводкиТестов,
  перевестиЛинт,
  сводкаТестов,
};
