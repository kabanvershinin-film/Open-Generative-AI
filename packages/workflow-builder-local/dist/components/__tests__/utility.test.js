"use strict";

var _nodeTest = _interopRequireDefault(require("node:test"));
var _strict = _interopRequireDefault(require("node:assert/strict"));
var _stableStringify = require("../stableStringify.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
(0, _nodeTest["default"])('stableStringify sorts keys and handles nested objects', function () {
  var obj1 = {
    b: 2,
    a: 1,
    c: {
      y: 2,
      x: 1
    }
  };
  var obj2 = {
    a: 1,
    b: 2,
    c: {
      x: 1,
      y: 2
    }
  };
  var str1 = (0, _stableStringify.stableStringify)(obj1);
  var str2 = (0, _stableStringify.stableStringify)(obj2);
  _strict["default"].strictEqual(str1, str2);
  _strict["default"].strictEqual(str1, '{"a":1,"b":2,"c":{"x":1,"y":2}}');
});
(0, _nodeTest["default"])('stableStringify handles arrays', function () {
  var obj = {
    list: [3, 1, 2],
    b: 1
  };
  var str = (0, _stableStringify.stableStringify)(obj);
  // It doesn't sort arrays, only object keys
  _strict["default"].strictEqual(str, '{"b":1,"list":[3,1,2]}');
});