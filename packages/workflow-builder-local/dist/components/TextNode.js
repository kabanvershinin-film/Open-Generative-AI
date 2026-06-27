"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactflow = require("reactflow");
var _tfi = require("react-icons/tfi");
var _fa = require("react-icons/fa");
var _io = require("react-icons/io5");
var _reactHotToast = require("react-hot-toast");
var _axios = _interopRequireDefault(require("axios"));
var _NodeOptionsMenu = _interopRequireDefault(require("./NodeOptionsMenu"));
var _NodeSendButton = _interopRequireDefault(require("./NodeSendButton"));
var _UploadNode = _interopRequireDefault(require("./UploadNode"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t2 in e) "default" !== _t2 && {}.hasOwnProperty.call(e, _t2) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t2)) && (i.get || i.set) ? o(f, _t2, i) : f[_t2] = e[_t2]); return f; })(e, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
var TextGeneration = function TextGeneration(_ref) {
  var _data$nodeSchemas, _data$nodeSchemas2, _selectedModel$id, _outputHistory$curren, _currentOutputList$cu, _currentOutputList$, _data$selectedModel;
  var id = _ref.id,
    data = _ref.data,
    selected = _ref.selected;
  var _useReactFlow = (0, _reactflow.useReactFlow)(),
    getNodes = _useReactFlow.getNodes,
    getEdges = _useReactFlow.getEdges;
  var edges = (0, _reactflow.useStore)(function (state) {
    return state.edges;
  });
  var formValues = data.formValues || {};
  var setFormValues = data.setFormValues || function () {};
  var selectedModel = data.selectedModel || {};
  var loading = data.loading || false;

  // Auto-detect references wired into the video/image node this prompt node feeds,
  // and surface them as clickable chips (with thumbnails) — like SeedancePromptNode.
  var availableTags = (0, _react.useMemo)(function () {
    var allNodes = getNodes() || [];
    var genIds = new Set(edges.filter(function (e) {
      return e.source === id;
    }).map(function (e) {
      return e.target;
    }).filter(function (tid) {
      var n = allNodes.find(function (nn) {
        return nn.id === tid;
      });
      return n && (n.type === "videoNode" || n.type === "imageNode");
    }));
    var out = [];
    var seen = new Set();
    var counters = {
      images: 0,
      video: 0,
      audio: 0
    };

    // First add references connected directly to TextNode
    var _iterator = _createForOfIteratorHelper(edges),
      _step;
    try {
      var _loop = function _loop() {
          var _d$outputs$;
          var e = _step.value;
          if (e.target !== id) {
            return 0; // continue
          } // Skip edges not targeting TextNode
          if (seen.has(e.source)) {
            return 0; // continue
          }
          seen.add(e.source);
          var n = allNodes.find(function (nn) {
            return nn.id === e.source;
          });
          if (!n) {
            return 0; // continue
          }
          var d = n.data || {};
          var fvN = d.formValues || {};
          var rawThumb = fvN.character_photo || d.thumbnail || d.previewUrl || d.resultUrl || Array.isArray(d.outputs) && ((_d$outputs$ = d.outputs[0]) === null || _d$outputs$ === void 0 ? void 0 : _d$outputs$.value) || fvN.image_url;
          var url = typeof rawThumb === "string" && !rawThumb.startsWith("asset://") && !rawThumb.startsWith("data:image/svg") ? rawThumb : undefined;
          if (n.type === "characterNode") {
            counters.images += 1;
            out.push({
              id: n.id,
              label: "\u56FE\u7247".concat(counters.images),
              kind: "character",
              url: url,
              name: (fvN.character_name || "角色").trim()
            });
          } else if (n.type === "videoNode") {
            counters.video += 1;
            out.push({
              id: n.id,
              label: "\u89C6\u9891".concat(counters.video),
              kind: "video",
              url: url
            });
          } else if (n.type === "audioNode") {
            counters.audio += 1;
            out.push({
              id: n.id,
              label: "\u97F3\u9891".concat(counters.audio),
              kind: "audio",
              url: url
            });
          } else if (n.type === "imageNode") {
            counters.images += 1;
            out.push({
              id: n.id,
              label: "\u56FE\u7247".concat(counters.images),
              kind: "images",
              url: url
            });
          }
        },
        _ret;
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        _ret = _loop();
        if (_ret === 0) continue;
      }

      // Then add references connected to the node that TextNode feeds
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    var _iterator2 = _createForOfIteratorHelper(edges),
      _step2;
    try {
      var _loop2 = function _loop2() {
          var _d$outputs$2;
          var e = _step2.value;
          if (!genIds.has(e.target)) {
            return 0; // continue
          }
          if (e.source === id) {
            return 0; // continue
          }
          if (seen.has(e.source)) {
            return 0; // continue
          }
          seen.add(e.source);
          var n = allNodes.find(function (nn) {
            return nn.id === e.source;
          });
          if (!n) {
            return 0; // continue
          }
          var d = n.data || {};
          var fvN = d.formValues || {};
          var rawThumb = fvN.character_photo || d.thumbnail || d.previewUrl || d.resultUrl || Array.isArray(d.outputs) && ((_d$outputs$2 = d.outputs[0]) === null || _d$outputs$2 === void 0 ? void 0 : _d$outputs$2.value) || fvN.image_url;
          var url = typeof rawThumb === "string" && !rawThumb.startsWith("asset://") && !rawThumb.startsWith("data:image/svg") ? rawThumb : undefined;
          if (n.type === "characterNode") {
            counters.images += 1;
            out.push({
              id: n.id,
              label: "\u56FE\u7247".concat(counters.images),
              kind: "character",
              url: url,
              name: (fvN.character_name || "角色").trim()
            });
          } else if (n.type === "videoNode") {
            counters.video += 1;
            out.push({
              id: n.id,
              label: "\u89C6\u9891".concat(counters.video),
              kind: "video",
              url: url
            });
          } else if (n.type === "audioNode") {
            counters.audio += 1;
            out.push({
              id: n.id,
              label: "\u97F3\u9891".concat(counters.audio),
              kind: "audio",
              url: url
            });
          } else if (n.type === "imageNode") {
            counters.images += 1;
            out.push({
              id: n.id,
              label: "\u56FE\u7247".concat(counters.images),
              kind: "images",
              url: url
            });
          }
        },
        _ret2;
      for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
        _ret2 = _loop2();
        if (_ret2 === 0) continue;
      }
    } catch (err) {
      _iterator2.e(err);
    } finally {
      _iterator2.f();
    }
    return out;
  }, [edges, id, getNodes]);
  var insertTag = function insertTag(tag) {
    var _ta$selectionStart, _ta$selectionEnd;
    var ta = textareaRef.current;
    var insertText = tag + " ";
    if (!ta) {
      var _newPrompt = (formValues.prompt || "") + insertText;
      setFormValues(_objectSpread(_objectSpread({}, formValues), {}, {
        prompt: _newPrompt
      }));
      return;
    }
    var start = (_ta$selectionStart = ta.selectionStart) !== null && _ta$selectionStart !== void 0 ? _ta$selectionStart : (formValues.prompt || "").length;
    var end = (_ta$selectionEnd = ta.selectionEnd) !== null && _ta$selectionEnd !== void 0 ? _ta$selectionEnd : (formValues.prompt || "").length;
    var newPrompt = (formValues.prompt || "").slice(0, start) + insertText + (formValues.prompt || "").slice(end);
    setFormValues(_objectSpread(_objectSpread({}, formValues), {}, {
      prompt: newPrompt
    }));
    requestAnimationFrame(function () {
      ta.focus();
      var newPos = start + insertText.length;
      ta.setSelectionRange(newPos, newPos);
    });
  };
  var currentHistoryIndex = data.currentHistoryIndex !== undefined ? data.currentHistoryIndex : data.outputHistory ? data.outputHistory.length - 1 : -1;
  var setCurrentHistoryIndex = function setCurrentHistoryIndex(idx) {
    if (data.updateNodeData) {
      data.updateNodeData(id, {
        currentHistoryIndex: idx
      });
    }
  };
  var currentOutputIndex = data.currentOutputIndex || 0;
  var setCurrentOutputIndex = function setCurrentOutputIndex(idx) {
    if (data.updateNodeData) {
      data.updateNodeData(id, {
        currentOutputIndex: idx
      });
    }
  };
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    isRefreshingCost = _useState2[0],
    setIsRefreshingCost = _useState2[1];
  var _useState3 = (0, _react.useState)(null),
    _useState4 = _slicedToArray(_useState3, 2),
    generationCost = _useState4[0],
    setGenerationCost = _useState4[1];
  var textareaRef = (0, _react.useRef)(null);
  var outputHistory = data.outputHistory || [];
  var connectedInputs = data.connectedInputs || {};
  var connectedOutputs = data.connectedOutputs || {};
  var properties = ((_data$nodeSchemas = data.nodeSchemas) === null || _data$nodeSchemas === void 0 || (_data$nodeSchemas = _data$nodeSchemas.categories) === null || _data$nodeSchemas === void 0 || (_data$nodeSchemas = _data$nodeSchemas.text) === null || _data$nodeSchemas === void 0 || (_data$nodeSchemas = _data$nodeSchemas.models) === null || _data$nodeSchemas === void 0 || (_data$nodeSchemas = _data$nodeSchemas[selectedModel.id]) === null || _data$nodeSchemas === void 0 || (_data$nodeSchemas = _data$nodeSchemas.input_schema) === null || _data$nodeSchemas === void 0 || (_data$nodeSchemas = _data$nodeSchemas.schemas) === null || _data$nodeSchemas === void 0 || (_data$nodeSchemas = _data$nodeSchemas.input_data) === null || _data$nodeSchemas === void 0 ? void 0 : _data$nodeSchemas.properties) || ((_data$nodeSchemas2 = data.nodeSchemas) === null || _data$nodeSchemas2 === void 0 || (_data$nodeSchemas2 = _data$nodeSchemas2.categories) === null || _data$nodeSchemas2 === void 0 || (_data$nodeSchemas2 = _data$nodeSchemas2.text) === null || _data$nodeSchemas2 === void 0 || (_data$nodeSchemas2 = _data$nodeSchemas2.models) === null || _data$nodeSchemas2 === void 0 || (_data$nodeSchemas2 = _data$nodeSchemas2[selectedModel.id]) === null || _data$nodeSchemas2 === void 0 || (_data$nodeSchemas2 = _data$nodeSchemas2.input_params) === null || _data$nodeSchemas2 === void 0 ? void 0 : _data$nodeSchemas2.properties) || {};
  var isPassthrough = selectedModel === null || selectedModel === void 0 || (_selectedModel$id = selectedModel.id) === null || _selectedModel$id === void 0 ? void 0 : _selectedModel$id.includes("passthrough");
  var hasPrompt = data.hasPrompt !== false && !isPassthrough && ("prompt" in properties || Object.keys(properties).length === 0);
  var hasImageUrl = data.hasImageUrl !== false && !isPassthrough && "image_url" in properties;
  var hasImagesList = data.hasImagesList !== false && !isPassthrough && "images_list" in properties;
  var hasSystemPrompt = data.hasSystemPrompt !== false && !isPassthrough && "system_prompt" in properties;
  var handlePrev = function handlePrev(e) {
    e.stopPropagation();
    var newIdx = currentHistoryIndex > 0 ? currentHistoryIndex - 1 : currentHistoryIndex;
    setCurrentHistoryIndex(newIdx);
    setCurrentOutputIndex(0);
  };
  var handleNext = function handleNext(e) {
    e.stopPropagation();
    var newIdx = currentHistoryIndex < outputHistory.length - 1 ? currentHistoryIndex + 1 : currentHistoryIndex;
    setCurrentHistoryIndex(newIdx);
    setCurrentOutputIndex(0);
  };
  var handleDeleteNode = function handleDeleteNode() {
    data.deleteNode(id);
  };
  var handleDeleteHistory = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(e) {
      var itemToDelete, newHistory, _error$response, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            e.stopPropagation();
            if (!window.confirm("Вы уверены, что хотите удалить эту запись из истории?")) {
              _context.n = 4;
              break;
            }
            _context.p = 1;
            itemToDelete = outputHistory[currentHistoryIndex];
            _context.n = 2;
            return _axios["default"]["delete"]("/api/workflow/history/".concat(itemToDelete.id));
          case 2:
            newHistory = outputHistory.filter(function (_, i) {
              return i !== currentHistoryIndex;
            });
            data.updateNodeData(id, {
              outputHistory: newHistory
            });
            if (newHistory.length === 0) {
              setCurrentHistoryIndex(-1);
            } else {
              setCurrentHistoryIndex(Math.max(0, currentHistoryIndex - 1));
            }
            _reactHotToast.toast.success("Запись удалена");
            _context.n = 4;
            break;
          case 3:
            _context.p = 3;
            _t = _context.v;
            _reactHotToast.toast.error(((_error$response = _t.response) === null || _error$response === void 0 || (_error$response = _error$response.data) === null || _error$response === void 0 ? void 0 : _error$response.detail) || "Не удалось удалить запись");
            console.error(_t);
          case 4:
            return _context.a(2);
        }
      }, _callee, null, [[1, 3]]);
    }));
    return function handleDeleteHistory(_x) {
      return _ref2.apply(this, arguments);
    };
  }();
  var currentOutputList = currentHistoryIndex !== -1 && outputHistory[currentHistoryIndex] ? ((_outputHistory$curren = outputHistory[currentHistoryIndex]) === null || _outputHistory$curren === void 0 || (_outputHistory$curren = _outputHistory$curren.result) === null || _outputHistory$curren === void 0 ? void 0 : _outputHistory$curren.outputs) || [] : data.outputs || [];
  var currentOutput = currentOutputList.length > 0 ? ((_currentOutputList$cu = currentOutputList[currentOutputIndex]) === null || _currentOutputList$cu === void 0 ? void 0 : _currentOutputList$cu.value) || ((_currentOutputList$ = currentOutputList[0]) === null || _currentOutputList$ === void 0 ? void 0 : _currentOutputList$.value) || data.resultUrl : data.resultUrl;
  var setNodes = data.setNodes,
    setEdges = data.setEdges;
  (0, _react.useEffect)(function () {
    if (!setEdges) return;
    var timeout = setTimeout(function () {
      var validHandles = [hasPrompt && "textInput", hasImageUrl && "textInput2", hasImagesList && "textInput3", hasSystemPrompt && "textInput4"].filter(Boolean);
      setEdges(function (prevEdges) {
        return prevEdges.filter(function (edge) {
          if (edge.target !== id) return true;
          return validHandles.includes(edge.targetHandle);
        });
      });
    }, 2000);
    return function () {
      return clearTimeout(timeout);
    };
  }, [hasPrompt, hasImageUrl, hasImagesList, hasSystemPrompt, id, setEdges]);
  (0, _react.useEffect)(function () {
    var textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      var scrollHeight = textarea.scrollHeight;
      textarea.style.height = "".concat(Math.max(scrollHeight, 210), "px");
    }
  }, [currentOutput, currentHistoryIndex, selectedModel.name]);
  return /*#__PURE__*/_react["default"].createElement("div", {
    style: {
      minHeight: 280,
      '--loader-color': '#2563eb'
    },
    className: "\n        nowheel group flex flex-col flex-1 w-80 \n        rounded-2xl border-2 relative transition-all duration-300 ease-in-out \n        ".concat(selected ? "border-blue-600 shadow-[0_0_25px_rgba(37,99,235,0.3)] scale-[1.02] ring-1 ring-blue-500/20" : "border-zinc-800 hover:border-zinc-700 shadow-lg", " \n        bg-[#0c0d0f]\n      ")
  }, data.isLoading && /*#__PURE__*/_react["default"].createElement("div", {
    className: "loader-border"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2 absolute -top-5 left-0"
  }, /*#__PURE__*/_react["default"].createElement("h3", {
    className: "text-zinc-400 text-[10px] font-medium tracking-wider uppercase"
  }, "\u0422\u0435\u043A\u0441\u0442 ", id.replace(/^\D+/g, "")), generationCost !== null && !(selectedModel !== null && selectedModel !== void 0 && selectedModel.id.includes("passthrough")) && /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs text-blue-500 -mt-0.5 font-medium flex items-center gap-1 opacity-80"
  }, isRefreshingCost ? /*#__PURE__*/_react["default"].createElement("span", {
    className: "flex items-center gap-1 italic text-blue-200"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-2 h-2 border-[1.5px] border-blue-200/30 border-t-blue-400 rounded-full animate-spin"
  })) : /*#__PURE__*/_react["default"].createElement("span", null, generationCost === 0 ? 'Бесплатно' : "\u2248 ".concat(generationCost.toFixed(2), " \u20BD")))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between bg-gradient-to-r from-[#151618] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 py-2 px-3"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-1.5 rounded-lg ".concat(selected ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-400", " transition-colors")
  }, /*#__PURE__*/_react["default"].createElement(_tfi.TfiText, {
    size: 14
  })), /*#__PURE__*/_react["default"].createElement("h3", {
    className: "text-xs font-bold text-zinc-100"
  }, selectedModel.name)), outputHistory.length > 0 && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute -top-10 right-0 bg-[#0c0d0f] flex items-center gap-1 p-1 border border-white/10 rounded-full ml-auto"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: handlePrev,
    disabled: currentHistoryIndex <= 0,
    className: "w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all",
    title: "\u041D\u0430\u0437\u0430\u0434"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleLeft, {
    size: 10
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-1.5 px-1"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[9px] font-bold text-white/90 tabular-nums tracking-wide"
  }, currentHistoryIndex + 1, "/", outputHistory.length), /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-[1px] h-2.5 bg-white/10"
  }), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: handleDeleteHistory,
    className: "p-1 hover:bg-red-500/10 rounded-full text-zinc-400 hover:text-red-500 transition-colors flex items-center justify-center",
    title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E"
  }, /*#__PURE__*/_react["default"].createElement(_io.IoTrashOutline, {
    size: 10
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-[1px] h-2.5 bg-white/10"
  }), /*#__PURE__*/_react["default"].createElement(_NodeSendButton["default"], {
    id: id,
    data: data,
    outputHistory: outputHistory,
    currentHistoryIndex: currentHistoryIndex,
    currentOutputIndex: currentOutputIndex
  })), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: handleNext,
    disabled: currentHistoryIndex >= outputHistory.length - 1,
    className: "w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all",
    title: "\u0412\u043F\u0435\u0440\u0435\u0434"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleRight, {
    size: 10
  }))), /*#__PURE__*/_react["default"].createElement(_NodeOptionsMenu["default"], {
    nodeId: id,
    onDuplicate: data.duplicateNode,
    onDelete: handleDeleteNode
  }))), ((_data$selectedModel = data.selectedModel) === null || _data$selectedModel === void 0 ? void 0 : _data$selectedModel.id) === "text-passthrough" ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-full h-full flex-1 flex flex-col"
  }, /*#__PURE__*/_react["default"].createElement(_UploadNode["default"], {
    id: id,
    data: data,
    formValues: formValues,
    setFormValues: setFormValues,
    selectedModel: selectedModel,
    loading: loading,
    uploadType: "text",
    acceptType: "text"
  })) : /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col flex-1 w-full h-full bg-black/20"
  }, connectedInputs.textInput && /*#__PURE__*/_react["default"].createElement("div", {
    className: "mx-3 mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 animate-in fade-in slide-in-from-top-1 duration-300"
  }, formValues.face_thumbnail ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-6 h-6 rounded border border-purple-500/50 overflow-hidden flex-shrink-0 bg-black shadow-sm shadow-purple-500/20"
  }, /*#__PURE__*/_react["default"].createElement("img", {
    src: formValues.face_thumbnail,
    alt: "character",
    className: "w-full h-full object-cover"
  })) : /*#__PURE__*/_react["default"].createElement(_tfi.TfiText, {
    className: "text-blue-400",
    size: 12
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col overflow-hidden"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[9px] text-blue-400 font-bold uppercase tracking-tight"
  }, formValues.face_thumbnail ? "Персонаж подключен" : "Входящий текст подключен"), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[8px] text-blue-300/60 truncate max-w-[200px]"
  }, formValues.prompt || "Ожидание данных..."))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "mx-3 mt-3"
  }, /*#__PURE__*/_react["default"].createElement("label", {
    className: "text-[9px] text-blue-400/60 uppercase tracking-wider mb-1 block"
  }, "\uD83D\uDCA1 \u0412\u0410\u0428\u0410 \u0418\u0414\u0415\u042F"), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-wrap gap-1.5 mb-1 nodrag"
  }, availableTags.length > 0 ? availableTags.map(function (t) {
    return /*#__PURE__*/_react["default"].createElement("button", {
      key: "".concat(t.id, "-").concat(t.label),
      type: "button",
      onMouseDown: function onMouseDown(e) {
        return e.stopPropagation();
      },
      onClick: function onClick() {
        return insertTag(t.label);
      },
      title: "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C ".concat(t.label, " \u0432 \u043F\u0440\u043E\u043C\u043F\u0442"),
      className: "flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 transition-colors"
    }, t.url ? t.kind === "video" ? /*#__PURE__*/_react["default"].createElement("video", {
      src: t.url,
      className: "w-6 h-6 rounded object-cover flex-shrink-0",
      muted: true,
      preload: "none",
      onError: function onError(e) {
        e.target.style.display = 'none';
      }
    }) : /*#__PURE__*/_react["default"].createElement("img", {
      src: t.url,
      alt: t.label,
      className: "w-6 h-6 rounded object-cover flex-shrink-0",
      onError: function onError(e) {
        e.target.style.display = 'none';
      }
    }) : /*#__PURE__*/_react["default"].createElement("span", {
      className: "w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center text-[11px] flex-shrink-0"
    }, t.kind === "video" ? "🎬" : t.kind === "audio" ? "🎵" : t.kind === "character" ? "🧑" : "🖼"), /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-[10px]"
    }, t.label));
  }) : /*#__PURE__*/_react["default"].createElement("p", {
    className: "text-[10px] text-zinc-500 italic"
  }, "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435/\u0432\u0438\u0434\u0435\u043E, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u044F\u0432\u0438\u043B\u0441\u044F \u0442\u0435\u0433")), hasPrompt && /*#__PURE__*/_react["default"].createElement("textarea", {
    ref: textareaRef,
    value: formValues.prompt || "",
    onChange: function onChange(e) {
      return setFormValues(_objectSpread(_objectSpread({}, formValues), {}, {
        prompt: e.target.value
      }));
    },
    placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043F\u0440\u043E\u043C\u043F\u0442 \u0437\u0434\u0435\u0441\u044C...",
    rows: 3,
    className: "w-full bg-black/30 border border-blue-500/20 rounded-lg px-2 py-1.5 text-xs text-white placeholder-blue-300/30 focus:outline-none focus:border-blue-500/50 resize-none nodrag nowheel"
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-center flex-1 w-full h-full p-3"
  }, data.isLoading ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-2.5 w-full h-full overflow-hidden animate-pulse"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "h-2.5 bg-white/5 rounded-full w-full"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "h-2.5 bg-white/5 rounded-full w-[90%]"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "h-2.5 bg-white/5 rounded-full w-[75%]"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "my-1"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "h-2.5 bg-white/5 rounded-full w-full"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "h-2.5 bg-white/5 rounded-full w-[85%]"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "h-2.5 bg-white/5 rounded-full w-[60%]"
  })) : data.errorMsg ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "text-red-400 text-xs font-medium p-3 bg-red-500/10 rounded-xl border border-red-500/20 w-full"
  }, data.errorMsg || "Ошибка генерации") : currentOutput && !data.isLoading ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "relative flex flex-col gap-2 bg-zinc-900/30 rounded-xl border border-zinc-800/50 w-full h-full p-2"
  }, /*#__PURE__*/_react["default"].createElement("textarea", {
    ref: textareaRef,
    readOnly: true,
    value: currentOutput || "",
    placeholder: "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C...",
    className: "w-full h-full max-h-96 text-xs leading-relaxed outline-none bg-transparent resize-none text-zinc-100 overflow-hidden font-medium placeholder:italic placeholder:opacity-50"
  }), currentOutputList.length > 1 && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute -bottom-1 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black px-2 py-0.5 rounded-full border border-white/10 opacity-0 group-hover/text:opacity-100 transition-opacity"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick(e) {
      e.stopPropagation();
      setCurrentOutputIndex(function (prev) {
        return prev > 0 ? prev - 1 : currentOutputList.length - 1;
      });
    },
    className: "text-white hover:text-blue-400 p-0.5"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleLeft, {
    size: 12
  })), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] text-white/80 tabular-nums"
  }, currentOutputIndex + 1, "/", currentOutputList.length), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick(e) {
      e.stopPropagation();
      setCurrentOutputIndex(function (prev) {
        return prev < currentOutputList.length - 1 ? prev + 1 : 0;
      });
    },
    className: "text-white hover:text-blue-400 p-0.5"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleRight, {
    size: 12
  })))) : /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center justify-center gap-2"
  }, function () {
    var extra = Array.isArray(formValues.images_list) ? formValues.images_list.filter(Boolean) : [];
    var all = [].concat(_toConsumableArray(formValues.image_url ? [{
      url: formValues.image_url,
      primary: true,
      type: 'image'
    }] : []), _toConsumableArray(extra.map(function (u) {
      return {
        url: u,
        primary: false,
        type: 'image'
      };
    })), _toConsumableArray(formValues.face_thumbnail ? [{
      url: formValues.face_thumbnail,
      type: 'character'
    }] : []));
    if (!all.length) return null;
    var removeAt = function removeAt(item) {
      setFormValues(function (cfv) {
        var updated = _objectSpread({}, cfv);
        if (item.type === 'character') {
          updated.face_thumbnail = null;
          updated.face_asset = null;
          // Optional: also remove @token from prompt if we want to be thorough,
          // but usually the user handles prompt text manually in TextNode.
        } else if (item.primary) {
          var rest = Array.isArray(updated.images_list) ? updated.images_list.filter(Boolean) : [];
          updated.image_url = rest.length ? rest[0] : null;
          updated.images_list = rest.slice(1);
        } else {
          updated.images_list = (Array.isArray(updated.images_list) ? updated.images_list.filter(Boolean) : []).filter(function (u) {
            return u !== item.url;
          });
        }
        return updated;
      });
    };
    return /*#__PURE__*/_react["default"].createElement("div", {
      className: "w-full px-3 pb-2"
    }, /*#__PURE__*/_react["default"].createElement("p", {
      className: "text-[10px] font-semibold text-emerald-300 uppercase tracking-wider mb-1.5"
    }, "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043D\u044B\u0435 \u043E\u0431\u044A\u0435\u043A\u0442\u044B (", all.length, ")"), /*#__PURE__*/_react["default"].createElement("div", {
      className: "grid grid-cols-4 gap-1.5"
    }, all.map(function (item, i) {
      return /*#__PURE__*/_react["default"].createElement("div", {
        key: "".concat(item.url, "-").concat(i),
        className: "relative group/refimg rounded-lg overflow-hidden border bg-black aspect-square ".concat(item.type === 'character' ? 'border-purple-500/50 ring-1 ring-purple-500/20' : 'border-emerald-500/30')
      }, /*#__PURE__*/_react["default"].createElement("img", {
        src: item.url,
        alt: "ref",
        className: "w-full h-full object-cover"
      }), item.type === 'character' && /*#__PURE__*/_react["default"].createElement("div", {
        className: "absolute inset-0 bg-purple-600/10 pointer-events-none"
      }), /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        onClick: function onClick() {
          return removeAt(item);
        },
        className: "absolute top-0.5 right-0.5 bg-black hover:bg-black text-white rounded px-1 text-[10px] opacity-0 group-hover/refimg:opacity-100 transition-opacity z-10"
      }, "\xD7"), item.type === 'character' && /*#__PURE__*/_react["default"].createElement("div", {
        className: "absolute bottom-0 left-0 right-0 bg-purple-600/80 text-[7px] text-white font-bold py-0.5 text-center uppercase tracking-tighter"
      }, "\u041B\u0438\u0446\u043E"));
    })));
  }(), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center justify-center text-zinc-400 gap-2"
  }, /*#__PURE__*/_react["default"].createElement(_tfi.TfiText, {
    size: 32
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] italic"
  }, "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C..."))))), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "textInput",
    style: {
      top: 100,
      width: 14,
      height: 14,
      opacity: hasPrompt ? 1 : 0,
      pointerEvents: hasPrompt ? 'auto' : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    className: "\n          !rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.textInput ? '!bg-blue-500 !border-zinc-900 shadow-[0_0_15px_rgba(59,130,246,0.8)]' : '!bg-zinc-900 !border-blue-500/50 hover:!border-blue-500 shadow-sm', "\n        "),
    "data-type": "blue"
  }), hasPrompt && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-[10px] font-bold tracking-tight text-blue-500 transition-all duration-300 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "blue" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"),
    style: {
      top: 100,
      left: -40
    }
  }, "\u0422\u0415\u041A\u0421\u0422"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "textInput2",
    style: {
      top: 150,
      width: 14,
      height: 14,
      opacity: hasImageUrl ? 1 : 0,
      pointerEvents: hasImageUrl ? 'auto' : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    className: "\n          !rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.textInput2 ? '!bg-emerald-500 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : '!bg-zinc-900 !border-emerald-500/50 hover:!border-emerald-500 shadow-sm', "\n        "),
    "data-type": "green"
  }), hasImageUrl && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-[10px] font-bold tracking-tight text-emerald-500 transition-all duration-300 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "green" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"),
    style: {
      top: 150,
      left: -45
    }
  }, "\u0418\u0417\u041E\u0411\u0420\u0410\u0416\u0415\u041D\u0418\u0415"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "textInput3",
    style: {
      top: 200,
      width: 14,
      height: 14,
      opacity: hasImagesList ? 1 : 0,
      pointerEvents: hasImagesList ? 'auto' : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    className: "\n          !rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.textInput3 ? '!bg-emerald-500 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : '!bg-zinc-900 !border-emerald-500/50 hover:!border-emerald-500 shadow-sm', "\n        "),
    "data-type": "green"
  }), hasImagesList && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-[10px] font-bold tracking-tight text-emerald-500 transition-all duration-300 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "green" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"),
    style: {
      top: 200,
      left: -45
    }
  }, "\u0418\u0417\u041E\u0411\u0420\u0410\u0416\u0415\u041D\u0418\u0415"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "textInput4",
    style: {
      top: 250,
      width: 14,
      height: 14,
      opacity: hasSystemPrompt ? 1 : 0,
      pointerEvents: hasSystemPrompt ? 'auto' : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    className: "\n          !rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.textInput4 ? '!bg-blue-600 !border-zinc-900 shadow-[0_0_15px_rgba(37,99,235,0.8)]' : '!bg-zinc-900 !border-blue-600/50 hover:!border-blue-600 shadow-sm', "\n        "),
    "data-type": "blue"
  }), hasSystemPrompt && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-[10px] font-bold tracking-tight text-blue-600 transition-all duration-300 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "blue" ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"),
    style: {
      top: 250,
      left: -50
    }
  }, "\u0421\u0418\u0421\u0422\u0415\u041C\u041D\u042B\u0419"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "source",
    position: _reactflow.Position.Right,
    id: "textOutput",
    style: {
      top: 100,
      width: 14,
      height: 14,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    className: "\n          !rounded-full !border-[3px] !right-[-8px] transition-all\n          ".concat(connectedOutputs.textOutput ? '!bg-blue-500 !border-zinc-900 shadow-[0_0_15px_rgba(59,130,246,0.8)]' : '!bg-zinc-900 !border-blue-500/50 hover:!border-blue-500 shadow-sm', "\n        "),
    "data-type": "blue"
  }), /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-[10px] font-bold tracking-tight text-blue-500 transition-all duration-300 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "blue" ? "opacity-100 translate-x-0" : "opacity-0 translate-x-1 group-hover:opacity-100 group-hover:translate-x-0"),
    style: {
      top: 100,
      right: -40
    }
  }, "\u0422\u0415\u041A\u0421\u0422"));
};
var _default = exports["default"] = TextGeneration;
