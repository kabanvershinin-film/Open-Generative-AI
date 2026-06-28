"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.appendUploadUrls = appendUploadUrls;
exports.getDisplayUploadUrls = getDisplayUploadUrls;
exports.normalizeUploadUrls = normalizeUploadUrls;
exports.removeUploadUrl = removeUploadUrl;
exports.replaceUploadUrl = replaceUploadUrl;
function normalizeUploadUrls(value) {
  if (Array.isArray(value)) {
    return value.filter(function (item) {
      return typeof item === "string" && item.trim();
    });
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  return [];
}
function getDisplayUploadUrls(previewUrls, uploadedValue) {
  var preview = normalizeUploadUrls(previewUrls);
  if (preview.length > 0) return preview;
  return normalizeUploadUrls(uploadedValue);
}
function appendUploadUrls(currentUrls, nextUrls) {
  var maxItems = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
  var current = normalizeUploadUrls(currentUrls);
  var incoming = normalizeUploadUrls(nextUrls);
  var limit = Math.max(1, Number(maxItems) || 1);
  var merged = limit === 1 ? incoming.slice(0, 1) : current.concat(incoming);
  return Array.from(new Set(merged)).slice(0, limit);
}
function replaceUploadUrl(currentUrls, previousUrl, nextUrl) {
  var current = normalizeUploadUrls(currentUrls);
  if (!previousUrl || typeof nextUrl !== "string" || !nextUrl.trim()) return current;
  return current.map(function (url) {
    return url === previousUrl ? nextUrl : url;
  });
}
function removeUploadUrl(currentUrls, targetUrl) {
  var current = normalizeUploadUrls(currentUrls);
  if (!targetUrl) return current;
  return current.filter(function (url) {
    return url !== targetUrl;
  });
}
