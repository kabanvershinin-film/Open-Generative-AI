"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stableStringify = stableStringify;
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function stableStringify(obj) {
  var _normalize = function normalize(value) {
    if (Array.isArray(value)) return value.map(_normalize);
    if (value && _typeof(value) === "object") {
      return Object.keys(value).sort().reduce(function (acc, key) {
        acc[key] = _normalize(value[key]);
        return acc;
      }, {});
    }
    return value;
  };
  try {
    return JSON.stringify(_normalize(obj));
  } catch (_unused) {
    return "";
  }
}