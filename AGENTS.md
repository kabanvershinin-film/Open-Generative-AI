# AGENTS.md 
 
 ## Обзор проекта 
 JavaScript/TypeScript проект со студией для работы с видео-моделями (Ark Seedance, Memefast). 
 
 ## Команды 
 - Установка: `pnpm install` 
 - Запуск: `pnpm dev` 
 - Тесты: `node --test` 
 
 ## Тестирование 
 - Фреймворк: node:test + node:assert (встроенные, не устанавливать Jest/Mocha) 
 - Расположение: `__tests__/название.test.js` или `moduleName.test.js` рядом с файлом 
 - Мокировать внешние fetch/API вызовы через встроенный mock в node:test 
 - Тесты должны проходить без ошибок перед каждым коммитом 
 - При изменении функции — проверить тест, при отсутствии создать 
 - При добавлении новой функции — добавить тест обязательно 
 
 ## Приоритетные модули для тестов 
 - `studio/muapi.js` — API-запросы, поллинг, авторизация (401/402) 
 - `studio/models.js` — фильтрация моделей T2V, I2V, V2V 
 - `api/route.js` — роуты Volcano Engine / Ark Seedance 
 - `packages/workflow-builder/utility.jsx` — утилиты узлов 
 
 ## Стиль кода 
 - TypeScript/JavaScript 
 - Функциональные паттерны где возможно
