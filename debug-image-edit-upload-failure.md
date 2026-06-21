# Debug Session: image-edit-upload-failure

Status: [OPEN]

## Symptom
Фото загружается не для редактирования: пользователь выбирает изображение, но оно не доходит до режима edit / не появляется как референс.

## Hypotheses
1. `handleUploadSelect()` не переключает UI в `imageMode`, поэтому загрузка остается в text-to-image режиме.
2. `uploadFile()` возвращает URL, но `handleGenerate()` все равно берет старое состояние `uploadedImageUrls`/`imageMode`.
3. `generateI2I()` получает `image_url`, но запрос к `/images/edits` уходит без корректного `image` multipart field.
4. Загруженный файл не проходит `validateImageUploadFile()` и отбрасывается до редактирования.
5. Для `http(s)`-URL в `imageReferenceToEditFile()` не получается Blob, из-за чего edit request собирается некорректно.

## Plan
1. Add minimal instrumentation only.
2. Reproduce the upload/edit flow once.
3. Analyze runtime logs.
4. Apply the minimal fix and verify.
