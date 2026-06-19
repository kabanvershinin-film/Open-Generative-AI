# Debug Session: image-upload-stuck

Status: [OPEN]

## Symptom
Фото в студии изображений не загружается: прогресс доходит примерно до 35% и дальше не завершается.

## Hypotheses
1. Presigned PUT URL возвращается, но сам PUT в TOS зависает или падает.
2. PUT в TOS завершается, но ответ считается неуспешным из-за статуса/ошибки CORS.
3. `/api/upload-file` возвращает некорректный `putUrl` или `publicUrl`.
4. После ошибки presigned upload fallback на `/api/mf/v1/assets/upload` не стартует или тоже падает.
5. UI получает URL, но `handleUploadSelect` не вызывается/не обновляет `uploadedImageUrls`.

## Plan
1. Add temporary network-reporting instrumentation only.
2. Reproduce upload once.
3. Analyze logs.
4. Apply minimal fix based on evidence.
5. Verify and clean up after user confirmation.
