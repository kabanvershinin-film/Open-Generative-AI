"use strict";
"use client";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = AvatarCreationDialog;
var _react = require("react");
var _reactHotToast = require("react-hot-toast");
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _regeneratorValues(e) { if (null != e) { var t = e["function" == typeof Symbol && Symbol.iterator || "@@iterator"], r = 0; if (t) return t.call(e); if ("function" == typeof e.next) return e; if (!isNaN(e.length)) return { next: function next() { return e && r >= e.length && (e = void 0), { value: e && e[r++], done: !e }; } }; } throw new TypeError(_typeof(e) + " is not iterable"); }
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
var AVATAR_LIBRARY_KEY = 'avatar_library_v1';
function loadAvatarLibrary() {
  try {
    return JSON.parse(localStorage.getItem(AVATAR_LIBRARY_KEY) || '[]');
  } catch (_unused) {
    return [];
  }
}
function saveAvatarLibrary(items) {
  try {
    localStorage.setItem(AVATAR_LIBRARY_KEY, JSON.stringify(items));
  } catch (_unused2) {}
}
function AvatarCreationDialog(_ref) {
  var open = _ref.open,
    onClose = _ref.onClose,
    onCreated = _ref.onCreated;
  var _useState = (0, _react.useState)('name'),
    _useState2 = _slicedToArray(_useState, 2),
    step = _useState2[0],
    setStep = _useState2[1]; // 'name' | 'video' | 'uploading' | 'training' | 'done'
  var _useState3 = (0, _react.useState)(''),
    _useState4 = _slicedToArray(_useState3, 2),
    displayName = _useState4[0],
    setDisplayName = _useState4[1];
  var _useState5 = (0, _react.useState)(''),
    _useState6 = _slicedToArray(_useState5, 2),
    confName = _useState6[0],
    setConfName = _useState6[1];
  var _useState7 = (0, _react.useState)(null),
    _useState8 = _slicedToArray(_useState7, 2),
    video = _useState8[0],
    setVideo = _useState8[1];
  var _useState9 = (0, _react.useState)(null),
    _useState0 = _slicedToArray(_useState9, 2),
    videoPreview = _useState0[0],
    setVideoPreview = _useState0[1];
  var _useState1 = (0, _react.useState)(false),
    _useState10 = _slicedToArray(_useState1, 2),
    busy = _useState10[0],
    setBusy = _useState10[1];
  var _useState11 = (0, _react.useState)(''),
    _useState12 = _slicedToArray(_useState11, 2),
    statusText = _useState12[0],
    setStatusText = _useState12[1];
  var _useState13 = (0, _react.useState)(null),
    _useState14 = _slicedToArray(_useState13, 2),
    uploadId = _useState14[0],
    setUploadId = _useState14[1];
  var _useState15 = (0, _react.useState)([]),
    _useState16 = _slicedToArray(_useState15, 2),
    uploadUrls = _useState16[0],
    setUploadUrls = _useState16[1];
  var _useState17 = (0, _react.useState)(null),
    _useState18 = _slicedToArray(_useState17, 2),
    rolePic = _useState18[0],
    setRolePic = _useState18[1];
  var fileRef = (0, _react.useRef)(null);
  var cancelPollRef = (0, _react.useRef)(false);
  var reset = function reset() {
    cancelPollRef.current = true;
    setStep('name');
    setDisplayName('');
    setConfName('');
    setVideo(null);
    setVideoPreview(null);
    setBusy(false);
    setStatusText('');
    setUploadId(null);
    setUploadUrls([]);
    setRolePic(null);
  };
  var startUpload = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var generatedConfName, initResp, initJson, chunkSize, file, totalChunks, _loop, _ret, i, completeResp, completeJson, trainResp, trainJson, _t;
      return _regenerator().w(function (_context2) {
        while (1) switch (_context2.p = _context2.n) {
          case 0:
            if (!(!displayName.trim() || !video)) {
              _context2.n = 1;
              break;
            }
            _reactHotToast.toast.error('Введите имя и выберите видео');
            return _context2.a(2);
          case 1:
            generatedConfName = "avatar_".concat(Date.now());
            setConfName(generatedConfName);
            cancelPollRef.current = false;
            setBusy(true);
            setStep('uploading');
            setStatusText('Инициализация загрузки…');
            _context2.p = 2;
            _context2.n = 3;
            return fetch('/api/digital-avatar/init-part-upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                confName: generatedConfName,
                roleShowName: displayName.trim(),
                type: 1,
                fileSuffix: 'mp4'
              })
            });
          case 3:
            initResp = _context2.v;
            _context2.n = 4;
            return initResp.json();
          case 4:
            initJson = _context2.v;
            if (initResp.ok) {
              _context2.n = 5;
              break;
            }
            throw new Error(initJson.error || 'Ошибка инициализации');
          case 5:
            setUploadId(initJson.UploadId);
            setUploadUrls(initJson.UploadUrls || []);
            setStatusText('Загрузка видео по частям…');

            // Step 2: Split video into chunks and upload (10MB each)
            chunkSize = 10 * 1024 * 1024; // 10MB
            file = video;
            totalChunks = Math.ceil(file.size / chunkSize);
            _loop = /*#__PURE__*/_regenerator().m(function _loop() {
              var start, end, chunk, base64Chunk, partResp, partJson;
              return _regenerator().w(function (_context) {
                while (1) switch (_context.n) {
                  case 0:
                    if (!cancelPollRef.current) {
                      _context.n = 1;
                      break;
                    }
                    return _context.a(2, {
                      v: void 0
                    });
                  case 1:
                    start = i * chunkSize;
                    end = Math.min(start + chunkSize, file.size);
                    chunk = file.slice(start, end); // Convert chunk to base64
                    _context.n = 2;
                    return new Promise(function (resolve, reject) {
                      var reader = new FileReader();
                      reader.onload = function () {
                        var base64 = (reader.result || '').split(',')[1];
                        resolve(base64);
                      };
                      reader.onerror = reject;
                      reader.readAsDataURL(chunk);
                    });
                  case 2:
                    base64Chunk = _context.v;
                    _context.n = 3;
                    return fetch('/api/digital-avatar/video-part-upload', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        uploadUrl: initJson.UploadUrls[i],
                        partData: base64Chunk,
                        partNumber: i + 1
                      })
                    });
                  case 3:
                    partResp = _context.v;
                    _context.n = 4;
                    return partResp.json();
                  case 4:
                    partJson = _context.v;
                    if (partResp.ok) {
                      _context.n = 5;
                      break;
                    }
                    throw new Error(partJson.error || 'Ошибка загрузки части');
                  case 5:
                    setStatusText("\u0417\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u043E ".concat(i + 1, " \u0438\u0437 ").concat(totalChunks, " \u0447\u0430\u0441\u0442\u0435\u0439\u2026"));
                  case 6:
                    return _context.a(2);
                }
              }, _loop);
            });
            i = 0;
          case 6:
            if (!(i < totalChunks)) {
              _context2.n = 9;
              break;
            }
            return _context2.d(_regeneratorValues(_loop()), 7);
          case 7:
            _ret = _context2.v;
            if (!_ret) {
              _context2.n = 8;
              break;
            }
            return _context2.a(2, _ret.v);
          case 8:
            i++;
            _context2.n = 6;
            break;
          case 9:
            // Step 3: Complete upload
            setStatusText('Завершение загрузки…');
            _context2.n = 10;
            return fetch('/api/digital-avatar/video-complete-upload', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                uploadId: initJson.UploadId,
                confName: generatedConfName
              })
            });
          case 10:
            completeResp = _context2.v;
            _context2.n = 11;
            return completeResp.json();
          case 11:
            completeJson = _context2.v;
            if (completeResp.ok) {
              _context2.n = 12;
              break;
            }
            throw new Error(completeJson.error || 'Ошибка завершения загрузки');
          case 12:
            // Step 4: Start training
            setStatusText('Начало обучения…');
            _context2.n = 13;
            return fetch('/api/digital-avatar/init-train-digime', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                confName: generatedConfName,
                callbackUrl: "".concat(window.location.origin, "/api/digital-avatar/callback")
              })
            });
          case 13:
            trainResp = _context2.v;
            _context2.n = 14;
            return trainResp.json();
          case 14:
            trainJson = _context2.v;
            if (trainResp.ok) {
              _context2.n = 15;
              break;
            }
            throw new Error(trainJson.error || 'Ошибка начала обучения');
          case 15:
            // Step 5: Poll training status
            setStep('training');
            _context2.n = 16;
            return pollTrainingStatus(generatedConfName);
          case 16:
            _context2.n = 18;
            break;
          case 17:
            _context2.p = 17;
            _t = _context2.v;
            _reactHotToast.toast.error(_t.message || 'Ошибка');
            setBusy(false);
            setStep('name');
          case 18:
            return _context2.a(2);
        }
      }, _callee, null, [[2, 17]]);
    }));
    return function startUpload() {
      return _ref2.apply(this, arguments);
    };
  }();
  var pollTrainingStatus = /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(confName) {
      var i, infoResp, infoJson, newAvatar, library, _t2;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            i = 0;
          case 1:
            if (!(i < 120)) {
              _context3.n = 10;
              break;
            }
            if (!cancelPollRef.current) {
              _context3.n = 2;
              break;
            }
            return _context3.a(2);
          case 2:
            _context3.n = 3;
            return new Promise(function (r) {
              return setTimeout(r, 5000);
            });
          case 3:
            _context3.p = 3;
            _context3.n = 4;
            return fetch('/api/digital-avatar/digime-training-info', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                confName: confName
              })
            });
          case 4:
            infoResp = _context3.v;
            _context3.n = 5;
            return infoResp.json();
          case 5:
            infoJson = _context3.v;
            if (!(infoJson.State === 2)) {
              _context3.n = 6;
              break;
            }
            // Ready
            setRolePic(infoJson.RolePic);
            setStep('done');
            setBusy(false);

            // Save to library
            newAvatar = {
              id: confName,
              name: displayName.trim(),
              rolePic: infoJson.RolePic,
              prePic: infoJson.PrePic,
              addedAt: Date.now()
            };
            library = loadAvatarLibrary();
            saveAvatarLibrary([newAvatar].concat(_toConsumableArray(library)));
            onCreated === null || onCreated === void 0 || onCreated(confName, displayName.trim(), infoJson.RolePic);
            _reactHotToast.toast.success('Аватар создан!');
            return _context3.a(2);
          case 6:
            if (!(infoJson.State === 3)) {
              _context3.n = 7;
              break;
            }
            throw new Error('Обучение не удалось');
          case 7:
            setStatusText("\u041E\u0431\u0443\u0447\u0435\u043D\u0438\u0435\u2026 ".concat(Math.min(i * 5, 600), " \u0441\u0435\u043A"));
            _context3.n = 9;
            break;
          case 8:
            _context3.p = 8;
            _t2 = _context3.v;
          case 9:
            i++;
            _context3.n = 1;
            break;
          case 10:
            _reactHotToast.toast.error('Обучение слишком долгое, попробуйте позже.');
            setStep('name');
          case 11:
            return _context3.a(2);
        }
      }, _callee2, null, [[3, 8]]);
    }));
    return function pollTrainingStatus(_x) {
      return _ref3.apply(this, arguments);
    };
  }();
  var onPickVideo = function onPickVideo(file) {
    if (!file.type.startsWith('video/')) {
      _reactHotToast.toast.error('Нужно видео');
      return;
    }
    setVideo(file);
    setVideoPreview(URL.createObjectURL(file));
  };
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
    className: "fixed inset-0 z-[100] bg-black flex items-center justify-center p-4",
    onClick: handleClose
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-[#0c0d0f] border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl",
    onClick: function onClick(e) {
      return e.stopPropagation();
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    className: "text-purple-400"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "7",
    r: "4"
  }))), /*#__PURE__*/React.createElement("h3", {
    className: "text-lg font-semibold text-white"
  }, "\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0446\u0438\u0444\u0440\u043E\u0432\u043E\u0433\u043E \u0430\u0432\u0430\u0442\u0430\u0440\u0430")), /*#__PURE__*/React.createElement("button", {
    onClick: handleClose,
    disabled: busy,
    className: "text-white/40 hover:text-white disabled:opacity-40"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, ['name', 'video', 'training', 'done'].map(function (s) {
    var order = ['name', 'video', 'uploading', 'training', 'done'];
    var active = order.indexOf(step) >= order.indexOf(s);
    return /*#__PURE__*/React.createElement("div", {
      key: s,
      className: "h-1 flex-1 rounded-full ".concat(active ? 'bg-purple-600' : 'bg-white/10')
    });
  })), step === 'name' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-white/60 leading-relaxed"
  }, "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0446\u0438\u0444\u0440\u043E\u0432\u043E\u0439 \u0430\u0432\u0430\u0442\u0430\u0440 \u0441 \u043F\u043E\u043C\u043E\u0449\u044C\u044E \u0432\u0438\u0434\u0435\u043E. \u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 5\u201310 \u043C\u0438\u043D\u0443\u0442\u043D\u043E\u0435 \u0432\u0438\u0434\u0435\u043E \u0441 \u0432\u0430\u0448\u0438\u043C \u043B\u0438\u0446\u043E\u043C (\u0430\u043D\u0444\u0430\u0441, \u0445\u043E\u0440\u043E\u0448\u0435\u0435 \u043E\u0441\u0432\u0435\u0449\u0435\u043D\u0438\u0435)."), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col gap-1"
  }, /*#__PURE__*/React.createElement("label", {
    className: "text-[11px] text-white/40"
  }, "\u0418\u043C\u044F \u0430\u0432\u0430\u0442\u0430\u0440\u0430"), /*#__PURE__*/React.createElement("input", {
    value: displayName,
    onChange: function onChange(e) {
      return setDisplayName(e.target.value);
    },
    placeholder: "\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u041C\u043E\u0439 \u0430\u0432\u0430\u0442\u0430\u0440",
    className: "h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 outline-none focus:border-purple-500/50"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2 mt-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setStep('video');
    },
    disabled: !displayName.trim(),
    className: "flex-1 h-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-40 text-white font-medium text-sm transition-all"
  }, "\u0414\u0430\u043B\u0435\u0435"))), step === 'video' && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      return setStep('name');
    },
    disabled: busy,
    className: "h-10 px-4 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-medium transition-colors"
  }, "\u041D\u0430\u0437\u0430\u0434")), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: "video/*",
    className: "hidden",
    onChange: function onChange(e) {
      var _e$target$files;
      var f = (_e$target$files = e.target.files) === null || _e$target$files === void 0 ? void 0 : _e$target$files[0];
      if (f) onPickVideo(f);
      e.target.value = '';
    }
  }), /*#__PURE__*/React.createElement("div", {
    onClick: function onClick() {
      var _fileRef$current;
      return (_fileRef$current = fileRef.current) === null || _fileRef$current === void 0 ? void 0 : _fileRef$current.click();
    },
    className: "w-full aspect-video bg-white/5 border border-dashed border-white/20 hover:border-purple-500/50 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden transition-colors"
  }, videoPreview ? /*#__PURE__*/React.createElement("video", {
    src: videoPreview,
    controls: true,
    className: "w-full h-full object-cover"
  }) : /*#__PURE__*/React.createElement("div", {
    className: "text-center text-white/40"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "40",
    height: "40",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5",
    className: "mx-auto mb-2"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "17 8 12 3 7 8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "3",
    x2: "12",
    y2: "15"
  })), /*#__PURE__*/React.createElement("span", {
    className: "text-xs"
  }, "\u041D\u0430\u0436\u043C\u0438, \u0447\u0442\u043E\u0431\u044B \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0438\u0434\u0435\u043E"))), /*#__PURE__*/React.createElement("button", {
    onClick: startUpload,
    disabled: !video,
    className: "w-full h-10 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-40 text-white font-medium text-sm transition-all flex items-center justify-center gap-2"
  }, busy ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "animate-spin inline-block"
  }, "\u25CC"), statusText) : 'Создать аватар')), (step === 'uploading' || step === 'training') && /*#__PURE__*/React.createElement("div", {
    className: "py-6 text-center space-y-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "animate-spin inline-block text-purple-400 text-5xl"
  }, "\u25CC"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-white"
  }, statusText)), step === 'done' && /*#__PURE__*/React.createElement("div", {
    className: "py-4 text-center space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 rounded-full bg-emerald-600/20 flex items-center justify-center mx-auto"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.5",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className: "text-emerald-400"
  }, /*#__PURE__*/React.createElement("polyline", {
    points: "20 6 9 17 4 12"
  }))), /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-medium text-white"
  }, "\u0410\u0432\u0430\u0442\u0430\u0440 \xAB", displayName, "\xBB \u0441\u043E\u0437\u0434\u0430\u043D!"), rolePic && /*#__PURE__*/React.createElement("img", {
    src: rolePic,
    alt: "\u0410\u0432\u0430\u0442\u0430\u0440",
    className: "w-20 h-20 rounded-xl object-cover mx-auto border border-white/10"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-mono text-purple-400 truncate flex-1"
  }, confName), /*#__PURE__*/React.createElement("button", {
    onClick: function onClick() {
      navigator.clipboard.writeText(confName);
      _reactHotToast.toast.success('Скопировано!');
    },
    className: "text-white/60 hover:text-purple-400"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }, /*#__PURE__*/React.createElement("rect", {
    x: "9",
    y: "9",
    width: "13",
    height: "13",
    rx: "2",
    ry: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
  })))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-white/60"
  }, "\u0422\u0435\u043F\u0435\u0440\u044C \u043C\u043E\u0436\u043D\u043E \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C \u044D\u0442\u043E\u0442 \u0430\u0432\u0430\u0442\u0430\u0440 \u0432 Seedance 2.0."), /*#__PURE__*/React.createElement("button", {
    onClick: handleClose,
    className: "w-full h-10 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 font-medium text-sm transition-all"
  }, "\u0413\u043E\u0442\u043E\u0432\u043E"))));
}