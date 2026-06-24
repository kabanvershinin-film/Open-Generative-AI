"use strict";

var _nodeTest = _interopRequireDefault(require("node:test"));
var _strict = _interopRequireDefault(require("node:assert/strict"));
var _imageModels = require("../model-registry/imageModels.js");
var _videoModels = require("../model-registry/videoModels.js");
var _textModels = require("../model-registry/textModels.js");
var _audioModels = require("../model-registry/audioModels.js");
var _concatModels = require("../model-registry/concatModels.js");
var _videoCombinerModels = require("../model-registry/videoCombinerModels.js");
var _apiNodeModels = require("../model-registry/apiNodeModels.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function assertUniqueIds(models, name) {
  var ids = models.map(function (model) {
    return model.id;
  });
  _strict["default"].strictEqual(new Set(ids).size, ids.length, "".concat(name, ": duplicate ids found"));
}
(0, _nodeTest["default"])('model registries keep unique ids and stay populated', function () {
  var registries = {
    imageModels: _imageModels.imageModels,
    videoModels: _videoModels.videoModels,
    textModels: _textModels.textModels,
    audioModels: _audioModels.audioModels,
    concatModels: _concatModels.concatModels,
    videoCombinerModels: _videoCombinerModels.videoCombinerModels,
    apiNodeModels: _apiNodeModels.apiNodeModels
  };
  for (var _i = 0, _Object$entries = Object.entries(registries); _i < _Object$entries.length; _i++) {
    var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
      name = _Object$entries$_i[0],
      models = _Object$entries$_i[1];
    _strict["default"].ok(Array.isArray(models), "".concat(name, " must be an array"));
    _strict["default"].ok(models.length > 0, "".concat(name, " must not be empty"));
    assertUniqueIds(models, name);
  }
});
(0, _nodeTest["default"])('passthrough registries require the correct input fields', function () {
  var imagePassthrough = _imageModels.imageModels.find(function (model) {
    return model.id === 'image-passthrough';
  });
  var videoPassthrough = _videoModels.videoModels.find(function (model) {
    return model.id === 'video-passthrough';
  });
  var textPassthrough = _textModels.textModels.find(function (model) {
    return model.id === 'text-passthrough';
  });
  var audioPassthrough = _audioModels.audioModels.find(function (model) {
    return model.id === 'audio-passthrough';
  });
  _strict["default"].deepStrictEqual(imagePassthrough.input_params.required, ['image_url']);
  _strict["default"].deepStrictEqual(videoPassthrough.input_params.required, ['video_url']);
  _strict["default"].deepStrictEqual(textPassthrough.input_params.required, ['prompt']);
  _strict["default"].deepStrictEqual(audioPassthrough.input_params.required, ['audio_url']);
});
(0, _nodeTest["default"])('workflow builder utility registries keep expected key models', function () {
  _strict["default"].ok(_imageModels.imageModels.find(function (model) {
    return model.id === 'wan2.5-text-to-image';
  }));
  _strict["default"].ok(_videoModels.videoModels.find(function (model) {
    return model.id === 'seedance-lite-i2v';
  }));
  _strict["default"].ok(_concatModels.concatModels.find(function (model) {
    return model.id === 'prompt-concatenator';
  }));
  _strict["default"].ok(_videoCombinerModels.videoCombinerModels.find(function (model) {
    return model.id === 'video-combiner';
  }));
  _strict["default"].ok(_apiNodeModels.apiNodeModels.find(function (model) {
    return model.id === 'wavespeed';
  }));
});