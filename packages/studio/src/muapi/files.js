export const MAX_IMAGE_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_IMAGE_REFERENCE_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
export const LARGE_IMAGE_UPLOAD_OPTIMIZE_THRESHOLD_BYTES = 5 * 1024 * 1024;
export const LARGE_IMAGE_UPLOAD_TARGET_BYTES = 4.5 * 1024 * 1024;
export const SUPPORTED_IMAGE_UPLOAD_EXTENSIONS = new Set([
    'jpg', 'jpeg', 'png', 'tif', 'tiff',
    'raw', 'cr2', 'cr3', 'nef', 'arw', 'dng', 'orf', 'raf', 'rw2', 'pef', 'srw',
]);
export const SUPPORTED_IMAGE_UPLOAD_MIME_TYPES = new Set([
    'image/jpeg', 'image/jpg', 'image/png', 'image/tiff', 'image/x-tiff',
    'image/raw', 'image/x-raw', 'image/x-canon-cr2', 'image/x-canon-cr3', 'image/x-nikon-nef',
    'image/x-sony-arw', 'image/x-adobe-dng', 'image/x-olympus-orf', 'image/x-fuji-raf',
]);
export const SUPPORTED_IMAGE_REFERENCE_EXTENSIONS = SUPPORTED_IMAGE_UPLOAD_EXTENSIONS;
export const SUPPORTED_IMAGE_REFERENCE_MIME_TYPES = SUPPORTED_IMAGE_UPLOAD_MIME_TYPES;

function getFileExtension(file) {
    return String(file?.name || '').split('.').pop()?.toLowerCase() || '';
}

export function isSupportedImageUploadFile(file) {
    const type = String(file?.type || '').toLowerCase();
    const ext = getFileExtension(file);
    return SUPPORTED_IMAGE_UPLOAD_MIME_TYPES.has(type) || SUPPORTED_IMAGE_UPLOAD_EXTENSIONS.has(ext);
}

export function isSupportedImageReferenceFile(file) {
    const type = String(file?.type || '').toLowerCase();
    const ext = getFileExtension(file);
    return SUPPORTED_IMAGE_REFERENCE_MIME_TYPES.has(type) && SUPPORTED_IMAGE_REFERENCE_EXTENSIONS.has(ext);
}

export function validateImageReferenceUploadFile(file) {
    if (!file) throw new Error('Файл изображения не выбран.');
    if (!isSupportedImageReferenceFile(file)) {
        throw new Error(`Формат файла не поддерживается: ${file.name || 'без имени'}. Поддерживаются JPG, PNG, TIFF и RAW.`);
    }
    if (file.size > MAX_IMAGE_REFERENCE_UPLOAD_SIZE_BYTES) {
        throw new Error(`Файл слишком большой: ${file.name || 'без имени'}. Максимальный размер — 50 МБ.`);
    }
    return true;
}

export function validateImageUploadFile(file) {
    if (!file) throw new Error('Файл изображения не выбран.');
    if (!isSupportedImageUploadFile(file)) {
        throw new Error(`Формат файла не поддерживается: ${file.name || 'без имени'}. Поддерживаются JPG, PNG, TIFF и RAW.`);
    }
    if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
        throw new Error(`Файл слишком большой: ${file.name || 'без имени'}. Максимальный размер — 50 МБ.`);
    }
    return true;
}

function readFileAsDataUrl(file, FileReaderCtor) {
    return new Promise((resolve, reject) => {
        const reader = new FileReaderCtor();
        reader.onerror = () => reject(new Error('Не удалось прочитать изображение перед загрузкой.'));
        reader.onload = (event) => resolve(event?.target?.result || reader.result);
        reader.readAsDataURL(file);
    });
}

function loadImageElement(src, ImageCtor) {
    return new Promise((resolve, reject) => {
        const image = new ImageCtor();
        image.onerror = () => reject(new Error('Не удалось подготовить изображение к загрузке.'));
        image.onload = () => resolve(image);
        image.src = src;
    });
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob || null), type, quality);
    });
}

export async function optimizeImageUploadFile(file, options = {}, runtime = {}) {
    const optimizeAboveBytes = options.optimizeAboveBytes ?? LARGE_IMAGE_UPLOAD_OPTIMIZE_THRESHOLD_BYTES;
    const targetMaxBytes = options.targetMaxBytes ?? LARGE_IMAGE_UPLOAD_TARGET_BYTES;
    const maxWidth = options.maxWidth ?? 2048;
    const maxHeight = options.maxHeight ?? 2048;
    const outputType = options.outputType ?? 'image/jpeg';
    const qualitySteps = options.qualitySteps ?? [0.86, 0.78, 0.7];

    if (!file || !String(file.type || '').startsWith('image/') || file.size <= optimizeAboveBytes) {
        return file;
    }

    const FileReaderCtor = runtime.FileReader ?? globalThis.FileReader;
    const ImageCtor = runtime.Image ?? globalThis.Image;
    const documentRef = runtime.document ?? globalThis.document;
    const FileCtor = runtime.File ?? globalThis.File;

    if (typeof FileReaderCtor !== 'function' || typeof ImageCtor !== 'function' || !documentRef?.createElement) {
        return file;
    }

    try {
        const dataUrl = await readFileAsDataUrl(file, FileReaderCtor);
        const image = await loadImageElement(dataUrl, ImageCtor);
        const canvas = documentRef.createElement('canvas');
        const ctx = canvas?.getContext?.('2d');
        if (!ctx) return file;

        let width = image.width || maxWidth;
        let height = image.height || maxHeight;
        if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.max(1, Math.round(width * ratio));
            height = Math.max(1, Math.round(height * ratio));
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(image, 0, 0, width, height);

        let optimizedBlob = null;
        for (const quality of qualitySteps) {
            const blob = await canvasToBlob(canvas, outputType, quality);
            if (!blob) continue;
            optimizedBlob = blob;
            if (blob.size <= targetMaxBytes) break;
        }

        if (!optimizedBlob || optimizedBlob.size >= file.size) return file;

        const baseName = String(file.name || 'image').replace(/\.[^/.]+$/, '');
        const optimizedName = `${baseName}.jpg`;
        if (typeof FileCtor === 'function') {
            return new FileCtor([optimizedBlob], optimizedName, { type: optimizedBlob.type || outputType });
        }

        Object.defineProperty(optimizedBlob, 'name', {
            value: optimizedName,
            configurable: true,
        });
        return optimizedBlob;
    } catch {
        return file;
    }
}
