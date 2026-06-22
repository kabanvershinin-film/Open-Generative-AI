# План: что ещё нужно

## Summary
- Цель: поэтапно укрепить надёжность репозитория без широкого рискованного переписывания, начиная с самых опасных мест.
- Формат исполнения: 4 последовательных этапа с проверками после каждого этапа.
- Приоритет исполнения:
  1. `app/api/ark/seedance` handler-сценарии
  2. Консервативная ESM-стратегия и устранение `MODULE_TYPELESS_PACKAGE_JSON`
  3. Дробление `packages/studio/src/muapi.js`
  4. Дробление `packages/workflow-builder-local/src/components/utility.jsx`
  5. Контрактные тесты для соседних студий и жёсткая чистка артефактов

## Current State Analysis

### 1. `ark/seedance`
- В `app/api/ark/seedance` уже есть:
  - [route.js](file:///workspace/app/api/ark/seedance/route.js)
  - [route.helpers.js](file:///workspace/app/api/ark/seedance/route.helpers.js)
  - [logic.js](file:///workspace/app/api/ark/seedance/logic.js)
  - [logic.test.js](file:///workspace/app/api/ark/seedance/__tests__/logic.test.js)
  - [route.test.js](file:///workspace/app/api/ark/seedance/__tests__/route.test.js)
- Текущее покрытие route-слоя фактически ограничено helper-функциями из `route.helpers.js`; тестов, близких к реальным `POST`/`GET` handler-веткам из `route.js`, нет.
- Наиболее рискованные ветки, не зафиксированные тестами:
  - отсутствие `ARK_API_KEY`
  - `Empty content`
  - нормализация fast `1080p -> 720p`
  - генерация и использование `bill`
  - обработка `usage.total_tokens`
  - ошибки внешнего Ark API
  - `GET` polling success/error ветки

### 2. Модульная конфигурация
- В корневом [package.json](file:///workspace/package.json) нет `"type": "module"`, при этом:
  - корневые тесты используют `import/export`
  - `app/api/**` использует ESM
  - `packages/studio/src/**` использует ESM
  - `packages/workflow-builder-local/src/**` использует ESM
- Одновременно в корне и пакетах есть CommonJS-скрипты и конфиги:
  - `tailwind.config.js`
  - `postcss.config.js`
  - `scripts/*.js`
  - служебные `push-*.js`, `run-git.js`, `git-status.js`
- Из-за этого глобальное `"type": "module"` в корне рискованно.
- В [packages/studio/package.json](file:///workspace/packages/studio/package.json) `main` и `module` указывают на `src/index.js`, хотя есть build-процесс в `dist`; это смешивает исходники и сборку.
- В [packages/workflow-builder-local/package.json](file:///workspace/packages/workflow-builder-local/package.json) `main` и `module` указывают на `dist/index.js`, но фактический `dist` — CommonJS, так что поле `module` вводит в заблуждение.

### 3. `muapi.js`
- [packages/studio/src/muapi.js](file:///workspace/packages/studio/src/muapi.js) остаётся большим агрегатором:
  - файловая валидация и оптимизация
  - image API
  - Ark/video API
  - upload/persistence
  - workflow API
  - balance/user API
- В текущем покрытии уже есть хорошие тесты на:
  - `generateImage` / `generateI2I`
  - `generateVideo`
  - workflow CRUD
  - workflow inputs / node schemas
- Но файл остаётся дорогим для сопровождения и рефакторинга.

### 4. `utility.jsx`
- [packages/workflow-builder-local/src/components/utility.jsx](file:///workspace/packages/workflow-builder-local/src/components/utility.jsx) всё ещё смешивает:
  - реестры моделей
  - пресеты
  - файловые утилиты
  - сетевые вызовы
- Первый шаг уже сделан: `stableStringify` вынесен в [stableStringify.js](file:///workspace/packages/workflow-builder-local/src/components/stableStringify.js), но основной файл по-прежнему перегружен.

### 5. Соседние студии и контракты
- Помимо `VideoStudio`, реальные зависимости от `models.js`/`muapi.js` есть у:
  - [ImageStudio.jsx](file:///workspace/packages/studio/src/components/ImageStudio.jsx)
  - [AudioStudio.jsx](file:///workspace/packages/studio/src/components/AudioStudio.jsx)
  - [LipSyncStudio.jsx](file:///workspace/packages/studio/src/components/LipSyncStudio.jsx)
  - [WorkflowStudio.jsx](file:///workspace/packages/studio/src/components/WorkflowStudio.jsx)
  - [AgentStudio.jsx](file:///workspace/packages/studio/src/components/AgentStudio.jsx)
  - [AppsStudio.jsx](file:///workspace/packages/studio/src/components/AppsStudio.jsx)
  - [ClippingStudio.jsx](file:///workspace/packages/studio/src/components/ClippingStudio.jsx)
  - [MarketingStudio.jsx](file:///workspace/packages/studio/src/components/MarketingStudio.jsx)
  - [VibeMotionStudio.jsx](file:///workspace/packages/studio/src/components/VibeMotionStudio.jsx)
  - [PromptStudio.jsx](file:///workspace/packages/studio/src/components/PromptStudio.jsx)
- В `PromptStudio` импорт `uploadFile`/`persistImageToTOS` выглядит мёртвым.
- Для `AgentStudio`, `AppsStudio`, `ClippingStudio`, `MarketingStudio`, `VibeMotionStudio`, `AudioStudio`, `LipSyncStudio` и части других студий есть риск рассинхронизации с API-слоем: часть нужных UI-методов не подтверждается в текущем `packages/studio/src/muapi.js`, а часть логики исторически жила в старом [src/lib/muapi.js](file:///workspace/src/lib/muapi.js).

### 6. Исторические/служебные артефакты
- Шумные кандидаты:
  - [test-price.js](file:///workspace/test-price.js)
  - [tests/imageStudio.test.js](file:///workspace/tests/imageStudio.test.js)
  - [tests/videoStudio.test.js](file:///workspace/tests/videoStudio.test.js)
  - архивное дерево `Open-Generative-AI-main/`
- Не всё это нужно удалять сразу, но текущая цель — агрессивно чистить только доказуемо лишнее, не ломая полезное покрытие.

## Assumptions & Decisions
- Реализация идёт по этапам, а не одним большим пакетом.
- Для ESM используется консервативный подход:
  - не трогать глобально корневой режим модулей
  - локализовать ESM-области через ближайшие `package.json` или точечные переименования
  - не ломать CommonJS-скрипты и конфиги в корне
- Для исторических артефактов применяется жёсткая чистка, но только там, где удаление подтверждено поиском использования, покрытием и отсутствием продуктовой ценности.
- Для соседних студий задача состоит не в полном переписывании всех фич, а в:
  - фиксации контрактов на действительно активные зависимости
  - удалении мёртвых импортов
  - переносе/восстановлении отсутствующей логики только там, где она реально нужна компоненту и может быть выведена из текущего/старого кода

## Proposed Changes

### Этап 1. Усилить `ark/seedance` на уровне handler-сценариев

#### Файлы
- [app/api/ark/seedance/route.js](file:///workspace/app/api/ark/seedance/route.js)
- [app/api/ark/seedance/route.helpers.js](file:///workspace/app/api/ark/seedance/route.helpers.js)
- [app/api/ark/seedance/logic.js](file:///workspace/app/api/ark/seedance/logic.js)
- [app/api/ark/seedance/__tests__/route.test.js](file:///workspace/app/api/ark/seedance/__tests__/route.test.js)
- [app/api/ark/seedance/__tests__/logic.test.js](file:///workspace/app/api/ark/seedance/__tests__/logic.test.js)
- Новый файл: `app/api/ark/seedance/__tests__/route.handlers.test.js`
- Опционально новый файл: `app/api/ark/seedance/route.runtime.js` или `route.handlers.js`

#### Что сделать
- Оставить `route.helpers.js` для чистых helper-функций.
- Вынести из `route.js` тестопригодную handler-логику в отдельный модуль:
  - `submitSeedanceTask(deps, requestBody, requestMeta)`
  - `pollSeedanceTask(deps, requestMeta)`
- Сделать `route.js` тонкой обвязкой вокруг `NextResponse` и новых чистых функций.
- Сохранить текущие helper-тесты.
- Добавить отдельные handler-тесты на сценарии:
  - `POST` при отсутствии `ARK_API_KEY` -> `503`
  - `POST` с пустым `content` -> `400`
  - `POST` с fast `1080p` -> отправка `720p`
  - `POST` успешный submit -> возврат `taskId`, `bill`, `estimatedCost`, `rateCny`
  - `POST` при ошибке Ark API -> проброс корректного статуса/сообщения
  - `GET` без `taskId` -> `400`
  - `GET` при отсутствии `ARK_API_KEY` -> `503`
  - `GET` success -> возврат `status`, `url`, `tokens`, `last_frame_url`
  - `GET` success + `bill` + `usage.total_tokens` -> вызов пост-оплаты
  - `GET` ошибка Ark API -> проброс статуса/сообщения
- Все внешние зависимости мокать:
  - `fetch`
  - `getUser`
  - `priceRub`
  - `ensureCnyRate`
  - `seedance2RateCny`
  - `rubFromTokens`
  - `chargeForTask`
  - `resolvePublic`/TOS upload через инъекцию зависимостей, а не реальную сеть

#### Почему
- Это самый рискованный участок по бизнес-ценности: биллинг, Ark, поллинг, токены, маршрутизация.
- Текущие helper-тесты не защищают реальные HTTP-ветки.

#### Как
- Не пытаться мокать `NextResponse` напрямую.
- Вместо этого тестировать чистые handler-функции и отдельно оставлять `route.js` как thin wrapper.
- Не менять контракт внешнего API ответа, только внутреннюю организацию кода.

### Этап 2. Консервативно устранить `MODULE_TYPELESS_PACKAGE_JSON`

#### Файлы
- [package.json](file:///workspace/package.json)
- [packages/studio/package.json](file:///workspace/packages/studio/package.json)
- [packages/workflow-builder-local/package.json](file:///workspace/packages/workflow-builder-local/package.json)
- Новый файл: `app/api/package.json`
- Новый файл: `tests/package.json`
- Новый файл: `packages/studio/src/package.json`
- Новый файл: `packages/workflow-builder-local/src/package.json`
- Возможные правки в:
  - [packages/studio/src/index.js](file:///workspace/packages/studio/src/index.js)
  - [packages/workflow-builder-local/src/index.js](file:///workspace/packages/workflow-builder-local/src/index.js)

#### Что сделать
- Не добавлять `"type": "module"` в корневой `package.json`.
- Добавить локальные `package.json` с `"type": "module"` в ESM-области:
  - `app/api/package.json`
  - `tests/package.json`
  - `packages/studio/src/package.json`
  - `packages/workflow-builder-local/src/package.json`
- Исправить package entry points:
  - в `packages/studio/package.json` перестать публиковать `src/index.js` как `main/module`; вместо этого настроить `main`/`exports` на `dist`, если build реально используется как публичная точка входа
  - в `packages/workflow-builder-local/package.json` убрать ложное поле `module`, если `dist` остаётся CommonJS
- Если после локального ESM всё ещё есть проблемные импорты, добавить расширения в локальные `import` внутри `src/**` только там, где это нужно для нативного Node ESM.

#### Почему
- Нужно убрать предупреждения без поломки корневых CommonJS-скриптов и конфигов.
- Нельзя глобально переключать корень в ESM, пока там живут `require`-скрипты.

#### Как
- Сначала добавить локальные `package.json`.
- Затем прогнать `npm test`.
- После этого отдельно проверить:
  - `npm run build`
  - пакетные build-команды
- Только при необходимости трогать импортные расширения.

### Этап 3. Разгрузить `muapi.js`

#### Файлы
- [packages/studio/src/muapi.js](file:///workspace/packages/studio/src/muapi.js)
- Новые файлы:
  - `packages/studio/src/muapi/core.js`
  - `packages/studio/src/muapi/files.js`
  - `packages/studio/src/muapi/image.js`
  - `packages/studio/src/muapi/ark.js`
  - `packages/studio/src/muapi/video.js`
  - `packages/studio/src/muapi/assets.js`
  - `packages/studio/src/muapi/workflows.js`
  - `packages/studio/src/muapi/user.js`
- Тесты:
  - [packages/studio/src/__tests__/muapi.test.js](file:///workspace/packages/studio/src/__tests__/muapi.test.js)
  - Новый набор тестов рядом с новыми модулями при необходимости
  - [tests/studioMuapiUpload.test.js](file:///workspace/tests/studioMuapiUpload.test.js) -> кандидат на перенос ближе к модулю

#### Что сделать
- Оставить `muapi.js` тонким публичным фасадом с реэкспортами.
- Вынести функции по доменным зонам:
  - `files.js`: валидация и оптимизация файлов
  - `core.js`: сетевые утилиты и обработка ошибок
  - `image.js`: image/I2I
  - `ark.js`: Ark submit/poll
  - `video.js`: video/I2V/V2V
  - `assets.js`: upload/persist
  - `workflows.js`: workflow CRUD, inputs, schemas, run
  - `user.js`: balance/user helpers
- При переносе не менять публичные сигнатуры экспорта.
- Обновить тесты так, чтобы они били по новым доменным файлам, а не только по агрегатору.

#### Почему
- Сейчас изменения в одной зоне риска затрагивают весь файл.
- Разбиение упростит отдельное тестирование и контрактный аудит соседних студий.

#### Как
- Переносить по одному доменному блоку.
- После каждого переноса прогонять профильные тесты.
- Полный `npm test` — после завершения всего этапа.

### Этап 4. Разгрузить `utility.jsx`

#### Файлы
- [packages/workflow-builder-local/src/components/utility.jsx](file:///workspace/packages/workflow-builder-local/src/components/utility.jsx)
- [packages/workflow-builder-local/src/components/stableStringify.js](file:///workspace/packages/workflow-builder-local/src/components/stableStringify.js)
- Новые файлы:
  - `packages/workflow-builder-local/src/components/model-registry/imageModels.js`
  - `packages/workflow-builder-local/src/components/model-registry/videoModels.js`
  - `packages/workflow-builder-local/src/components/model-registry/textModels.js`
  - `packages/workflow-builder-local/src/components/model-registry/audioModels.js`
  - `packages/workflow-builder-local/src/components/model-registry/concatModels.js`
  - `packages/workflow-builder-local/src/components/model-registry/videoCombinerModels.js`
  - `packages/workflow-builder-local/src/components/model-registry/apiNodeModels.js`
  - `packages/workflow-builder-local/src/components/file/downloadFile.js`
  - `packages/workflow-builder-local/src/components/presets/index.js`
- Тесты:
  - [packages/workflow-builder-local/src/components/__tests__/utility.test.js](file:///workspace/packages/workflow-builder-local/src/components/__tests__/utility.test.js)
  - Новый `stableStringify.test.js`
  - Новый `model-registry.test.js`
  - Новый `presets.test.js`
  - Новый `downloadFile.test.js`

#### Что сделать
- Сделать `utility.jsx` агрегатором экспортов.
- Вынести:
  - реестры моделей в `model-registry/*`
  - `downloadFile` в `file/downloadFile.js`
  - пресеты в `presets/index.js`
- Переименовать текущий `utility.test.js` по смыслу в `stableStringify.test.js`.
- Добавить целевые тесты на пресеты и реестры.

#### Почему
- Сейчас файл сложен для чтения и не разделяет данные/логику/утилиты.
- Этот этап нужен как структурное продолжение уже вынесенного `stableStringify`.

#### Как
- В первую очередь переносить чистые данные.
- Затем переносить `downloadFile`.
- Только после этого упрощать `utility.jsx`.

### Этап 5. Зафиксировать контракты соседних студий и провести жёсткую чистку

#### Файлы
- Компоненты:
  - [ImageStudio.jsx](file:///workspace/packages/studio/src/components/ImageStudio.jsx)
  - [AudioStudio.jsx](file:///workspace/packages/studio/src/components/AudioStudio.jsx)
  - [LipSyncStudio.jsx](file:///workspace/packages/studio/src/components/LipSyncStudio.jsx)
  - [WorkflowStudio.jsx](file:///workspace/packages/studio/src/components/WorkflowStudio.jsx)
  - [AgentStudio.jsx](file:///workspace/packages/studio/src/components/AgentStudio.jsx)
  - [AppsStudio.jsx](file:///workspace/packages/studio/src/components/AppsStudio.jsx)
  - [ClippingStudio.jsx](file:///workspace/packages/studio/src/components/ClippingStudio.jsx)
  - [MarketingStudio.jsx](file:///workspace/packages/studio/src/components/MarketingStudio.jsx)
  - [VibeMotionStudio.jsx](file:///workspace/packages/studio/src/components/VibeMotionStudio.jsx)
  - [PromptStudio.jsx](file:///workspace/packages/studio/src/components/PromptStudio.jsx)
- Базовые зависимости:
  - [packages/studio/src/models.js](file:///workspace/packages/studio/src/models.js)
  - [packages/studio/src/muapi.js](file:///workspace/packages/studio/src/muapi.js)
  - [src/lib/muapi.js](file:///workspace/src/lib/muapi.js)
- Тесты:
  - Новый `packages/studio/src/__tests__/studioContracts.test.js`
  - Возможные дополнительные файлы по студиям
- Артефакты:
  - [test-price.js](file:///workspace/test-price.js)
  - [tests/imageStudio.test.js](file:///workspace/tests/imageStudio.test.js)
  - [tests/videoStudio.test.js](file:///workspace/tests/videoStudio.test.js)

#### Что сделать
- Для студий с подтверждёнными активными контрактами:
  - `ImageStudio`
  - `AudioStudio`
  - `LipSyncStudio`
  - `WorkflowStudio`
  добавить лёгкие контрактные тесты на expected shape зависимостей (`models`/`muapi`), без полноценного UI-рендеринга.
- Для `PromptStudio` удалить мёртвые импорты `uploadFile`/`persistImageToTOS`, если поиск подтвердит отсутствие использования.
- Для `AgentStudio`, `AppsStudio`, `ClippingStudio`, `MarketingStudio`, `VibeMotionStudio`:
  - сначала найти, есть ли рабочая логика в старом [src/lib/muapi.js](file:///workspace/src/lib/muapi.js) или в API-роутах
  - если метод существует в старом клиенте и его можно безопасно перенести в новый `muapi` без продуктовых догадок — перенести
  - если импорт мёртвый — удалить
  - если компонент использует метод, но достоверной реализации в кодовой базе нет — не выдумывать её; вместо этого пометить как feature gap и не включать в автоматическое покрытие этого этапа
- Жёсткая чистка артефактов:
  - удалить/заменить [test-price.js](file:///workspace/test-price.js), если его покрытие полностью дублируется профильными тестами
  - после появления равнозначного модульного покрытия решить судьбу [tests/imageStudio.test.js](file:///workspace/tests/imageStudio.test.js) и [tests/videoStudio.test.js](file:///workspace/tests/videoStudio.test.js): либо удалить как исторические, либо переместить в более точные имена/категории

#### Почему
- Нужно зафиксировать не только `VideoStudio`, но и другие реальные UI-контракты.
- Мёртвые импорты и тестовые артефакты создают ложный шум и маскируют реальные проблемы.

#### Как
- Сначала покрывать студии, где контракт уже ясен по текущему коду.
- Затем точечно чистить импорты и артефакты.
- Не удалять исторические тесты, пока нет замещающего покрытия на новый модульный слой.

## Verification Steps

### После Этапа 1
- Запустить:
  - `node --test app/api/ark/seedance/__tests__/logic.test.js`
  - `node --test app/api/ark/seedance/__tests__/route.test.js`
  - `node --test app/api/ark/seedance/__tests__/route.handlers.test.js`

### После Этапа 2
- Запустить:
  - `npm test`
- Проверить отсутствие предупреждений `MODULE_TYPELESS_PACKAGE_JSON` для:
  - `app/api/**`
  - `tests/**`
  - `packages/studio/src/**`
  - `packages/workflow-builder-local/src/**`
- Затем проверить сборки:
  - `npm run build`
  - `npm run build:studio`
  - `npm run build:workflow`

### После Этапа 3
- Запустить профильные тесты `muapi`
- Затем полный `npm test`

### После Этапа 4
- Запустить профильные тесты `workflow-builder-local`
- Затем полный `npm test`

### После Этапа 5
- Запустить:
  - `npm test`
  - `git diff --stat`
- Убедиться, что:
  - удалены только доказуемо лишние артефакты
  - контрактные тесты соседних студий зелёные
  - публичные импорты студий не сломаны

## Порядок исполнения
1. Выполнить Этап 1 полностью.
2. Выполнить Этап 2 и убрать модульные предупреждения без глобального перевода корня.
3. Выполнить Этап 3 с поэтапным переносом `muapi`.
4. Выполнить Этап 4 с разбиением `utility.jsx`.
5. Выполнить Этап 5: контракты соседних студий и жёсткая чистка артефактов.
