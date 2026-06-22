# План: осталось завершить этапы 4–5

## Summary
- Цель: довести до завершения оставшиеся части roadmap после уже выполненных этапов `ark/seedance`, ESM-локализации и дробления `muapi.js`.
- Область работ: завершить разбиение `packages/workflow-builder-local/src/components/utility.jsx`, зафиксировать контракты соседних студий, убрать подтверждённый исторический шум и выполнить полный verify-проход.
- Подход: не перепридумывать архитектуру заново, а довести до рабочего состояния уже начатые выносы и закрепить их тестами.

## Current State Analysis

### Уже завершено
- `app/api/ark/seedance` уже переведён на thin wrapper + handler-слой:
  - [route.js](file:///workspace/app/api/ark/seedance/route.js)
  - [route.handlers.js](file:///workspace/app/api/ark/seedance/route.handlers.js)
  - [route.handlers.test.js](file:///workspace/app/api/ark/seedance/__tests__/route.handlers.test.js)
- Локальные ESM-границы уже заведены:
  - [app/api/package.json](file:///workspace/app/api/package.json)
  - [tests/package.json](file:///workspace/tests/package.json)
  - [packages/studio/src/package.json](file:///workspace/packages/studio/src/package.json)
  - [packages/workflow-builder-local/src/package.json](file:///workspace/packages/workflow-builder-local/src/package.json)
- `packages/studio/src/muapi.js` уже превращён в фасад над доменными модулями:
  - [muapi.js](file:///workspace/packages/studio/src/muapi.js)
  - [core.js](file:///workspace/packages/studio/src/muapi/core.js)
  - [files.js](file:///workspace/packages/studio/src/muapi/files.js)
  - [image.js](file:///workspace/packages/studio/src/muapi/image.js)
  - [ark.js](file:///workspace/packages/studio/src/muapi/ark.js)
  - [video.js](file:///workspace/packages/studio/src/muapi/video.js)
  - [assets.js](file:///workspace/packages/studio/src/muapi/assets.js)
  - [workflows.js](file:///workspace/packages/studio/src/muapi/workflows.js)
  - [user.js](file:///workspace/packages/studio/src/muapi/user.js)
  - [extras.js](file:///workspace/packages/studio/src/muapi/extras.js)

### Что осталось незавершённым по `utility.jsx`
- Главный источник перегруженности всё ещё остаётся в [utility.jsx](file:///workspace/packages/workflow-builder-local/src/components/utility.jsx): там до сих пор одновременно живут реестры моделей, `downloadFile`, `presets` и реэкспорт `stableStringify`.
- Файлы для разнесения уже созданы, но ещё не стали реальным источником правды:
  - [imageModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/imageModels.js)
  - [videoModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/videoModels.js)
  - [textModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/textModels.js)
  - [audioModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/audioModels.js)
  - [concatModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/concatModels.js)
  - [videoCombinerModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/videoCombinerModels.js)
  - [apiNodeModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/apiNodeModels.js)
  - [downloadFile.js](file:///workspace/packages/workflow-builder-local/src/components/file/downloadFile.js)
- Отдельного модуля с пресетами пока нет; `presets` остаются только внутри [utility.jsx](file:///workspace/packages/workflow-builder-local/src/components/utility.jsx).
- Потребители по-прежнему сидят на старом агрегаторе:
  - [NodeFlow.jsx](file:///workspace/packages/workflow-builder-local/src/components/NodeFlow.jsx)
  - [NodesNavbar.jsx](file:///workspace/packages/workflow-builder-local/src/components/NodesNavbar.jsx)
  - [AudioNode.jsx](file:///workspace/packages/workflow-builder-local/src/components/AudioNode.jsx)
  - [ImageNode.jsx](file:///workspace/packages/workflow-builder-local/src/components/ImageNode.jsx)
  - [VideoNode.jsx](file:///workspace/packages/workflow-builder-local/src/components/VideoNode.jsx)
  - [VideoCombiner.jsx](file:///workspace/packages/workflow-builder-local/src/components/VideoCombiner.jsx)
  - [NodeOptionsMenu.jsx](file:///workspace/packages/workflow-builder-local/src/components/NodeOptionsMenu.jsx)
- Тестовое покрытие в этой зоне пока фактически ограничено [utility.test.js](file:///workspace/packages/workflow-builder-local/src/components/__tests__/utility.test.js), который тестирует только [stableStringify.js](file:///workspace/packages/workflow-builder-local/src/components/stableStringify.js).

### Что осталось незавершённым по контрактам студий и чистке
- Новый контрактный файл уже создан: [studioContracts.test.js](file:///workspace/packages/studio/src/__tests__/studioContracts.test.js).
- `muapi/extras.js` уже закрепляет два типа поведения:
  - реальные thin wrappers для `AgentStudio`, `AppsStudio`, `AudioStudio`
  - fail-loudly поведение для ещё не перенесённых действий (`runClipping`, `generateMarketingStudioAd`, `runMotionGraphics`, `runMotionGraphicsEdit`)
- `PromptStudio.jsx` уже почищен от мёртвых импортов, но полный проход по историческим тестовым артефактам ещё не завершён.
- Подтверждённые шумные кандидаты:
  - [tests/imageStudio.test.js](file:///workspace/tests/imageStudio.test.js)
  - [tests/videoStudio.test.js](file:///workspace/tests/videoStudio.test.js)
  - [tests/studioMuapiUpload.test.js](file:///workspace/tests/studioMuapiUpload.test.js)
  - архивное дерево [Open-Generative-AI-main](file:///workspace/Open-Generative-AI-main)

### Остаточный ESM-долг
- Основные предупреждения для тестовых зон уже локализованы.
- При этом в типлесс-корне остаются ESM-файлы, которые могут продолжать давать предупреждения вне тестового контура:
  - [afterPack.js](file:///workspace/afterPack.js)
  - [scripts/test_minimax_provider.js](file:///workspace/scripts/test_minimax_provider.js)
- Корень по-прежнему нельзя переводить в глобальный `"type": "module"`, потому что в нём живут реальные CommonJS-скрипты и конфиги:
  - [scripts/patch-polling.js](file:///workspace/scripts/patch-polling.js)
  - [scripts/stage-local-ai-binary.js](file:///workspace/scripts/stage-local-ai-binary.js)
  - [scripts/package-linux-deb.js](file:///workspace/scripts/package-linux-deb.js)
  - [electron/main.js](file:///workspace/electron/main.js)
  - [postcss.config.js](file:///workspace/postcss.config.js)
  - [tailwind.config.js](file:///workspace/tailwind.config.js)

## Assumptions & Decisions
- Этапы 1–3 повторно не трогаются, если verify не покажет прямую регрессию.
- `utility.jsx` не должен оставаться вторым источником истины; после завершения этапа он должен стать тонким агрегатором или совместимым фасадом над новыми модулями.
- Для `workflow-builder-local` приоритет выше у чистых данных и экспортов, чем у широкого UI-рефакторинга.
- Для соседних студий не добавляется выдуманная функциональность: если достоверной реализации нет, сохраняется fail-loudly контракт с явной ошибкой.
- Исторические тесты удаляются или переносятся только при наличии замещающего, более точного покрытия рядом с актуальными модулями.
- Остаточный ESM-долг в корне исправляется только точечно на уровне конкретных файлов, без глобального изменения режима модулей.

## Proposed Changes

### 1. Завершить разнесение `utility.jsx`

#### Файлы
- [utility.jsx](file:///workspace/packages/workflow-builder-local/src/components/utility.jsx)
- Новый файл: `packages/workflow-builder-local/src/components/presets/index.js`
- Уже созданные модули:
  - [imageModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/imageModels.js)
  - [videoModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/videoModels.js)
  - [textModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/textModels.js)
  - [audioModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/audioModels.js)
  - [concatModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/concatModels.js)
  - [videoCombinerModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/videoCombinerModels.js)
  - [apiNodeModels.js](file:///workspace/packages/workflow-builder-local/src/components/model-registry/apiNodeModels.js)
  - [downloadFile.js](file:///workspace/packages/workflow-builder-local/src/components/file/downloadFile.js)
- Потребители, которые нужно перевести на новые импорты:
  - [NodeFlow.jsx](file:///workspace/packages/workflow-builder-local/src/components/NodeFlow.jsx)
  - [NodesNavbar.jsx](file:///workspace/packages/workflow-builder-local/src/components/NodesNavbar.jsx)
  - [AudioNode.jsx](file:///workspace/packages/workflow-builder-local/src/components/AudioNode.jsx)
  - [ImageNode.jsx](file:///workspace/packages/workflow-builder-local/src/components/ImageNode.jsx)
  - [VideoNode.jsx](file:///workspace/packages/workflow-builder-local/src/components/VideoNode.jsx)
  - [VideoCombiner.jsx](file:///workspace/packages/workflow-builder-local/src/components/VideoCombiner.jsx)
  - [NodeOptionsMenu.jsx](file:///workspace/packages/workflow-builder-local/src/components/NodeOptionsMenu.jsx)

#### Что сделать
- Вынести `presets` из `utility.jsx` в новый `presets/index.js` без изменения структуры самих пресетов.
- Переподключить компоненты на точечные импорты из:
  - `model-registry/*`
  - `file/downloadFile.js`
  - `presets/index.js`
  - `stableStringify.js`
- Оставить `utility.jsx` как совместимый фасад с простыми реэкспортами, чтобы не ломать возможные внешние импорты, которые ещё не были обнаружены поиском.
- Удалить из `utility.jsx` дублирующие определения после перевода импортов на новые модули.
- Во время перевода перепроверить явные подозрительные схемы в моделях, прежде всего `required`-поля у passthrough-узлов, и если они реально дублируют баг из старого файла, исправлять уже в одном источнике правды, а не в двух местах.

#### Почему
- Сейчас рефакторинг существует только как набор новых файлов на диске; боевой код всё ещё зависит от старого монолита.
- Пока данные определены в двух местах, каждое следующее изменение несёт риск расхождения.

### 2. Добить тесты вокруг `workflow-builder-local`

#### Файлы
- [utility.test.js](file:///workspace/packages/workflow-builder-local/src/components/__tests__/utility.test.js)
- Новый файл: `packages/workflow-builder-local/src/components/__tests__/presets.test.js`
- Новый файл: `packages/workflow-builder-local/src/components/__tests__/model-registry.test.js`
- Новый файл: `packages/workflow-builder-local/src/components/__tests__/downloadFile.test.js`

#### Что сделать
- Переименовать или перепрофилировать текущий `utility.test.js` так, чтобы имя теста соответствовало фактическому объекту проверки; если переименование будет лишним для истории, оставить файл, но сузить его назначение до `stableStringify`.
- Добавить лёгкие контрактные тесты на:
  - наличие и базовую структуру `presets`
  - непротиворечивость экспортов реестров моделей
  - наличие ожидаемых id/shape для категорий, которые используются в `NodeFlow` и `NodesNavbar`
- Добавить изолированный тест для `downloadFile`, мокая браузерные зависимости без сети.
- Не писать UI-тесты на весь workflow builder; ограничиться контрактами экспортов и shape данных.

#### Почему
- После разнесения `utility.jsx` нужна страховка, что новые источники правды совместимы с существующими компонентами.
- Сейчас у зоны `workflow-builder-local` почти нет тестов, кроме `stableStringify`.

### 3. Зафиксировать контракты соседних студий

#### Файлы
- [studioContracts.test.js](file:///workspace/packages/studio/src/__tests__/studioContracts.test.js)
- При необходимости точечные правки в:
  - [muapi/extras.js](file:///workspace/packages/studio/src/muapi/extras.js)
  - [models.js](file:///workspace/packages/studio/src/models.js)
  - [ImageStudio.jsx](file:///workspace/packages/studio/src/components/ImageStudio.jsx)
  - [AudioStudio.jsx](file:///workspace/packages/studio/src/components/AudioStudio.jsx)
  - [LipSyncStudio.jsx](file:///workspace/packages/studio/src/components/LipSyncStudio.jsx)
  - [WorkflowStudio.jsx](file:///workspace/packages/studio/src/components/WorkflowStudio.jsx)
  - [AgentStudio.jsx](file:///workspace/packages/studio/src/components/AgentStudio.jsx)
  - [AppsStudio.jsx](file:///workspace/packages/studio/src/components/AppsStudio.jsx)

#### Что сделать
- Прогнать и стабилизировать [studioContracts.test.js](file:///workspace/packages/studio/src/__tests__/studioContracts.test.js).
- Если тесты вскроют реальный рассинхрон между `models.js`/`muapi.js` и компонентами соседних студий, чинить именно контракт:
  - добавить отсутствующий безопасный реэкспорт
  - скорректировать неверный импорт
  - сохранить fail-loudly поведение там, где функциональность осознанно не перенесена
- Не расширять текущий набор feature-gap методов за пределы уже подтверждённых импортами компонент.
- При необходимости добавить 1–2 точечных контрактных теста, только если existing `studioContracts.test.js` не покрывает реальный UI-зависимый shape.

#### Почему
- Этот слой уже частично укреплён, но без фактического прогона нельзя считать контракт зафиксированным.
- Основной риск здесь не в вычислениях, а в исчезновении экспортов или скрытом дрейфе shape данных.

### 4. Подчистить исторические тесты и служебный шум

#### Файлы
- [tests/imageStudio.test.js](file:///workspace/tests/imageStudio.test.js)
- [tests/videoStudio.test.js](file:///workspace/tests/videoStudio.test.js)
- [tests/studioMuapiUpload.test.js](file:///workspace/tests/studioMuapiUpload.test.js)
- [Open-Generative-AI-main](file:///workspace/Open-Generative-AI-main)

#### Что сделать
- Для [tests/imageStudio.test.js](file:///workspace/tests/imageStudio.test.js) и [tests/videoStudio.test.js](file:///workspace/tests/videoStudio.test.js) провести жёсткое решение:
  - удалить, если они подтверждённо дублируют или противоречат актуальному слою `packages/studio/src/__tests__`
  - иначе перенести ближе к актуальному модулю и переименовать так, чтобы было понятно, что именно они тестируют
- Для [tests/studioMuapiUpload.test.js](file:///workspace/tests/studioMuapiUpload.test.js) решить отдельно:
  - либо оставить как корневой smoke/compat тест, если он закрывает уникальный сценарий
  - либо перенести рядом с `packages/studio/src/muapi/assets.js`, если это по сути пакетный модульный тест
- По дереву [Open-Generative-AI-main](file:///workspace/Open-Generative-AI-main) выполнить поиск фактического использования; если это архивный дубликат без активных ссылок в командах и тестах, удалить целиком как источник шума для поиска и навигации.

#### Почему
- Сейчас репозиторий смешивает актуальные модульные тесты и старые сценарии, из-за чего сложнее понимать, чему реально доверять.
- Архивное дублирующее дерево увеличивает шум поиска и риск случайного редактирования не того файла.

### 5. Закрыть остаточный ESM-долг только точечно

#### Файлы
- [afterPack.js](file:///workspace/afterPack.js)
- [scripts/test_minimax_provider.js](file:///workspace/scripts/test_minimax_provider.js)

#### Что сделать
- После основного verify отдельно проверить, воспроизводятся ли предупреждения `MODULE_TYPELESS_PACKAGE_JSON` именно на этих сценариях.
- Если воспроизводятся:
  - либо перевести конкретный файл на CommonJS, если его реально запускает CJS-контур
  - либо переименовать в `.mjs`, если файл должен оставаться ESM и вызывается напрямую Node/electron-builder
- Не менять корневой [package.json](file:///workspace/package.json) на глобальный `"type": "module"`.

#### Почему
- Основной ESM-долг уже локализован, но в корне остаются отдельные файлы-исключения.
- Эти правки малы по объёму и не должны смешиваться с большим этапом по `utility.jsx`.

## Verification Steps

### После завершения `utility.jsx`
- Запустить:
  - `node --test packages/workflow-builder-local/src/components/__tests__/utility.test.js`
  - `node --test packages/workflow-builder-local/src/components/__tests__/presets.test.js`
  - `node --test packages/workflow-builder-local/src/components/__tests__/model-registry.test.js`
  - `node --test packages/workflow-builder-local/src/components/__tests__/downloadFile.test.js`

### После стабилизации контрактов студий
- Запустить:
  - `node --test packages/studio/src/__tests__/models.test.js`
  - `node --test packages/studio/src/__tests__/muapi.test.js`
  - `node --test packages/studio/src/__tests__/studioContracts.test.js`
  - `node --test packages/studio/src/videoAssetPayload.test.js`

### После чистки артефактов
- Запустить:
  - `node --test tests/studioMuapiUpload.test.js` только если файл остаётся в корне
  - `node --test` для полного прохода

### Финальный verify
- Запустить:
  - `node --test`
  - `npm run build`
  - `npm run build:studio`
  - `npm run build:workflow`
- Дополнительно проверить, что:
  - `utility.jsx` больше не содержит копий данных, вынесенных в `model-registry`, `presets` и `file/downloadFile.js`
  - `studioContracts.test.js` зелёный без ослабления fail-loudly веток
  - удалены только доказуемо лишние исторические артефакты
  - предупреждения `MODULE_TYPELESS_PACKAGE_JSON` не возвращаются в обычном тестовом прогоне

## Порядок исполнения
1. Завершить `utility.jsx` и перевести потребителей на новые модули.
2. Добавить и стабилизировать тесты `workflow-builder-local`.
3. Прогнать и при необходимости стабилизировать контракты соседних студий.
4. Подчистить исторические тесты и архивные артефакты.
5. Точечно закрыть остаточные ESM-исключения, только если verify подтвердит предупреждения.
6. Выполнить полный verify-проход.
