"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = FaceRegistrationDialog;
var _react = require("react");
var _reactHotToast = require("react-hot-toast");
var _fa = require("react-icons/fa");
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function FaceRegistrationDialog(_ref) {
  var open = _ref.open,
    onClose = _ref.onClose,
    onRegistered = _ref.onRegistered;
  var _useState = (0, _react.useState)('name'),
    _useState2 = _slicedToArray(_useState, 2),
    step = _useState2[0],
    setStep = _useState2[1]; // 'name' | 'verify' | 'photo' | 'processing' | 'done'
  var _useState3 = (0, _react.useState)(''),
    _useState4 = _slicedToArray(_useState3, 2),
    displayName = _useState4[0],
    setDisplayName = _useState4[1];
  var _useState5 = (0, _react.useState)(false),
    _useState6 = _slicedToArray(_useState5, 2),
    busy = _useState6[0],
    setBusy = _useState6[1];
  var _useState7 = (0, _react.useState)(''),
    _useState8 = _slicedToArray(_useState7, 2),
    statusText = _useState8[0],
    setStatusText = _useState8[1];
  var _useState9 = (0, _react.useState)(''),
    _useState0 = _slicedToArray(_useState9, 2),
    groupId = _useState0[0],
    setGroupId = _useState0[1];
  var _useState1 = (0, _react.useState)(''),
    _useState10 = _slicedToArray(_useState1, 2),
    assetUri = _useState10[0],
    setAssetUri = _useState10[1];
  var _useState11 = (0, _react.useState)(null),
    _useState12 = _slicedToArray(_useState11, 2),
    photo = _useState12[0],
    setPhoto = _useState12[1];
  var _useState13 = (0, _react.useState)(''),
    _useState14 = _slicedToArray(_useState13, 2),
    h5Link = _useState14[0],
    setH5Link = _useState14[1];
  var _useState15 = (0, _react.useState)(''),
    _useState16 = _slicedToArray(_useState15, 2),
    qrUrl = _useState16[0],
    setQrUrl = _useState16[1];
  var fileRef = (0, _react.useRef)(null);
  var cancelPollRef = (0, _react.useRef)(false);
  var reset = function reset() {
    cancelPollRef.current = true;
    setStep('name');
    setDisplayName('');
    setBusy(false);
    setStatusText('');
    setGroupId('');
    setAssetUri('');
    setPhoto(null);
    setH5Link('');
    setQrUrl('');
  };
  var startVerification = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var resp, json, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (displayName.trim()) {
              _context.n = 1;
              break;
            }
            _reactHotToast.toast.error('Введите имя');
            return _context.a(2);
          case 1:
            cancelPollRef.current = false;
            setBusy(true);
            setStatusText('Создаём сессию верификации…');
            _context.p = 2;
            _context.n = 3;
            return fetch('/api/face/create-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                callbackUrl: "".concat(window.location.origin, "/api/face/callback")
              })
            });
          case 3:
            resp = _context.v;
            _context.n = 4;
            return resp.json();
          case 4:
            json = _context.v;
            if (!(!resp.ok || !json.h5Link)) {
              _context.n = 5;
              break;
            }
            throw new Error(json.error || 'Не удалось создать сессию');
          case 5:
            setH5Link(json.h5Link);
            setQrUrl(json.shortUrl || json.h5Link);
            setStep('verify');
            setBusy(false);
            setStatusText('');

            // Запускаем поллинг результата
            pollGroup(json.bytedToken);
            _context.n = 7;
            break;
          case 6:
            _context.p = 6;
            _t = _context.v;
            _reactHotToast.toast.error(_t.message || 'Ошибка');
            setBusy(false);
            setStep('name');
          case 7:
            return _context.a(2);
        }
      }, _callee, null, [[2, 6]]);
    }));
    return function startVerification() {
      return _ref2.apply(this, arguments);
    };
  }();
  var pollGroup = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(bytedToken) {
      var i, resp, json, _t2;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            i = 0;
          case 1:
            if (!(i < 40)) {
              _context2.n = 10;
              break;
            }
            if (!cancelPollRef.current) {
              _context2.n = 2;
              break;
            }
            return _context2.a(2);
          case 2:
            _context2.n = 3;
            return new Promise(function (r) {
              return setTimeout(r, 3000);
            });
          case 3:
            if (!cancelPollRef.current) {
              _context2.n = 4;
              break;
            }
            return _context2.a(2);
          case 4:
            _context2.p = 4;
            _context2.n = 5;
            return fetch('/api/face/get-group', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                bytedToken: bytedToken
              })
            });
          case 5:
            resp = _context2.v;
            _context2.n = 6;
            return resp.json();
          case 6:
            json = _context2.v;
            if (!json.groupId) {
              _context2.n = 7;
              break;
            }
            setGroupId(json.groupId);
            setStep('photo');
            setStatusText('Загрузите фото этого человека (анфас, лицо крупно)');
            return _context2.a(2);
          case 7:
            _context2.n = 9;
            break;
          case 8:
            _context2.p = 8;
            _t2 = _context2.v;
          case 9:
            i++;
            _context2.n = 1;
            break;
          case 10:
            _reactHotToast.toast.error('Время верификации истекло. Начните заново.');
            setStep('name');
          case 11:
            return _context2.a(2);
        }
      }, _callee2, null, [[4, 8]]);
    }));
    return function pollGroup(_x) {
      return _ref3.apply(this, arguments);
    };
  }();
  var onPickPhoto = function onPickPhoto(file) {
    if (!file.type.startsWith('image/')) {
      _reactHotToast.toast.error('Нужно изображение');
      return;
    }
    var reader = new FileReader();
    reader.onload = function (e) {
      var _e$target;
      return setPhoto((_e$target = e.target) === null || _e$target === void 0 ? void 0 : _e$target.result);
    };
    reader.readAsDataURL(file);
  };
  var uploadAndCreateAsset = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
      var _arr$0$match, arr, mime, bstr, u8, i, blob, ext, uploadResp, uploadData, tosResp, publicUrl, caResp, caJson, assetId, _i, gaResp, gaJson, uri, _t3;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            if (!(!photo || !groupId)) {
              _context3.n = 1;
              break;
            }
            return _context3.a(2);
          case 1:
            setBusy(true);
            setStep('processing');
            setStatusText('Загружаем фото…');
            _context3.p = 2;
            // Convert data URL to blob
            arr = photo.split(',');
            mime = ((_arr$0$match = arr[0].match(/:(.*?);/)) === null || _arr$0$match === void 0 ? void 0 : _arr$0$match[1]) || 'image/jpeg';
            bstr = atob(arr[1]);
            u8 = new Uint8Array(bstr.length);
            for (i = 0; i < bstr.length; i++) u8[i] = bstr.charCodeAt(i);
            blob = new Blob([u8], {
              type: mime
            }); // Upload to TOS
            ext = mime.split('/')[1] || 'jpg';
            _context3.n = 3;
            return fetch("/api/upload-file?filename=face.".concat(ext, "&type=").concat(encodeURIComponent(mime)));
          case 3:
            uploadResp = _context3.v;
            _context3.n = 4;
            return uploadResp.json();
          case 4:
            uploadData = _context3.v;
            if (uploadData.putUrl) {
              _context3.n = 5;
              break;
            }
            throw new Error('Не удалось получить URL загрузки');
          case 5:
            _context3.n = 6;
            return fetch(uploadData.putUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': mime
              },
              body: blob
            });
          case 6:
            tosResp = _context3.v;
            if (tosResp.ok) {
              _context3.n = 7;
              break;
            }
            throw new Error('Не удалось загрузить фото');
          case 7:
            // Get public URL
            publicUrl = uploadData.publicUrl;
            setStatusText('Регистрируем лицо в Volcano ARK…');
            _context3.n = 8;
            return fetch('/api/face/create-asset', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                groupId: groupId,
                url: publicUrl,
                assetType: 'Image',
                name: displayName.trim()
              })
            });
          case 8:
            caResp = _context3.v;
            _context3.n = 9;
            return caResp.json();
          case 9:
            caJson = _context3.v;
            if (!(!caResp.ok || !caJson.assetId)) {
              _context3.n = 10;
              break;
            }
            throw new Error(caJson.error || 'Не удалось создать ассет');
          case 10:
            assetId = caJson.assetId;
            setStatusText('Обрабатываем (сверка лица)…');
            _i = 0;
          case 11:
            if (!(_i < 30)) {
              _context3.n = 17;
              break;
            }
            _context3.n = 12;
            return new Promise(function (r) {
              return setTimeout(r, 4000);
            });
          case 12:
            _context3.n = 13;
            return fetch('/api/face/get-asset', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                assetId: assetId
              })
            });
          case 13:
            gaResp = _context3.v;
            _context3.n = 14;
            return gaResp.json();
          case 14:
            gaJson = _context3.v;
            if (!(gaJson.status === 'Active')) {
              _context3.n = 15;
              break;
            }
            uri = "asset://".concat(assetId);
            setAssetUri(uri);
            setStep('done');
            setStatusText('');
            setBusy(false);
            onRegistered === null || onRegistered === void 0 || onRegistered(uri, displayName.trim());
            _reactHotToast.toast.success('Лицо зарегистрировано!');
            return _context3.a(2);
          case 15:
            if (!(gaJson.status === 'Failed')) {
              _context3.n = 16;
              break;
            }
            throw new Error('ARK отклонил фото: лицо не совпадает или несколько лиц на фото.');
          case 16:
            _i++;
            _context3.n = 11;
            break;
          case 17:
            throw new Error('Обработка слишком долгая, попробуйте позже.');
          case 18:
            _context3.p = 18;
            _t3 = _context3.v;
            _reactHotToast.toast.error(_t3.message || 'Ошибка');
            setBusy(false);
            setStep('photo');
          case 19:
            return _context3.a(2);
        }
      }, _callee3, null, [[2, 18]]);
    }));
    return function uploadAndCreateAsset() {
      return _ref4.apply(this, arguments);
    };
  }();
  var handleClose = (0, _react.useCallback)(function () {
    if (busy) return;
    reset();
    onClose();
  }, [busy, onClose]);
  (0, _react.useEffect)(function () {
    if (!open) reset();
  }, [open]);
  if (!open) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4",
    onClick: handleClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4",
    onClick: function onClick(e) {
      return e.stopPropagation();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement(_fa.FaRegSmile, {
    className: "h-5 w-5 text-[#22d3ee]"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-semibold text-white"
  }, "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F \u043B\u0438\u0446\u0430")), /*#__PURE__*/React.createElement("button", {
    onClick: handleClose,
    disabled: busy,
    className: "text-white/40 hover:text-white disabled:opacity-40"
  }, /*#__PURE__*/React.createElement(_fa.FaTimes, {
    className: "h-5 w-5"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, ['name', 'verify', 'photo', 'done'].map(function (s) {
    var order = ['name', 'verify', 'photo', 'processing', 'done'];
    var active = order.indexOf(step) >= order.indexOf(s);
    return /*#__PURE__*/React.createElement("div", {
      key: s,
      className: "h-1 flex-1 rounded-full ".concat(active ? 'bg-[#22d3ee]' : 'bg-white/10')
    });
  })), step === 'name' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-white/60 leading-relaxed"
  }, "Seedance 2.0 \u0440\u0430\u0437\u0440\u0435\u0448\u0430\u0435\u0442 \u043E\u0436\u0438\u0432\u043B\u044F\u0442\u044C \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u0435 \u043B\u0438\u0446\u0430 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0441\u043B\u0435 ", /*#__PURE__*/React.createElement("b", null, "\u0432\u0435\u0440\u0438\u0444\u0438\u043A\u0430\u0446\u0438\u0438 \u0436\u0438\u0432\u043E\u0433\u043E \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430"), ". \u042D\u0442\u043E \u0437\u0430\u0439\u043C\u0435\u0442 ~1 \u043C\u0438\u043D\u0443\u0442\u0443: \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u043B\u0438\u0446\u0430 (\u0441\u0435\u043B\u0444\u0438) \u2192 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u0444\u043E\u0442\u043E \u2192 \u0433\u043E\u0442\u043E\u0432\u043E."), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs text-white/50 mb-1"
  }, "\u0418\u043C\u044F \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430"), /*#__PURE__*/React.createElement("input", {
    value: displayName,
    onChange: function onChange(e) {
      return setDisplayName(e.target.value);
    },
    placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u042F \u0441\u0430\u043C",
    className: "w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#22d3ee]"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: startVerification,
    disabled: busy || !displayName.trim(),
    className: "w-full py-3 bg-gradient-to-r from-[#22d3ee] to-[#a855f7] hover:from-[#06b6d4] hover:to-[#9333ea] disabled:opacity-50 text-black font-medium rounded-xl transition-all flex items-center justify-center gap-2"
  }, busy ? /*#__PURE__*/React.createElement(_fa.FaSpinner, {
    className: "h-4 w-4 animate-spin"
  }) : /*#__PURE__*/React.createElement(_fa.FaQrcode, {
    className: "h-4 w-4"
  }), busy ? statusText : 'Начать верификацию')), step === 'verify' && /*#__PURE__*/React.createElement("div", {
    className: "py-2 text-center space-y-3"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-medium text-white"
  }, "\u041E\u0442\u0441\u043A\u0430\u043D\u0438\u0440\u0443\u0439\u0442\u0435 QR-\u043A\u043E\u0434 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u043E\u043C"), qrUrl && /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-3 rounded-xl inline-block mx-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-[220px] h-[220px] bg-white flex items-center justify-center text-center text-xs text-gray-400"
  }, "QR: ", qrUrl.slice(0, 30), "...")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-center gap-2 text-xs text-[#22d3ee]"
  }, /*#__PURE__*/React.createElement(_fa.FaSpinner, {
    className: "h-3.5 w-3.5 animate-spin"
  }), "\u041E\u0436\u0438\u0434\u0430\u0435\u043C \u043F\u0440\u043E\u0445\u043E\u0436\u0434\u0435\u043D\u0438\u0435 \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438\u2026"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-white/50 leading-relaxed"
  }, "\u041D\u0430\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u0430\u043C\u0435\u0440\u0443 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0430 \u043D\u0430 QR-\u043A\u043E\u0434 \u2192 \u043E\u0442\u043A\u0440\u043E\u0435\u0442\u0441\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u043B\u0438\u0446\u0430. \u0421\u0434\u0435\u043B\u0430\u0439\u0442\u0435 \u0441\u0435\u043B\u0444\u0438 \u043F\u043E \u0438\u043D\u0441\u0442\u0440\u0443\u043A\u0446\u0438\u0438. \u041E\u043A\u043D\u043E \u043E\u0431\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438."), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return window.open(h5Link, '_blank');
    },
    className: "text-xs text-white/60 hover:text-[#22d3ee] underline"
  }, "\u0418\u043B\u0438 \u043F\u0440\u043E\u0439\u0442\u0438 \u043D\u0430 \u044D\u0442\u043E\u043C \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0435 \u2192")), step === 'photo' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-white/60"
  }, "\u2713 \u041B\u0438\u0446\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u043E. \u0422\u0435\u043F\u0435\u0440\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u0444\u043E\u0442\u043E \u044D\u0442\u043E\u0433\u043E \u0436\u0435 \u0447\u0435\u043B\u043E\u0432\u0435\u043A\u0430 \u2014 \u0430\u043D\u0444\u0430\u0441, \u043B\u0438\u0446\u043E \u043A\u0440\u0443\u043F\u043D\u044B\u043C \u043F\u043B\u0430\u043D\u043E\u043C, \u0431\u0435\u0437 \u0434\u0440\u0443\u0433\u0438\u0445 \u043B\u044E\u0434\u0435\u0439."), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "image/*",
    className: "hidden",
    onChange: function onChange(e) {
      var _e$target$files;
      var f = (_e$target$files = e.target.files) === null || _e$target$files === void 0 ? void 0 : _e$target$files[0];
      if (f) onPickPhoto(f);
      e.target.value = '';
    }
  }), /*#__PURE__*/React.createElement("div", {
    onClick: function onClick() {
      var _fileRef$current;
      return (_fileRef$current = fileRef.current) === null || _fileRef$current === void 0 ? void 0 : _fileRef$current.click();
    },
    className: "w-full aspect-square max-h-64 mx-auto bg-white/5 border border-dashed border-white/20 hover:border-[#22d3ee] rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
  }, photo ? /*#__PURE__*/React.createElement("img", {
    src: photo,
    alt: "",
    className: "w-full h-full object-contain"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "text-center text-white/40"
  }, /*#__PURE__*/React.createElement(_fa.FaUpload, {
    className: "h-6 w-6 mx-auto mb-1"
  }), /*#__PURE__*/React.createElement("span", {
    className: "text-xs"
  }, "\u041D\u0430\u0436\u043C\u0438 \u0447\u0442\u043E\u0431\u044B \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u043E\u0442\u043E"))), /*#__PURE__*/React.createElement("button", {
    onClick: uploadAndCreateAsset,
    disabled: !photo,
    className: "w-full py-3 bg-gradient-to-r from-[#22d3ee] to-[#a855f7] hover:from-[#06b6d4] hover:to-[#9333ea] disabled:opacity-50 text-black font-medium rounded-xl transition-all flex items-center justify-center gap-2"
  }, /*#__PURE__*/React.createElement(_fa.FaQrcode, {
    className: "h-4 w-4"
  }), " \u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u0442\u044C")), step === 'processing' && /*#__PURE__*/React.createElement("div", {
    className: "py-6 text-center space-y-3"
  }, /*#__PURE__*/React.createElement(_fa.FaSpinner, {
    className: "h-10 w-10 animate-spin text-[#22d3ee] mx-auto"
  }), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-white"
  }, statusText)), step === 'done' && /*#__PURE__*/React.createElement("div", {
    className: "py-4 text-center space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto"
  }, /*#__PURE__*/React.createElement(_fa.FaCheck, {
    className: "h-6 w-6 text-green-400"
  })), /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-medium text-white"
  }, "\u041B\u0438\u0446\u043E \xAB", displayName, "\xBB \u0437\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043E\u0432\u0430\u043D\u043E!"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-mono text-[#22d3ee] truncate flex-1"
  }, assetUri), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      navigator.clipboard.writeText(assetUri);
      _reactHotToast.toast.success('Скопировано');
    },
    className: "text-white/60 hover:text-[#22d3ee]"
  }, /*#__PURE__*/React.createElement(_fa.FaCopy, {
    className: "h-3.5 w-3.5"
  }))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-white/50"
  }, "\u0422\u0435\u043F\u0435\u0440\u044C \u043C\u043E\u0436\u043D\u043E \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u044D\u0442\u043E \u043B\u0438\u0446\u043E \u0432 \u0432\u0438\u0434\u0435\u043E."), /*#__PURE__*/React.createElement("button", {
    onClick: handleClose,
    className: "w-full py-2.5 bg-[#22d3ee]/20 hover:bg-[#22d3ee]/30 text-[#22d3ee] font-medium rounded-xl transition-colors"
  }, "\u0413\u043E\u0442\u043E\u0432\u043E"))));
}
