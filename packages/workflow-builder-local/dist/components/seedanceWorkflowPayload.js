"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildSeedanceWorkflowBody = buildSeedanceWorkflowBody;
exports.buildSeedanceWorkflowImages = buildSeedanceWorkflowImages;
exports.ensureSeedanceFaceTags = ensureSeedanceFaceTags;
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function normalizeImageValue(image) {
  if (!image) return null;
  if (typeof image === "string") return {
    url: image
  };
  if (image.url) return _objectSpread({}, image);
  return null;
}
function isAssetUri(value) {
  return typeof value === "string" && value.startsWith("asset://");
}
function dedupeImages(images) {
  var seen = new Set();
  var result = [];
  var _iterator = _createForOfIteratorHelper(images),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var image = _step.value;
      if (!(image !== null && image !== void 0 && image.url)) continue;
      var key = image.url;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(image);
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return result;
}
function buildSeedanceWorkflowImages(_ref) {
  var _ref$connectedImages = _ref.connectedImages,
    connectedImages = _ref$connectedImages === void 0 ? [] : _ref$connectedImages,
    _ref$connectedFaceAss = _ref.connectedFaceAssets,
    connectedFaceAssets = _ref$connectedFaceAss === void 0 ? [] : _ref$connectedFaceAss,
    imageUrl = _ref.imageUrl;
  var normalizedImages = connectedImages.map(function (image) {
    return normalizeImageValue(image);
  }).filter(Boolean);
  var finalImages = [];
  finalImages.push.apply(finalImages, _toConsumableArray(connectedFaceAssets.map(function (face) {
    return face !== null && face !== void 0 && face.uri ? {
      url: face.uri,
      thumbnail: face.thumbnail || null
    } : null;
  }).filter(Boolean)));
  finalImages.push.apply(finalImages, _toConsumableArray(normalizedImages));
  var normalizedImageUrl = normalizeImageValue(imageUrl);
  if (normalizedImageUrl) {
    finalImages.push(normalizedImageUrl);
  }
  return dedupeImages(finalImages);
}
function ensureSeedanceFaceTags(prompt, images) {
  var faceCount = images.filter(function (image) {
    return isAssetUri(image === null || image === void 0 ? void 0 : image.url);
  }).length;
  if (faceCount === 0) return prompt || "";
  var tagsToAdd = [];
  for (var index = 1; index <= faceCount; index += 1) {
    var tag = "\u56FE\u7247".concat(index);
    var tagRegex = new RegExp(tag, "i");
    if (!tagRegex.test(prompt || "")) {
      tagsToAdd.push(tag);
    }
  }
  if (tagsToAdd.length === 0) return prompt || "";
  return "".concat(prompt || "").concat(prompt ? " " : "").concat(tagsToAdd.join(" "));
}
function buildSeedanceWorkflowBody(_ref2) {
  var fast = _ref2.fast,
    prompt = _ref2.prompt,
    _ref2$connectedImages = _ref2.connectedImages,
    connectedImages = _ref2$connectedImages === void 0 ? [] : _ref2$connectedImages,
    _ref2$connectedFaceAs = _ref2.connectedFaceAssets,
    connectedFaceAssets = _ref2$connectedFaceAs === void 0 ? [] : _ref2$connectedFaceAs,
    _ref2$uniqueVideos = _ref2.uniqueVideos,
    uniqueVideos = _ref2$uniqueVideos === void 0 ? [] : _ref2$uniqueVideos,
    _ref2$uniqueAudios = _ref2.uniqueAudios,
    uniqueAudios = _ref2$uniqueAudios === void 0 ? [] : _ref2$uniqueAudios,
    _ref2$formValues = _ref2.formValues,
    formValues = _ref2$formValues === void 0 ? {} : _ref2$formValues;
  var finalImages = buildSeedanceWorkflowImages({
    connectedImages: connectedImages,
    connectedFaceAssets: connectedFaceAssets,
    imageUrl: formValues.image_url
  });
  return {
    fast: fast,
    prompt: ensureSeedanceFaceTags(prompt || formValues.prompt || "", finalImages),
    image_urls: finalImages.length > 0 ? finalImages : undefined,
    video_url: uniqueVideos[0] || formValues.video_url || undefined,
    video_urls: uniqueVideos.length > 1 ? uniqueVideos.slice(1) : undefined,
    audio_url: uniqueAudios[0] || formValues.audio_url || undefined,
    audio_urls: uniqueAudios.length > 1 ? uniqueAudios.slice(1) : undefined,
    resolution: formValues.resolution || undefined,
    ratio: formValues.aspect_ratio || formValues.ratio || undefined,
    duration: formValues.duration || undefined
  };
}