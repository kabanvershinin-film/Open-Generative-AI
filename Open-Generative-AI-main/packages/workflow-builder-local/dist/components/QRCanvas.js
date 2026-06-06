"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = QRCanvas;
var _react = _interopRequireWildcard(require("react"));
var _qrcodeGen = require("./qrcode-gen");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
/** Рендерит QR-код локально на canvas (без внешних сервисов). */
function QRCanvas(_ref) {
  var value = _ref.value,
    _ref$size = _ref.size,
    size = _ref$size === void 0 ? 220 : _ref$size;
  var ref = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    var canvas = ref.current;
    if (!canvas || !value) return;
    try {
      var _generateQR = (0, _qrcodeGen.generateQR)(value),
        n = _generateQR.size,
        modules = _generateQR.modules;
      var margin = 4; // тихая зона в модулях
      var total = n + margin * 2;
      var scale = Math.max(1, Math.floor(size / total));
      var px = scale * total;
      canvas.width = px;
      canvas.height = px;
      var ctx = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, px, px);
      ctx.fillStyle = "#000000";
      for (var r = 0; r < n; r++) {
        for (var c = 0; c < n; c++) {
          if (modules[r][c]) {
            ctx.fillRect((c + margin) * scale, (r + margin) * scale, scale, scale);
          }
        }
      }
    } catch (e) {
      console.error("QR render failed:", e);
    }
  }, [value, size]);
  return /*#__PURE__*/_react["default"].createElement("canvas", {
    ref: ref,
    style: {
      width: size,
      height: size,
      imageRendering: "pixelated"
    }
  });
}
