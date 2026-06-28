export const MAX_WORKFLOW_IMAGE_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
export const WORKFLOW_LARGE_IMAGE_OPTIMIZE_THRESHOLD_BYTES = 2 * 1024 * 1024;
export const WORKFLOW_LARGE_IMAGE_TARGET_BYTES = 1.8 * 1024 * 1024;

function readFileAsDataUrl(file, FileReaderCtor) {
  return new Promise((resolve, reject) => {
    const reader = new FileReaderCtor();
    reader.onerror = () => reject(new Error("Не удалось прочитать изображение перед загрузкой."));
    reader.onload = (event) => resolve(event?.target?.result || reader.result);
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src, ImageCtor) {
  return new Promise((resolve, reject) => {
    const image = new ImageCtor();
    image.onerror = () => reject(new Error("Не удалось подготовить изображение к загрузке."));
    image.onload = () => resolve(image);
    image.src = src;
  });
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob || null), type, quality);
  });
}

export function validateWorkflowImageUploadFile(file) {
  if (!file) throw new Error("Файл изображения не выбран.");
  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("Поддерживаются только изображения.");
  }
  if (file.size > MAX_WORKFLOW_IMAGE_UPLOAD_SIZE_BYTES) {
    throw new Error("Файл слишком большой. Максимальный размер — 50 МБ.");
  }
  return true;
}

export async function optimizeWorkflowImageUploadFile(file, options = {}, runtime = {}) {
  const optimizeAboveBytes = options.optimizeAboveBytes ?? WORKFLOW_LARGE_IMAGE_OPTIMIZE_THRESHOLD_BYTES;
  const targetMaxBytes = options.targetMaxBytes ?? WORKFLOW_LARGE_IMAGE_TARGET_BYTES;
  const maxWidth = options.maxWidth ?? 1600;
  const maxHeight = options.maxHeight ?? 1600;
  const outputType = options.outputType ?? "image/jpeg";
  const qualitySteps = options.qualitySteps ?? [0.82, 0.74, 0.66];

  if (!file || !String(file.type || "").startsWith("image/")) return file;
  validateWorkflowImageUploadFile(file);
  if (file.size <= optimizeAboveBytes) return file;

  const FileReaderCtor = runtime.FileReader ?? globalThis.FileReader;
  const ImageCtor = runtime.Image ?? globalThis.Image;
  const documentRef = runtime.document ?? globalThis.document;
  const FileCtor = runtime.File ?? globalThis.File;

  if (typeof FileReaderCtor !== "function" || typeof ImageCtor !== "function" || !documentRef?.createElement) {
    return file;
  }

  try {
    const dataUrl = await readFileAsDataUrl(file, FileReaderCtor);
    const image = await loadImageElement(dataUrl, ImageCtor);
    const canvas = documentRef.createElement("canvas");
    const ctx = canvas?.getContext?.("2d");
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

    const baseName = String(file.name || "image").replace(/\.[^/.]+$/, "");
    const optimizedName = `${baseName}.jpg`;
    if (typeof FileCtor === "function") {
      return new FileCtor([optimizedBlob], optimizedName, {
        type: optimizedBlob.type || outputType,
        lastModified: Date.now(),
      });
    }

    Object.defineProperty(optimizedBlob, "name", {
      value: optimizedName,
      configurable: true,
    });
    return optimizedBlob;
  } catch {
    return file;
  }
}
