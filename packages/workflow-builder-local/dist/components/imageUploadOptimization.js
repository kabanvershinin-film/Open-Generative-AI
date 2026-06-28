"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MAX_WORKFLOW_IMAGE_UPLOAD_SIZE_BYTES = void 0;
exports.optimizeWorkflowImageUploadFile = optimizeWorkflowImageUploadFile;
exports.validateWorkflowImageUploadFile = validateWorkflowImageUploadFile;
var MAX_WORKFLOW_IMAGE_UPLOAD_SIZE_BYTES = exports.MAX_WORKFLOW_IMAGE_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
var WORKFLOW_LARGE_IMAGE_OPTIMIZE_THRESHOLD_BYTES = 2 * 1024 * 1024;
var WORKFLOW_LARGE_IMAGE_TARGET_BYTES = 1.8 * 1024 * 1024;
function readFileAsDataUrl(file, FileReaderCtor) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReaderCtor();
    reader.onerror = function () {
      return reject(new Error("Не удалось прочитать изображение перед загрузкой."));
    };
    reader.onload = function (event) {
      return resolve(event !== null && event !== void 0 && event.target ? event.target.result : reader.result);
    };
    reader.readAsDataURL(file);
  });
}
function loadImageElement(src, ImageCtor) {
  return new Promise(function (resolve, reject) {
    var image = new ImageCtor();
    image.onerror = function () {
      return reject(new Error("Не удалось подготовить изображение к загрузке."));
    };
    image.onload = function () {
      return resolve(image);
    };
    image.src = src;
  });
}
function canvasToBlob(canvas, type, quality) {
  return new Promise(function (resolve) {
    canvas.toBlob(function (blob) {
      return resolve(blob || null);
    }, type, quality);
  });
}
function validateWorkflowImageUploadFile(file) {
  if (!file) throw new Error("Файл изображения не выбран.");
  if (!String(file.type || "").startsWith("image/")) {
    throw new Error("Поддерживаются только изображения.");
  }
  if (file.size > MAX_WORKFLOW_IMAGE_UPLOAD_SIZE_BYTES) {
    throw new Error("Файл слишком большой. Максимальный размер — 50 МБ.");
  }
  return true;
}
async function optimizeWorkflowImageUploadFile(file) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var runtime = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var optimizeAboveBytes = options.optimizeAboveBytes ?? WORKFLOW_LARGE_IMAGE_OPTIMIZE_THRESHOLD_BYTES;
  var targetMaxBytes = options.targetMaxBytes ?? WORKFLOW_LARGE_IMAGE_TARGET_BYTES;
  var maxWidth = options.maxWidth ?? 1600;
  var maxHeight = options.maxHeight ?? 1600;
  var outputType = options.outputType ?? "image/jpeg";
  var qualitySteps = options.qualitySteps ?? [0.82, 0.74, 0.66];
  if (!file || !String(file.type || "").startsWith("image/")) return file;
  validateWorkflowImageUploadFile(file);
  if (file.size <= optimizeAboveBytes) return file;
  var FileReaderCtor = runtime.FileReader ?? globalThis.FileReader;
  var ImageCtor = runtime.Image ?? globalThis.Image;
  var documentRef = runtime.document ?? globalThis.document;
  var FileCtor = runtime.File ?? globalThis.File;
  if (typeof FileReaderCtor !== "function" || typeof ImageCtor !== "function" || !(documentRef !== null && documentRef !== void 0 && documentRef.createElement)) {
    return file;
  }
  try {
    var dataUrl = await readFileAsDataUrl(file, FileReaderCtor);
    var image = await loadImageElement(dataUrl, ImageCtor);
    var canvas = documentRef.createElement("canvas");
    var ctx = canvas === null || canvas === void 0 || (ctx = canvas.getContext) === null || ctx === void 0 ? void 0 : ctx.call(canvas, "2d");
    if (!ctx) return file;
    var width = image.width || maxWidth;
    var height = image.height || maxHeight;
    if (width > maxWidth || height > maxHeight) {
      var ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.max(1, Math.round(width * ratio));
      height = Math.max(1, Math.round(height * ratio));
    }
    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);
    var optimizedBlob = null;
    var _iterator = qualitySteps[Symbol.iterator](),
      _step;
    try {
      while (!(_step = _iterator.next()).done) {
        var quality = _step.value;
        var blob = await canvasToBlob(canvas, outputType, quality);
        if (!blob) continue;
        optimizedBlob = blob;
        if (blob.size <= targetMaxBytes) break;
      }
    } catch (err) {
      if (_iterator["return"]) _iterator["return"]();
      throw err;
    }
    if (!optimizedBlob || optimizedBlob.size >= file.size) return file;
    var baseName = String(file.name || "image").replace(/\.[^/.]+$/, "");
    var optimizedName = "".concat(baseName, ".jpg");
    if (typeof FileCtor === "function") {
      return new FileCtor([optimizedBlob], optimizedName, {
        type: optimizedBlob.type || outputType,
        lastModified: Date.now()
      });
    }
    Object.defineProperty(optimizedBlob, "name", {
      value: optimizedName,
      configurable: true
    });
    return optimizedBlob;
  } catch (_unused) {
    return file;
  }
}
