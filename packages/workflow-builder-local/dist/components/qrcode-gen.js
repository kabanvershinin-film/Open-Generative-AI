"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.generateQR = generateQR;
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
/* eslint-disable */
// QR Code generator — точная реализация qrcode-generator (Kazuhiko Arase, MIT).
// EC level L. Возвращает матрицу модулей для рендера. (TS→JS port из creator-club)

// ── QRMath ───────────────────────────────────────────────────────
var QRMath = function () {
  var EXP_TABLE = new Array(256);
  var LOG_TABLE = new Array(256);
  for (var i = 0; i < 8; i++) EXP_TABLE[i] = 1 << i;
  for (var _i = 8; _i < 256; _i++) EXP_TABLE[_i] = EXP_TABLE[_i - 4] ^ EXP_TABLE[_i - 5] ^ EXP_TABLE[_i - 6] ^ EXP_TABLE[_i - 8];
  for (var _i2 = 0; _i2 < 255; _i2++) LOG_TABLE[EXP_TABLE[_i2]] = _i2;
  return {
    glog: function glog(n) {
      if (n < 1) throw new Error('glog(' + n + ')');
      return LOG_TABLE[n];
    },
    gexp: function gexp(n) {
      while (n < 0) n += 255;
      while (n >= 256) n -= 255;
      return EXP_TABLE[n];
    }
  };
}();

// ── QRPolynomial ─────────────────────────────────────────────────
var QRPolynomial = /*#__PURE__*/function () {
  function QRPolynomial(num, shift) {
    _classCallCheck(this, QRPolynomial);
    var offset = 0;
    while (offset < num.length && num[offset] === 0) offset++;
    this.num = new Array(num.length - offset + shift);
    for (var i = 0; i < num.length - offset; i++) this.num[i] = num[i + offset];
  }
  return _createClass(QRPolynomial, [{
    key: "get",
    value: function get(i) {
      return this.num[i];
    }
  }, {
    key: "getLength",
    value: function getLength() {
      return this.num.length;
    }
  }, {
    key: "multiply",
    value: function multiply(e) {
      var num = new Array(this.getLength() + e.getLength() - 1).fill(0);
      for (var i = 0; i < this.getLength(); i++) for (var j = 0; j < e.getLength(); j++) num[i + j] ^= QRMath.gexp(QRMath.glog(this.get(i)) + QRMath.glog(e.get(j)));
      return new QRPolynomial(num, 0);
    }
  }, {
    key: "mod",
    value: function mod(e) {
      if (this.getLength() - e.getLength() < 0) return this;
      var ratio = QRMath.glog(this.get(0)) - QRMath.glog(e.get(0));
      var num = this.num.slice();
      for (var i = 0; i < e.getLength(); i++) num[i] ^= QRMath.gexp(QRMath.glog(e.get(i)) + ratio);
      return new QRPolynomial(num, 0).mod(e);
    }
  }]);
}(); // ── QRBitBuffer ──────────────────────────────────────────────────
var QRBitBuffer = /*#__PURE__*/function () {
  function QRBitBuffer() {
    _classCallCheck(this, QRBitBuffer);
    this.buffer = [];
    this.length = 0;
  }
  return _createClass(QRBitBuffer, [{
    key: "get",
    value: function get(index) {
      return (this.buffer[Math.floor(index / 8)] >>> 7 - index % 8 & 1) === 1;
    }
  }, {
    key: "put",
    value: function put(num, length) {
      for (var i = 0; i < length; i++) this.putBit((num >>> length - i - 1 & 1) === 1);
    }
  }, {
    key: "putBit",
    value: function putBit(bit) {
      var bufIndex = Math.floor(this.length / 8);
      if (this.buffer.length <= bufIndex) this.buffer.push(0);
      if (bit) this.buffer[bufIndex] |= 0x80 >>> this.length % 8;
      this.length++;
    }
  }]);
}(); // ── QRRSBlock (EC level L) — [count, totalCount, dataCount] версии 1..20 ──
var RS_BLOCK_TABLE_L = [[1, 26, 19], [1, 44, 34], [1, 70, 55], [1, 100, 80], [1, 134, 108], [2, 86, 68], [2, 98, 78], [2, 121, 97], [2, 146, 116], [2, 86, 68, 2, 87, 69], [4, 101, 81], [2, 116, 92, 2, 117, 93], [4, 133, 107], [3, 145, 115, 1, 146, 116], [5, 109, 87, 1, 110, 88], [5, 122, 98, 1, 123, 99], [1, 135, 107, 5, 136, 108], [5, 150, 120, 1, 151, 121], [3, 141, 113, 4, 142, 114], [3, 135, 107, 5, 136, 108]];
function getRSBlocks(version) {
  var table = RS_BLOCK_TABLE_L[version - 1];
  var list = [];
  for (var i = 0; i < table.length; i += 3) {
    var count = table[i],
      totalCount = table[i + 1],
      dataCount = table[i + 2];
    for (var j = 0; j < count; j++) list.push({
      totalCount: totalCount,
      dataCount: dataCount
    });
  }
  return list;
}

