"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactflow = require("reactflow");
var _axios = _interopRequireDefault(require("axios"));
var _reactHotToast = require("react-hot-toast");
var _io = require("react-icons/io5");
var _tfi = require("react-icons/tfi");
var _fa = require("react-icons/fa6");
var _ri = require("react-icons/ri");
var _utility = require("./utility");
var _VideoPlayer = _interopRequireDefault(require("./VideoPlayer"));
var _NodeSendButton = _interopRequireDefault(require("./NodeSendButton"));
var _NodeOptionsMenu = _interopRequireDefault(require("./NodeOptionsMenu"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t2 in e) "default" !== _t2 && {}.hasOwnProperty.call(e, _t2) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t2)) && (i.get || i.set) ? o(f, _t2, i) : f[_t2] = e[_t2]); return f; })(e, t); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
var RATIOS = ["auto", "16:9", "9:16", "4:3", "3:4"];
var DURATIONS = ["auto", "～15s", "～30s", "40～60s"];
var MODES = ["standard", "fast"];
var LANGUAGES = ["Chinese", "English", "Japanese", "Thai", "Russian", "French", "German", "Spanish"];
var SkylarkNode = function SkylarkNode(_ref) {
  var _outputHistory$curren, _data$formValues;
  var id = _ref.id,
    data = _ref.data,
    selected = _ref.selected;
  var _useReactFlow = (0, _reactflow.useReactFlow)(),
    setNodes = _useReactFlow.setNodes,
    setEdges = _useReactFlow.setEdges;
  var updateNodeInternals = (0, _reactflow.useUpdateNodeInternals)();
  var edges = (0, _reactflow.useStore)(function (state) {
    return state.edges;
  });
  var _useState = (0, _react.useState)(data.formValues || {
      prompt: "",
      img_url_list: [],
      video_url_list: [],
      ratio: "auto",
      duration: "auto",
      mode: "standard",
      language: "Russian",
      accent: "PuTongHua",
      enable_watermark: true
    }),
    _useState2 = _slicedToArray(_useState, 2),
    formValues = _useState2[0],
    setFormValues = _useState2[1];
  var _useState3 = (0, _react.useState)(false),
    _useState4 = _slicedToArray(_useState3, 2),
    loading = _useState4[0],
    setLoading = _useState4[1];
  var _useState5 = (0, _react.useState)(-1),
    _useState6 = _slicedToArray(_useState5, 2),
    currentHistoryIndex = _useState6[0],
    setCurrentHistoryIndex = _useState6[1];
  var outputHistory = data.outputHistory || [];
  var inFlightRef = (0, _react.useRef)(false);

  // Sync with parent data
  (0, _react.useEffect)(function () {
    if (data.formValues && (0, _utility.stableStringify)(data.formValues) !== (0, _utility.stableStringify)(formValues)) {
      setFormValues(data.formValues);
    }
  }, [data.formValues]);

  // Push changes to parent
  (0, _react.useEffect)(function () {
    if (data.onDataChange && (0, _utility.stableStringify)(data.formValues) !== (0, _utility.stableStringify)(formValues)) {
      data.onDataChange(id, {
        formValues: formValues
      });
    }
  }, [formValues]);

  // Handle workflow-wide trigger
  (0, _react.useEffect)(function () {
    if (data.triggerRun) {
      handleRunSkylark();
      if (data.onDataChange) {
        data.onDataChange(id, {
          triggerRun: false
        });
      }
    }
  }, [data.triggerRun]);
  var handleRunSkylark = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var submitRes, taskId, finishedUrl, i, statusRes, _statusRes$data, status, videoUrl, output, newHistory, _error$response, msg, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!(inFlightRef.current || loading)) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            if (formValues !== null && formValues !== void 0 && formValues.prompt) {
              _context.n = 2;
              break;
            }
            _reactHotToast.toast.error("Промпт обязателен для запуска Скайларк");
            return _context.a(2);
          case 2:
            inFlightRef.current = true;
            setLoading(true);
            data.onDataChange(id, {
              isLoading: true
            });
            _context.p = 3;
            _context.n = 4;
            return _axios["default"].post("/api/agents/skylark/submit", formValues);
          case 4:
            submitRes = _context.v;
            taskId = submitRes.data.taskId;
            if (taskId) {
              _context.n = 5;
              break;
            }
            throw new Error("Не удалось получить ID задачи");
          case 5:
            // 2. Poll Status
            finishedUrl = null;
            i = 0;
          case 6:
            if (!(i < 60)) {
              _context.n = 11;
              break;
            }
            _context.n = 7;
            return new Promise(function (r) {
              return setTimeout(r, 5000);
            });
          case 7:
            _context.n = 8;
            return _axios["default"].post("/api/agents/skylark/status", {
              taskId: taskId
            });
          case 8:
            statusRes = _context.v;
            _statusRes$data = statusRes.data, status = _statusRes$data.status, videoUrl = _statusRes$data.videoUrl;
            if (!(status === "done" && videoUrl)) {
              _context.n = 9;
              break;
            }
            finishedUrl = videoUrl;
            return _context.a(3, 11);
          case 9:
            if (!["failed", "error", "expired"].includes(status)) {
              _context.n = 10;
              break;
            }
            throw new Error("\u041E\u0448\u0438\u0431\u043A\u0430 \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438: ".concat(status));
          case 10:
            i++;
            _context.n = 6;
            break;
          case 11:
            if (finishedUrl) {
              _context.n = 12;
              break;
            }
            throw new Error("Превышено время ожидания");
          case 12:
            output = [{
              type: "video_url",
              value: finishedUrl
            }];
            newHistory = [].concat(_toConsumableArray(outputHistory), [{
              status: "succeeded",
              result: {
                id: taskId,
                outputs: output
              }
            }]);
            data.onDataChange(id, {
              outputs: output,
              resultUrl: finishedUrl,
              isLoading: false,
              errorMsg: null,
              outputHistory: newHistory
            });
            setCurrentHistoryIndex(newHistory.length - 1);
            _reactHotToast.toast.success("Видео успешно сгенерировано!");
            _context.n = 14;
            break;
          case 13:
            _context.p = 13;
            _t = _context.v;
            console.error(_t);
            msg = ((_error$response = _t.response) === null || _error$response === void 0 || (_error$response = _error$response.data) === null || _error$response === void 0 ? void 0 : _error$response.error) || _t.message;
            data.onDataChange(id, {
              isLoading: false,
              errorMsg: msg
            });
            _reactHotToast.toast.error(msg);
          case 14:
            _context.p = 14;
            inFlightRef.current = false;
            setLoading(false);
            return _context.f(14);
          case 15:
            return _context.a(2);
        }
      }, _callee, null, [[3, 13, 14, 15]]);
    }));
    return function handleRunSkylark() {
      return _ref2.apply(this, arguments);
    };
  }();
  var currentOutput = ((_outputHistory$curren = outputHistory[currentHistoryIndex]) === null || _outputHistory$curren === void 0 || (_outputHistory$curren = _outputHistory$curren.result) === null || _outputHistory$curren === void 0 || (_outputHistory$curren = _outputHistory$curren.outputs) === null || _outputHistory$curren === void 0 || (_outputHistory$curren = _outputHistory$curren[0]) === null || _outputHistory$curren === void 0 ? void 0 : _outputHistory$curren.value) || data.resultUrl;
  var connectedInputs = {
    prompt: edges.some(function (e) {
      return e.target === id && e.targetHandle === "prompt";
    }),
    images: edges.some(function (e) {
      return e.target === id && e.targetHandle === "images";
    }),
    videos: edges.some(function (e) {
      return e.target === id && e.targetHandle === "videos";
    })
  };
  return /*#__PURE__*/_react["default"].createElement("div", {
    className: "nowheel group flex flex-col w-80 rounded-2xl border-2 transition-all duration-300 bg-[#0c0d0f] ".concat(selected ? "border-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.3)]" : "border-zinc-800 shadow-lg")
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2 absolute -top-5 left-0"
  }, /*#__PURE__*/_react["default"].createElement("h3", {
    className: "text-zinc-400 text-[10px] font-medium tracking-wider uppercase"
  }, "\u0410\u0433\u0435\u043D\u0442 \u0413\u0435\u043D\u0430")), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between bg-gradient-to-r from-[#151618] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 py-2 px-3"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-1.5 rounded-lg ".concat(selected ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400")
  }, /*#__PURE__*/_react["default"].createElement(_ri.RiRobot2Line, {
    size: 14
  })), /*#__PURE__*/_react["default"].createElement("h3", {
    className: "text-xs font-bold text-zinc-100"
  }, "\u0410\u0433\u0435\u043D\u0442 \u0413\u0435\u043D\u0430")), /*#__PURE__*/_react["default"].createElement(_NodeOptionsMenu["default"], {
    nodeId: id,
    onDuplicate: data.duplicateNode,
    onDelete: function onDelete() {
      if (window.confirm("Удалить агента Гена?")) {
        setNodes(function (nds) {
          return nds.filter(function (n) {
            return n.id !== id;
          });
        });
        setEdges(function (eds) {
          return eds.filter(function (e) {
            return e.source !== id && e.target !== id;
          });
        });
      }
    },
    downloadUrl: currentOutput
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-3 flex flex-col gap-3"
  }, connectedInputs.prompt && /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-3 animate-in fade-in slide-in-from-top-1 duration-300"
  }, /*#__PURE__*/_react["default"].createElement(_tfi.TfiText, {
    className: "text-blue-400",
    size: 12
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[9px] text-blue-400 font-bold uppercase tracking-tight"
  }, "\u041F\u0440\u043E\u043C\u043F\u0442 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D"), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[8px] text-blue-300/60 truncate max-w-[140px]"
  }, ((_data$formValues = data.formValues) === null || _data$formValues === void 0 ? void 0 : _data$formValues.prompt) || "Ожидание текста..."))), data.isLoading ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "aspect-video bg-zinc-900 rounded-lg flex flex-col items-center justify-center gap-2"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] text-blue-500 font-bold uppercase"
  }, "\u0410\u0433\u0435\u043D\u0442 \u0434\u0443\u043C\u0430\u0435\u0442...")) : currentOutput ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "aspect-video rounded-lg overflow-hidden border border-zinc-800 bg-black"
  }, /*#__PURE__*/_react["default"].createElement(_VideoPlayer["default"], {
    src: currentOutput,
    accentColor: "#3b82f6"
  })) : /*#__PURE__*/_react["default"].createElement("div", {
    className: "aspect-video bg-zinc-900 rounded-lg flex flex-col items-center justify-center text-zinc-600 border border-dashed border-zinc-800"
  }, /*#__PURE__*/_react["default"].createElement(_io.IoVideocamOutline, {
    size: 32
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] italic"
  }, "\u0413\u043E\u0442\u043E\u0432 \u043A \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438")), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-2"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/_react["default"].createElement("label", {
    className: "text-[9px] text-zinc-500 uppercase block mb-1"
  }, "\u0421\u043E\u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0435"), /*#__PURE__*/_react["default"].createElement("select", {
    value: formValues.ratio,
    onChange: function onChange(e) {
      return setFormValues(function (v) {
        return _objectSpread(_objectSpread({}, v), {}, {
          ratio: e.target.value
        });
      });
    },
    className: "w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-white outline-none"
  }, RATIOS.map(function (r) {
    return /*#__PURE__*/_react["default"].createElement("option", {
      key: r,
      value: r
    }, r);
  }))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex-1"
  }, /*#__PURE__*/_react["default"].createElement("label", {
    className: "text-[9px] text-zinc-500 uppercase block mb-1"
  }, "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C"), /*#__PURE__*/_react["default"].createElement("select", {
    value: formValues.duration,
    onChange: function onChange(e) {
      return setFormValues(function (v) {
        return _objectSpread(_objectSpread({}, v), {}, {
          duration: e.target.value
        });
      });
    },
    className: "w-full bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[10px] text-white outline-none"
  }, DURATIONS.map(function (d) {
    return /*#__PURE__*/_react["default"].createElement("option", {
      key: d,
      value: d
    }, d);
  })))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-1"
  }, /*#__PURE__*/_react["default"].createElement("label", {
    className: "text-[9px] text-zinc-500 uppercase block"
  }, "\u0420\u0435\u0436\u0438\u043C"), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex bg-zinc-900 border border-zinc-800 rounded p-0.5"
  }, MODES.map(function (m) {
    return /*#__PURE__*/_react["default"].createElement("button", {
      key: m,
      onClick: function onClick() {
        return setFormValues(function (v) {
          return _objectSpread(_objectSpread({}, v), {}, {
            mode: m
          });
        });
      },
      className: "flex-1 py-1 text-[9px] uppercase font-bold rounded transition-all ".concat(formValues.mode === m ? "bg-blue-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300")
    }, m === "standard" ? "Стандарт" : "Фаст");
  }))), /*#__PURE__*/_react["default"].createElement("button", {
    onClick: handleRunSkylark,
    disabled: loading || data.isLoading,
    className: "w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2"
  }, loading ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"
  }) : /*#__PURE__*/_react["default"].createElement(_fa.FaPlay, {
    size: 10
  }), "\u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u0413\u0435\u043D\u0443"))), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "prompt",
    style: {
      top: '40%'
    },
    className: "!w-3 !h-3 !border-2 ".concat(connectedInputs.prompt ? "!bg-blue-500 !border-white shadow-[0_0_15px_rgba(37,99,235,0.8)]" : "!bg-zinc-900 !border-blue-500 hover:!border-blue-400 shadow-sm"),
    title: "\u0422\u0435\u043A\u0441\u0442 (\u041F\u0440\u043E\u043C\u043F\u0442)"
  }), /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-[11px] text-blue-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "blue" ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
    style: {
      top: '40%',
      left: -40,
      transform: 'translateY(-50%)'
    }
  }, "\u0422\u0435\u043A\u0441\u0442"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "images",
    style: {
      top: '60%'
    },
    className: "!w-3 !h-3 !border-2 ".concat(connectedInputs.images ? "!bg-emerald-500 !border-white shadow-[0_0_15px_rgba(16,185,129,0.8)]" : "!bg-zinc-900 !border-emerald-500 hover:!border-emerald-400 shadow-sm"),
    title: "\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F (\u0420\u0435\u0444\u0435\u0440\u0435\u043D\u0441\u044B)"
  }), /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-[11px] text-emerald-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "green" ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
    style: {
      top: '60%',
      left: -75,
      transform: 'translateY(-50%)'
    }
  }, "\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "videos",
    style: {
      top: '80%'
    },
    className: "!w-3 !h-3 !border-2 ".concat(connectedInputs.videos ? "!bg-orange-500 !border-white shadow-[0_0_15px_rgba(249,115,22,0.8)]" : "!bg-zinc-900 !border-orange-500 hover:!border-orange-400 shadow-sm"),
    title: "\u0412\u0438\u0434\u0435\u043E (\u0420\u0435\u0444\u0435\u0440\u0435\u043D\u0441\u044B)"
  }), /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-[11px] text-orange-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "orange" ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
    style: {
      top: '80%',
      left: -45,
      transform: 'translateY(-50%)'
    }
  }, "\u0412\u0438\u0434\u0435\u043E"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "source",
    position: _reactflow.Position.Right,
    id: "videoOutput",
    style: {
      top: '50%'
    },
    className: "!w-3 !h-3 !border-2 ".concat(outputHistory.length > 0 ? "!bg-orange-500 !border-white shadow-[0_0_15px_rgba(249,115,22,0.8)]" : "!bg-zinc-900 !border-orange-500 hover:!border-orange-400 shadow-sm"),
    title: "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 (\u0412\u0438\u0434\u0435\u043E)"
  }), /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-[11px] text-orange-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "orange" ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
    style: {
      top: '50%',
      right: -45,
      transform: 'translateY(-50%)'
    }
  }, "\u0412\u0438\u0434\u0435\u043E"));
};
var _default = exports["default"] = SkylarkNode;