// ── QRUtil ───────────────────────────────────────────────────────
var PATTERN_POSITION_TABLE = [[], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90]];
var G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
var G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
var G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
function bchDigit(data) {
  var digit = 0;
  while (data !== 0) {
    digit++;
    data >>>= 1;
  }
  return digit;
}
function getBCHTypeInfo(data) {
  var d = data << 10;
  while (bchDigit(d) - bchDigit(G15) >= 0) d ^= G15 << bchDigit(d) - bchDigit(G15);
  return (data << 10 | d) ^ G15_MASK;
}
function getBCHTypeNumber(data) {
  var d = data << 12;
  while (bchDigit(d) - bchDigit(G18) >= 0) d ^= G18 << bchDigit(d) - bchDigit(G18);
  return data << 12 | d;
}
function getErrorCorrectPolynomial(ecLength) {
  var a = new QRPolynomial([1], 0);
  for (var i = 0; i < ecLength; i++) a = a.multiply(new QRPolynomial([1, QRMath.gexp(i)], 0));
  return a;
}
function getMask(i, j) {
  return (i + j) % 2 === 0;
}

// ── QRCodeModel ──────────────────────────────────────────────────
var PAD0 = 0xec,
  PAD1 = 0x11;
function generateQR(text) {
  var data = Array.from(new TextEncoder().encode(text));
  var version = 1;
  for (; version <= 20; version++) {
    var blocks = getRSBlocks(version);
    var totalData = 0;
    var _iterator = _createForOfIteratorHelper(blocks),
      _step;
    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var b = _step.value;
        totalData += b.dataCount;
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    var _lenBits = version < 10 ? 8 : 16;
    var need = Math.ceil((4 + _lenBits + data.length * 8) / 8);
    if (need <= totalData) break;
  }
  if (version > 20) throw new Error('Текст слишком длинный для QR');
  var rsBlocks = getRSBlocks(version);
  var buffer = new QRBitBuffer();
  buffer.put(4, 4);
  var lenBits = version < 10 ? 8 : 16;
  buffer.put(data.length, lenBits);
  for (var _i3 = 0, _data = data; _i3 < _data.length; _i3++) {
    var _b = _data[_i3];
    buffer.put(_b, 8);
  }
  var totalDataCount = 0;
  var _iterator2 = _createForOfIteratorHelper(rsBlocks),
    _step2;
  try {
    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
      var _b2 = _step2.value;
      totalDataCount += _b2.dataCount;
    }
  } catch (err) {
    _iterator2.e(err);
  } finally {
    _iterator2.f();
  }
  if (buffer.length + 4 <= totalDataCount * 8) buffer.put(0, 4);
  while (buffer.length % 8 !== 0) buffer.putBit(false);
  while (true) {
    if (buffer.length >= totalDataCount * 8) break;
    buffer.put(PAD0, 8);
    if (buffer.length >= totalDataCount * 8) break;
    buffer.put(PAD1, 8);
  }
  var offset = 0;
  var maxDcCount = 0,
    maxEcCount = 0;
  var dcdata = new Array(rsBlocks.length);
  var ecdata = new Array(rsBlocks.length);
  for (var r = 0; r < rsBlocks.length; r++) {
    var dcCount = rsBlocks[r].dataCount;
    var ecCount = rsBlocks[r].totalCount - dcCount;
    maxDcCount = Math.max(maxDcCount, dcCount);
    maxEcCount = Math.max(maxEcCount, ecCount);
    dcdata[r] = new Array(dcCount);
    for (var i = 0; i < dcCount; i++) dcdata[r][i] = 0xff & buffer.buffer[i + offset];
    offset += dcCount;
    var rsPoly = getErrorCorrectPolynomial(ecCount);
    var rawPoly = new QRPolynomial(dcdata[r], rsPoly.getLength() - 1);
    var modPoly = rawPoly.mod(rsPoly);
    ecdata[r] = new Array(rsPoly.getLength() - 1);
    for (var _i4 = 0; _i4 < ecdata[r].length; _i4++) {
      var modIndex = _i4 + modPoly.getLength() - ecdata[r].length;
      ecdata[r][_i4] = modIndex >= 0 ? modPoly.get(modIndex) : 0;
    }
  }
  var totalCodeCount = 0;
  var _iterator3 = _createForOfIteratorHelper(rsBlocks),
    _step3;
  try {
    for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
      var _b3 = _step3.value;
      totalCodeCount += _b3.totalCount;
    }
  } catch (err) {
    _iterator3.e(err);
  } finally {
    _iterator3.f();
  }
  var dataArr = new Array(totalCodeCount);
  var index = 0;
  for (var _i5 = 0; _i5 < maxDcCount; _i5++) for (var _r = 0; _r < rsBlocks.length; _r++) if (_i5 < dcdata[_r].length) dataArr[index++] = dcdata[_r][_i5];
  for (var _i6 = 0; _i6 < maxEcCount; _i6++) for (var _r2 = 0; _r2 < rsBlocks.length; _r2++) if (_i6 < ecdata[_r2].length) dataArr[index++] = ecdata[_r2][_i6];
  var moduleCount = version * 4 + 17;
  var modules = Array.from({
    length: moduleCount
  }, function () {
    return new Array(moduleCount).fill(null);
  });
  var setupProbe = function setupProbe(row, col) {
    for (var _r3 = -1; _r3 <= 7; _r3++) {
      if (row + _r3 <= -1 || moduleCount <= row + _r3) continue;
      for (var c = -1; c <= 7; c++) {
        if (col + c <= -1 || moduleCount <= col + c) continue;
        modules[row + _r3][col + c] = 0 <= _r3 && _r3 <= 6 && (c === 0 || c === 6) || 0 <= c && c <= 6 && (_r3 === 0 || _r3 === 6) || 2 <= _r3 && _r3 <= 4 && 2 <= c && c <= 4;
      }
    }
  };
  setupProbe(0, 0);
  setupProbe(moduleCount - 7, 0);
  setupProbe(0, moduleCount - 7);
  var pos = PATTERN_POSITION_TABLE[version - 1];
  for (var _i7 = 0; _i7 < pos.length; _i7++) for (var j = 0; j < pos.length; j++) {
    var _row = pos[_i7],
      col = pos[j];
    if (modules[_row][col] !== null) continue;
    for (var _r4 = -2; _r4 <= 2; _r4++) for (var c = -2; c <= 2; c++) modules[_row + _r4][col + c] = _r4 === -2 || _r4 === 2 || c === -2 || c === 2 || _r4 === 0 && c === 0;
  }
  for (var _r5 = 8; _r5 < moduleCount - 8; _r5++) if (modules[_r5][6] === null) modules[_r5][6] = _r5 % 2 === 0;
  for (var _c = 8; _c < moduleCount - 8; _c++) if (modules[6][_c] === null) modules[6][_c] = _c % 2 === 0;
  var typeInfoBits = getBCHTypeInfo(1 << 3 | 0);
  for (var _i8 = 0; _i8 < 15; _i8++) {
    var mod = (typeInfoBits >> _i8 & 1) === 1;
    if (_i8 < 6) modules[_i8][8] = mod;else if (_i8 < 8) modules[_i8 + 1][8] = mod;else modules[moduleCount - 15 + _i8][8] = mod;
    if (_i8 < 8) modules[8][moduleCount - _i8 - 1] = mod;else if (_i8 < 9) modules[8][15 - _i8 - 1 + 1] = mod;else modules[8][15 - _i8 - 1] = mod;
  }
  modules[moduleCount - 8][8] = true;
  if (version >= 7) {
    var bits = getBCHTypeNumber(version);
    for (var _i9 = 0; _i9 < 18; _i9++) {
      var _mod = (bits >> _i9 & 1) === 1;
      modules[Math.floor(_i9 / 3)][_i9 % 3 + moduleCount - 8 - 3] = _mod;
      modules[_i9 % 3 + moduleCount - 8 - 3][Math.floor(_i9 / 3)] = _mod;
    }
  }
  var inc = -1;
  var row = moduleCount - 1;
  var bitIndex = 7;
  var byteIndex = 0;
  for (var _col = moduleCount - 1; _col > 0; _col -= 2) {
    if (_col === 6) _col--;
    while (true) {
      for (var _c2 = 0; _c2 < 2; _c2++) {
        if (modules[row][_col - _c2] === null) {
          var dark = false;
          if (byteIndex < dataArr.length) dark = (dataArr[byteIndex] >>> bitIndex & 1) === 1;
          if (getMask(row, _col - _c2)) dark = !dark;
          modules[row][_col - _c2] = dark;
          bitIndex--;
          if (bitIndex === -1) {
            byteIndex++;
            bitIndex = 7;
          }
        }
      }
      row += inc;
      if (row < 0 || moduleCount <= row) {
        row -= inc;
        inc = -inc;
        break;
      }
    }
  }
  var out = modules.map(function (r) {
    return r.map(function (v) {
      return v === true;
    });
  });
  return {
    size: moduleCount,
    modules: out
  };
}