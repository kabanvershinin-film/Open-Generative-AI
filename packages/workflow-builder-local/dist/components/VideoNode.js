"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _downloadFile = require("./file/downloadFile.js");
var _videoModels = require("./model-registry/videoModels.js");
var _stableStringify = require("./stableStringify.js");
var _react = _interopRequireWildcard(require("react"));
var _bs = require("react-icons/bs");
var _io = require("react-icons/io5");
var _reactflow = require("reactflow");
var _WorkflowStore = require("./WorkflowStore");
var _axios = _interopRequireDefault(require("axios"));
var _reactHotToast = require("react-hot-toast");
var _UploadNode = _interopRequireDefault(require("./UploadNode"));
var _sl = require("react-icons/sl");
var _md = require("react-icons/md");
var _NodeSendButton = _interopRequireDefault(require("./NodeSendButton"));
var _fa = require("react-icons/fa6");
var _NodeOptionsMenu = _interopRequireDefault(require("./NodeOptionsMenu"));
var _useGenerationCost2 = require("./useGenerationCost");
var _VideoPlayer = _interopRequireDefault(require("./VideoPlayer"));
var _seedanceWorkflowPayload = require("./seedanceWorkflowPayload.js");
var _connectedCharacterReferences = require("./connectedCharacterReferences.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t7 in e) "default" !== _t7 && {}.hasOwnProperty.call(e, _t7) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t7)) && (i.get || i.set) ? o(f, _t7, i) : f[_t7] = e[_t7]); return f; })(e, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
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
var inputHandles = ["videoInput",
// prompt
"videoInput2",
// image_url
"videoInput3",
// last_image
"videoInput4",
// video_url
"videoInput5",
// audio_url
"videoInput6",
// images_list
"videoInput7",
// videos_list, video_files
"videoInput8" // audios_list, audio_files
];
var outputHandles = ["videoOutput"];
var toAssetUri = function toAssetUri(val) {
  var s = String(val || "").trim();
  if (!s) return "";
  if (s.startsWith("asset://")) return s;
  if (s.startsWith("asset-")) return "asset://".concat(s);
  return s;
};
var VideoGeneration = function VideoGeneration(_ref) {
  var _data$runId, _nodeSchemas$categori, _data$selectedModel6, _data$selectedModel7, _data$selectedModel8, _data$selectedModel9, _data$selectedModel0, _data$selectedModel1, _data$selectedModel10, _data$selectedModel11, _outputHistory$curren, _currentOutputList$cu, _currentOutputList$, _selectedModel$id, _data$selectedModel12;
  var id = _ref.id,
    data = _ref.data,
    selected = _ref.selected;
  var models = (0, _react.useMemo)(function () {
    var _data$nodeSchemas;
    return (_data$nodeSchemas = data.nodeSchemas) !== null && _data$nodeSchemas !== void 0 && (_data$nodeSchemas = _data$nodeSchemas.categories) !== null && _data$nodeSchemas !== void 0 && (_data$nodeSchemas = _data$nodeSchemas.video) !== null && _data$nodeSchemas !== void 0 && _data$nodeSchemas.models ? Object.values(data.nodeSchemas.categories.video.models) : [];
  }, [data.nodeSchemas]);
  var _useState = (0, _react.useState)(data.selectedModel || models[1] || models[0] || {}),
    _useState2 = _slicedToArray(_useState, 2),
    selectedModel = _useState2[0],
    setSelectedModel = _useState2[1];
  var _useState3 = (0, _react.useState)({}),
    _useState4 = _slicedToArray(_useState3, 2),
    connectedInputs = _useState4[0],
    setConnectedInputs = _useState4[1];
  var _useState5 = (0, _react.useState)({}),
    _useState6 = _slicedToArray(_useState5, 2),
    connectedOutputs = _useState6[0],
    setConnectedOutputs = _useState6[1];
  var _useState7 = (0, _react.useState)(data.formValues || {}),
    _useState8 = _slicedToArray(_useState7, 2),
    formValues = _useState8[0],
    setFormValues = _useState8[1];
  var _useState9 = (0, _react.useState)(0),
    _useState0 = _slicedToArray(_useState9, 2),
    dropDown = _useState0[0],
    setDropDown = _useState0[1];
  var _useState1 = (0, _react.useState)(0),
    _useState10 = _slicedToArray(_useState1, 2),
    loading = _useState10[0],
    setLoading = _useState10[1];
  var _useState11 = (0, _react.useState)(-1),
    _useState12 = _slicedToArray(_useState11, 2),
    currentHistoryIndex = _useState12[0],
    setCurrentHistoryIndex = _useState12[1];
  var _useState13 = (0, _react.useState)(0),
    _useState14 = _slicedToArray(_useState13, 2),
    currentVideoIndex = _useState14[0],
    setCurrentVideoIndex = _useState14[1];
  var videoRef = (0, _react.useRef)(null);
  var outputHistory = data.outputHistory || [];
  var prevHistoryLengthRef = (0, _react.useRef)(outputHistory.length);
  var inFlightRef = (0, _react.useRef)(false); // guards against duplicate concurrent generation requests
  var pollIntervalRef = (0, _react.useRef)(null); // ref to current polling interval so it can be cancelled
  var arkCancelRef = (0, _react.useRef)(false); // set by Cancel to break the ARK browser poll loop
  var workflowId = (0, _WorkflowStore.getWorkflowId)();
  var runId = (_data$runId = data.runId) !== null && _data$runId !== void 0 ? _data$runId : (0, _WorkflowStore.getRunId)();
  var nodeSchemas = data.nodeSchemas || {};
  var _useReactFlow = (0, _reactflow.useReactFlow)(),
    setNodes = _useReactFlow.setNodes,
    setEdges = _useReactFlow.setEdges;
  var updateNodeInternals = (0, _reactflow.useUpdateNodeInternals)();
  var edges = (0, _reactflow.useStore)(function (state) {
    return state.edges;
  });
  var properties = nodeSchemas === null || nodeSchemas === void 0 || (_nodeSchemas$categori = nodeSchemas.categories) === null || _nodeSchemas$categori === void 0 || (_nodeSchemas$categori = _nodeSchemas$categori.video) === null || _nodeSchemas$categori === void 0 || (_nodeSchemas$categori = _nodeSchemas$categori.models) === null || _nodeSchemas$categori === void 0 || (_nodeSchemas$categori = _nodeSchemas$categori[selectedModel.id]) === null || _nodeSchemas$categori === void 0 || (_nodeSchemas$categori = _nodeSchemas$categori.input_schema) === null || _nodeSchemas$categori === void 0 || (_nodeSchemas$categori = _nodeSchemas$categori.schemas) === null || _nodeSchemas$categori === void 0 || (_nodeSchemas$categori = _nodeSchemas$categori.input_data) === null || _nodeSchemas$categori === void 0 ? void 0 : _nodeSchemas$categori.properties;
  var _useGenerationCost = (0, _useGenerationCost2.useGenerationCost)(selectedModel, formValues),
    generationCost = _useGenerationCost.generationCost,
    isRefreshingCost = _useGenerationCost.isRefreshingCost;
  var updateWorkflowThumbnail = /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee(thumbnail) {
      var workflow_id, response, _error$response, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            workflow_id = (0, _WorkflowStore.getWorkflowId)();
            if (workflow_id) {
              _context.n = 1;
              break;
            }
            _reactHotToast.toast.error("Workflow id not found");
            return _context.a(2);
          case 1:
            if (thumbnail) {
              _context.n = 2;
              break;
            }
            _reactHotToast.toast.error("Thumbnail URL is required");
            return _context.a(2);
          case 2:
            _context.p = 2;
            _context.n = 3;
            return _axios["default"].post("/api/workflow/".concat(workflow_id, "/thumbnail"), {
              thumbnail: thumbnail
            });
          case 3:
            response = _context.v;
            if (response.data.success) _reactHotToast.toast.success("Обложка успешно обновлена");
            _context.n = 5;
            break;
          case 4:
            _context.p = 4;
            _t = _context.v;
            _reactHotToast.toast.error(((_error$response = _t.response) === null || _error$response === void 0 || (_error$response = _error$response.data) === null || _error$response === void 0 ? void 0 : _error$response.detail) || "Не удалось сохранить обложку");
            console.error(_t);
          case 5:
            ;
          case 6:
            return _context.a(2);
        }
      }, _callee, null, [[2, 4]]);
    }));
    return function updateWorkflowThumbnail(_x) {
      return _ref2.apply(this, arguments);
    };
  }();
  (0, _react.useEffect)(function () {
    if (data.cost !== generationCost) {
      data.onDataChange(id, {
        cost: generationCost
      });
    }
  }, [id, generationCost, data.cost]);
  var _initializeFormData = function initializeFormData(schemaProperties) {
    var initialData = {};
    var fieldEntries = Object.entries(schemaProperties || {});
    fieldEntries.forEach(function (_ref3) {
      var _ref4 = _slicedToArray(_ref3, 2),
        fieldName = _ref4[0],
        fieldSchema = _ref4[1];
      if (fieldSchema.type === "array") {
        var _fieldSchema$items;
        if (((_fieldSchema$items = fieldSchema.items) === null || _fieldSchema$items === void 0 ? void 0 : _fieldSchema$items.type) === "object") {
          var examples = fieldSchema.examples;
          if (Array.isArray(examples) && examples.length > 0) {
            initialData[fieldName] = examples.map(function (ex) {
              return _objectSpread({}, ex);
            });
          } else {
            initialData[fieldName] = [];
          }
        } else {
          initialData[fieldName] = fieldSchema.examples || [];
        }
      } else if (fieldSchema.type === "object") {
        var nestedProps = fieldSchema.properties || {};
        initialData[fieldName] = _initializeFormData(nestedProps);
      } else if (fieldSchema["default"] !== undefined) {
        initialData[fieldName] = fieldSchema["default"];
      } else if (fieldSchema.examples && fieldSchema.examples.length > 0) {
        initialData[fieldName] = fieldSchema.examples[0];
      } else {
        switch (fieldSchema.type) {
          case "boolean":
            initialData[fieldName] = false;
            break;
          case "int":
          case "number":
            initialData[fieldName] = 0;
            break;
          default:
            initialData[fieldName] = "";
        }
      }
    });
    return initialData;
  };
  var addFormValuesInTaskData = function addFormValuesInTaskData(properties) {
    var defaults = _initializeFormData(properties);
    var validKeys = Object.keys(properties);
    var filteredFormValues = Object.entries(data.formValues || {}).reduce(function (acc, _ref5) {
      var _ref6 = _slicedToArray(_ref5, 2),
        key = _ref6[0],
        val = _ref6[1];
      if (validKeys.includes(key)) acc[key] = val;
      return acc;
    }, {});

    // const merged = { ...defaults, ...filteredFormValues };
    var merged = Object.entries(_objectSpread(_objectSpread({}, defaults), filteredFormValues)).reduce(function (acc, _ref7) {
      var _ref8 = _slicedToArray(_ref7, 2),
        key = _ref8[0],
        val = _ref8[1];
      var meta = properties[key];
      if (meta !== null && meta !== void 0 && meta["enum"] && !meta["enum"].includes(val)) {
        var _ref9, _meta$default;
        acc[key] = (_ref9 = (_meta$default = meta["default"]) !== null && _meta$default !== void 0 ? _meta$default : meta["enum"][0]) !== null && _ref9 !== void 0 ? _ref9 : "";
      } else {
        acc[key] = val;
      }
      return acc;
    }, {});

    // Preserve UI-only flags that are not part of the model schema
    var UI_KEYS = ["make_output", "make_input", "face_asset", "face_thumbnail"];
    UI_KEYS.forEach(function (k) {
      var _data$formValues;
      if (((_data$formValues = data.formValues) === null || _data$formValues === void 0 ? void 0 : _data$formValues[k]) !== undefined) merged[k] = data.formValues[k];
    });
    setFormValues(merged);
  };
  (0, _react.useEffect)(function () {
    if (properties) {
      addFormValuesInTaskData(properties);
    }
  }, [data.formValues, properties]);
  (0, _react.useEffect)(function () {
    setLoading(1);
    if (properties) {
      addFormValuesInTaskData(properties);
    }
    setLoading(0);
  }, [selectedModel]);
  (0, _react.useEffect)(function () {
    if (data.selectedModel) {
      setSelectedModel(data.selectedModel);
    }
    if (data.outputHistory && data.outputHistory.length > 0) {
      if (currentHistoryIndex === -1) {
        setCurrentHistoryIndex(data.outputHistory.length - 1);
        setCurrentVideoIndex(0);
      } else if (data.outputHistory.length > prevHistoryLengthRef.current) {
        setCurrentHistoryIndex(data.outputHistory.length - 1);
        setCurrentVideoIndex(0);
      }
    }
    prevHistoryLengthRef.current = data.outputHistory ? data.outputHistory.length : 0;
  }, [data.selectedModel, data.outputHistory]);

  // Run trigger in its OWN effect, keyed ONLY on data.triggerRun. The combined
  // effect above also fired on selectedModel/outputHistory changes, so while a
  // run was in flight (which bumps outputHistory) it re-entered handleRunSingleNode
  // with triggerRun still true → a second call hit the inFlightRef guard and got
  // stuck on "Генерация уже идёт". Reset triggerRun FIRST so it's consumed once.
  (0, _react.useEffect)(function () {
    if (!data.triggerRun) return;
    data.onDataChange(id, {
      triggerRun: false
    });
    handleRunSingleNode();
  }, [data.triggerRun]);
  (0, _react.useEffect)(function () {
    updateNodeInternals(id);
  }, [formValues, id, selectedModel]);
  var handleChange = function handleChange(key, value) {
    setFormValues(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, value));
    });
    setDropDown(-1);
  };
  (0, _react.useEffect)(function () {
    if (!data.formValues) return;
    // Key-order-independent compare so a parent rebuild with the same content
    // doesn't look "different" and pull us into a sync loop (React #185).
    if ((0, _stableStringify.stableStringify)(data.formValues) === (0, _stableStringify.stableStringify)(formValues)) return;
    var timer = setTimeout(function () {
      if (Object.entries(data.formValues || {}).length > 0) {
        setFormValues(data.formValues);
      }
    }, 200);
    return function () {
      return clearTimeout(timer);
    };
  }, [data.formValues]);
  var lastSentRef = (0, _react.useRef)(null);
  (0, _react.useEffect)(function () {
    var _data$selectedModel, _data$selectedModel2;
    if (!(data !== null && data !== void 0 && data.onDataChange) || (data === null || data === void 0 || (_data$selectedModel = data.selectedModel) === null || _data$selectedModel === void 0 ? void 0 : _data$selectedModel.id) === "video-passthrough") return;
    var localSig = (0, _stableStringify.stableStringify)(formValues);
    var parentSig = (0, _stableStringify.stableStringify)(data.formValues || {});
    var sameModel = (selectedModel === null || selectedModel === void 0 ? void 0 : selectedModel.id) === ((_data$selectedModel2 = data.selectedModel) === null || _data$selectedModel2 === void 0 ? void 0 : _data$selectedModel2.id);

    // Echo suppression: if the parent already holds exactly this state, sending
    // it back would just bounce through onDataChange <-> formValues forever
    // (React #185 — an array field like videos_list churns its reference).
    if (sameModel && localSig === parentSig) {
      lastSentRef.current = localSig;
      return;
    }
    if (sameModel && localSig === lastSentRef.current) return;
    lastSentRef.current = localSig;
    data.onDataChange(id, {
      selectedModel: selectedModel,
      formValues: formValues,
      loading: loading
    });
  }, [selectedModel, formValues, loading, data.formValues, data.selectedModel]);
  var stopPoll = function stopPoll() {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };
  var pollNodeStatus = function pollNodeStatus(run_id) {
    var attempts = 0;
    var MAX_ATTEMPTS = 360; // 360 × 500ms = 3 minutes max
    var _check = function _check() {
      if (++attempts > MAX_ATTEMPTS) {
        stopPoll();
        data.onDataChange(id, {
          isLoading: false,
          errorMsg: "Превышено время ожидания генерации"
        });
        _reactHotToast.toast.error("\u0412\u0440\u0435\u043C\u044F \u043E\u0436\u0438\u0434\u0430\u043D\u0438\u044F \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u0432\u0438\u0434\u0435\u043E \u0438\u0441\u0442\u0435\u043A\u043B\u043E");
        return;
      }
      _axios["default"].get("/api/workflow/run/".concat(run_id, "/status")).then(function (response) {
        var _Object$entries$find;
        var nodesInRes = response.data.nodes || {};
        var nodeData = nodesInRes[id] || ((_Object$entries$find = Object.entries(nodesInRes).find(function (_ref0) {
          var _ref1 = _slicedToArray(_ref0, 1),
            key = _ref1[0];
          return key.toLowerCase().replace(/\s+/g, '') === id.toLowerCase().replace(/\s+/g, '');
        })) === null || _Object$entries$find === void 0 ? void 0 : _Object$entries$find[1]);
        if (!nodeData || nodeData.length === 0) return;
        var latest = nodeData[nodeData.length - 1];
        if (latest.status === "succeeded" || latest.status === "completed") {
          var _output$, _data$onDataChange;
          var output = latest.result.outputs;
          var val = ((_output$ = output[0]) === null || _output$ === void 0 ? void 0 : _output$.value) || "";
          var currentHistory = data.outputHistory || [];
          var result = latest.result;
          var isAlreadyInHistory = currentHistory.some(function (h) {
            var _h$result;
            return ((_h$result = h.result) === null || _h$result === void 0 ? void 0 : _h$result.id) === result.id;
          });
          var newHistory = isAlreadyInHistory ? currentHistory.map(function (h) {
            var _h$result2;
            return ((_h$result2 = h.result) === null || _h$result2 === void 0 ? void 0 : _h$result2.id) === result.id ? latest : h;
          }) : [].concat(_toConsumableArray(currentHistory), [latest]);
          data === null || data === void 0 || (_data$onDataChange = data.onDataChange) === null || _data$onDataChange === void 0 || _data$onDataChange.call(data, id, {
            outputs: output,
            resultUrl: val,
            isLoading: false,
            errorMsg: null,
            outputHistory: newHistory
          });
          setCurrentHistoryIndex(newHistory.length - 1);
          setCurrentVideoIndex(0);
          stopPoll();
        }
        if (latest.status === "failed") {
          var _latest$result, _outputs$;
          var outputs = latest === null || latest === void 0 || (_latest$result = latest.result) === null || _latest$result === void 0 ? void 0 : _latest$result.outputs;
          var errorMsg = "Ошибка генерации";
          if (outputs && (_outputs$ = outputs[0]) !== null && _outputs$ !== void 0 && (_outputs$ = _outputs$.value) !== null && _outputs$ !== void 0 && _outputs$.error) {
            errorMsg = outputs[0].value.error;
          }
          _reactHotToast.toast.error("\u041D\u043E\u0434\u0430 ".concat(id, " \u043E\u0448\u0438\u0431\u043A\u0430"));
          var _currentHistory = data.outputHistory || [];
          data.onDataChange(id, {
            isLoading: false,
            errorMsg: errorMsg,
            outputHistory: _currentHistory
          });
          stopPoll();
        }
      })["catch"](function (error) {
        console.log(error);
        stopPoll();
        data.onDataChange(id, {
          isLoading: false
        });
        _reactHotToast.toast.error("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441 \u0432\u0438\u0434\u0435\u043E ".concat(id.replace(/^\D+/g, "")));
      });
    };
    _check();
    pollIntervalRef.current = setInterval(_check, 500);
  };
  var handleCancelGeneration = function handleCancelGeneration() {
    stopPoll();
    arkCancelRef.current = true; // break the ARK browser poll loop on its next tick
    inFlightRef.current = false;
    data.onDataChange(id, {
      isLoading: false
    });
    (0, _reactHotToast.toast)("Генерация остановлена", {
      icon: "🛑"
    });
  };

  // Seedance 2.0 — submit-and-poll FROM THE BROWSER via /api/ark/seedance,
  // EXACTLY like the Studio (packages/studio → generateSeedanceArk). The Studio
  // generates Seedance reliably through this same route — including the character
  // face reference (`face_asset`, e.g. an asset://… trusted asset) — so the
  // workflow node uses the identical path. The blocking workflow /run route holds
  // one HTTP connection up to ~290s (Vercel drops it → node stuck on
  // "GENERATING…"); the short submit + poll requests here never hang.
  var runArkSeedanceBrowser = /*#__PURE__*/function () {
    var _ref10 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
      var _data$graphState, _data$graphState2, _submit$data, _submit$data2, _submit$data3, _data$selectedModel3;
      var _ref11, getNodes, getEdges, nodes, edges, findConnectedAssets, allAssets, connectedImages, connectedFaceAssets, uniqueVideos, uniqueAudios, fast, src, body, finalImages, facesFound, submit, _e$response, _e$response2, _e$response3, _e$response4, _d$required, _d$balance, d, apiError, taskId, bill, billQs, finishedUrl, pollErrors, attempt, _pd, pd, poll, _e$response5, status, histId, output, newHistory, _t2, _t3;
      return _regenerator().w(function (_context3) {
        while (1) switch (_context3.p = _context3.n) {
          case 0:
            _ref11 = data.reactFlowInstance || {}, getNodes = _ref11.getNodes, getEdges = _ref11.getEdges;
            nodes = ((_data$graphState = data.graphState) === null || _data$graphState === void 0 ? void 0 : _data$graphState.nodes) || (getNodes ? getNodes() : []);
            edges = ((_data$graphState2 = data.graphState) === null || _data$graphState2 === void 0 ? void 0 : _data$graphState2.edges) || (getEdges ? getEdges() : []);
            findConnectedAssets = function findConnectedAssets() {
              var incoming = edges.filter(function (e) {
                return e.target === id;
              });
              var assets = {
                images: [],
                videos: [],
                audios: []
              };
              var seen = new Set();
              var _processSource = function processSource(sourceId) {
                if (seen.has(sourceId)) return;
                seen.add(sourceId);
                var sourceNode = nodes.find(function (n) {
                  return n.id === sourceId;
                });
                if (!sourceNode) return;
                if (sourceNode.type === "characterNode") {
                  return;
                }
                if (sourceNode.type === "imageNode" || sourceNode.type === "uploadNode") {
                  var _sourceNode$data, _sourceNode$data2;
                  var url = ((_sourceNode$data = sourceNode.data) === null || _sourceNode$data === void 0 ? void 0 : _sourceNode$data.resultUrl) || ((_sourceNode$data2 = sourceNode.data) === null || _sourceNode$data2 === void 0 || (_sourceNode$data2 = _sourceNode$data2.outputs) === null || _sourceNode$data2 === void 0 || (_sourceNode$data2 = _sourceNode$data2[0]) === null || _sourceNode$data2 === void 0 ? void 0 : _sourceNode$data2.value);
                  if (url) assets.images.push({
                    url: url
                  });
                } else if (sourceNode.type === "videoNode") {
                  var _sourceNode$data3, _sourceNode$data4;
                  var _url = ((_sourceNode$data3 = sourceNode.data) === null || _sourceNode$data3 === void 0 ? void 0 : _sourceNode$data3.resultUrl) || ((_sourceNode$data4 = sourceNode.data) === null || _sourceNode$data4 === void 0 || (_sourceNode$data4 = _sourceNode$data4.outputs) === null || _sourceNode$data4 === void 0 || (_sourceNode$data4 = _sourceNode$data4[0]) === null || _sourceNode$data4 === void 0 ? void 0 : _sourceNode$data4.value);
                  if (_url) assets.videos.push(_url);
                } else if (sourceNode.type === "audioNode") {
                  var _sourceNode$data5, _sourceNode$data6;
                  var _url2 = ((_sourceNode$data5 = sourceNode.data) === null || _sourceNode$data5 === void 0 ? void 0 : _sourceNode$data5.resultUrl) || ((_sourceNode$data6 = sourceNode.data) === null || _sourceNode$data6 === void 0 || (_sourceNode$data6 = _sourceNode$data6.outputs) === null || _sourceNode$data6 === void 0 || (_sourceNode$data6 = _sourceNode$data6[0]) === null || _sourceNode$data6 === void 0 ? void 0 : _sourceNode$data6.value);
                  if (_url2) assets.audios.push(_url2);
                } else if (["concatNode", "seedancePromptNode"].includes(sourceNode.type)) {
                  var subEdges = edges.filter(function (e) {
                    return e.target === sourceId;
                  });
                  subEdges.forEach(function (se) {
                    return _processSource(se.source);
                  });
                }
              };
              incoming.forEach(function (edge) {
                return _processSource(edge.source);
              });
              return assets;
            };
            allAssets = findConnectedAssets();
            connectedImages = allAssets.images;
            connectedFaceAssets = (0, _connectedCharacterReferences.collectConnectedCharacterReferences)({
              nodeId: id,
              nodes: nodes,
              edges: edges
            }).map(function (character) {
              var asset = toAssetUri(character.asset || character.photo || "");
              if (!asset) return null;
              return {
                uri: asset,
                thumbnail: character.photo || null
              };
            }).filter(Boolean);
            uniqueVideos = Array.from(new Set(allAssets.videos));
            uniqueAudios = Array.from(new Set(allAssets.audios));
            console.log('[VideoNode] Connected assets found:', {
              faceCount: connectedFaceAssets.length,
              imageCount: connectedImages.length,
              uniqueVideos: uniqueVideos,
              uniqueAudios: uniqueAudios
            });
            fast = /fast/.test("".concat((selectedModel === null || selectedModel === void 0 ? void 0 : selectedModel.id) || "", " ").concat((selectedModel === null || selectedModel === void 0 ? void 0 : selectedModel.name) || "").toLowerCase());
            src = formValues || {};
            body = (0, _seedanceWorkflowPayload.buildSeedanceWorkflowBody)({
              fast: fast,
              prompt: src.prompt || "",
              connectedImages: connectedImages,
              connectedFaceAssets: connectedFaceAssets,
              uniqueVideos: uniqueVideos,
              uniqueAudios: uniqueAudios,
              formValues: src
            });
            finalImages = body.image_urls || [];
            if (finalImages.length > 0) {
              facesFound = finalImages.filter(function (img) {
                return String((img === null || img === void 0 ? void 0 : img.url) || "").startsWith("asset://");
              }).length;
              (0, _reactHotToast.toast)("\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u044E: ".concat(facesFound, " \u043B\u0438\u0446, ").concat(finalImages.length, " \u0444\u043E\u0442\u043E"), {
                icon: "🎨"
              });
            }
            console.log('[VideoNode] Submitting to Ark:', body);

            // Step 1: submit — fast, just creates the Ark task and returns a taskId.
            _context3.p = 1;
            _context3.n = 2;
            return _axios["default"].post("/api/ark/seedance", body);
          case 2:
            submit = _context3.v;
            _context3.n = 5;
            break;
          case 3:
            _context3.p = 3;
            _t2 = _context3.v;
            if (!(((_e$response = _t2.response) === null || _e$response === void 0 ? void 0 : _e$response.status) === 402)) {
              _context3.n = 4;
              break;
            }
            d = _t2.response.data || {};
            throw new Error("\u041D\u0435\u0434\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u0441\u0440\u0435\u0434\u0441\u0442\u0432. \u041D\u0443\u0436\u043D\u043E ".concat((_d$required = d.required) !== null && _d$required !== void 0 ? _d$required : "", "\u20BD, \u043D\u0430 \u0431\u0430\u043B\u0430\u043D\u0441\u0435 ").concat((_d$balance = d.balance) !== null && _d$balance !== void 0 ? _d$balance : 0, "\u20BD."));
          case 4:
            apiError = ((_e$response2 = _t2.response) === null || _e$response2 === void 0 || (_e$response2 = _e$response2.data) === null || _e$response2 === void 0 ? void 0 : _e$response2.error) || ((_e$response3 = _t2.response) === null || _e$response3 === void 0 || (_e$response3 = _e$response3.data) === null || _e$response3 === void 0 ? void 0 : _e$response3.message);
            throw new Error(apiError ? "API Error: ".concat(apiError) : "ARK submit ".concat(((_e$response4 = _t2.response) === null || _e$response4 === void 0 ? void 0 : _e$response4.status) || "", ": ").concat(_t2.message));
          case 5:
            taskId = (_submit$data = submit.data) === null || _submit$data === void 0 ? void 0 : _submit$data.taskId;
            if (taskId) {
              _context3.n = 6;
              break;
            }
            throw new Error(((_submit$data2 = submit.data) === null || _submit$data2 === void 0 ? void 0 : _submit$data2.error) || "ARK: задача не создана (нет taskId).");
          case 6:
            // Signed charge token — echoed back to the poll so an async failure refunds.
            bill = (_submit$data3 = submit.data) === null || _submit$data3 === void 0 ? void 0 : _submit$data3.bill;
            billQs = bill ? "&bill=".concat(encodeURIComponent(bill)) : ""; // Step 2: poll from the browser — each request is < 1s, so no connection hangs.
            finishedUrl = null;
            pollErrors = 0;
            attempt = 0;
          case 7:
            if (!(attempt < 300)) {
              _context3.n = 19;
              break;
            }
            if (!arkCancelRef.current) {
              _context3.n = 8;
              break;
            }
            arkCancelRef.current = false;
            return _context3.a(2);
          case 8:
            _context3.n = 9;
            return new Promise(function (r) {
              return setTimeout(r, 5000);
            });
          case 9:
            if (!arkCancelRef.current) {
              _context3.n = 10;
              break;
            }
            arkCancelRef.current = false;
            return _context3.a(2);
          case 10:
            pd = void 0;
            _context3.p = 11;
            _context3.n = 12;
            return _axios["default"].get("/api/ark/seedance?taskId=".concat(encodeURIComponent(taskId)).concat(billQs));
          case 12:
            poll = _context3.v;
            pd = poll.data;
            pollErrors = 0;
            _context3.n = 15;
            break;
          case 13:
            _context3.p = 13;
            _t3 = _context3.v;
            if (!(++pollErrors >= 12)) {
              _context3.n = 14;
              break;
            }
            throw new Error(((_e$response5 = _t3.response) === null || _e$response5 === void 0 || (_e$response5 = _e$response5.data) === null || _e$response5 === void 0 ? void 0 : _e$response5.error) || "ARK: опрос статуса не отвечает.");
          case 14:
            return _context3.a(3, 18);
          case 15:
            status = String(((_pd = pd) === null || _pd === void 0 ? void 0 : _pd.status) || "").toLowerCase();
            if (!(status === "succeeded" || status === "success" || status === "completed")) {
              _context3.n = 17;
              break;
            }
            if (pd.url) {
              _context3.n = 16;
              break;
            }
            throw new Error("ARK: видео готово, но URL не получен.");
          case 16:
            finishedUrl = pd.url;
            return _context3.a(3, 19);
          case 17:
            if (!["failed", "error", "expired", "cancelled"].includes(status)) {
              _context3.n = 18;
              break;
            }
            throw new Error("ARK: \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F \u043D\u0435 \u0443\u0434\u0430\u043B\u0430\u0441\u044C (".concat(pd.error || status, ")."));
          case 18:
            attempt++;
            _context3.n = 7;
            break;
          case 19:
            if (finishedUrl) {
              _context3.n = 20;
              break;
            }
            throw new Error("ARK: превышено время ожидания генерации.");
          case 20:
            // Показываем результат СРАЗУ с ARK-ссылкой — не ждём TOS-зеркалирования.
            histId = taskId;
            output = [{
              type: "video_url",
              value: finishedUrl
            }];
            newHistory = [].concat(_toConsumableArray(data.outputHistory || []), [{
              status: "succeeded",
              result: {
                id: histId,
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
            setCurrentVideoIndex(0);
            updateWorkflowThumbnail(finishedUrl);

            // Сохраняем в Галерею (как Студия) — /api/gallery сам зеркалирует в TOS и
            // добавляет запись в gallery/{userId}/entries.json. Браузерный ARK-путь
            // минует серверный /run, который обычно это делает, поэтому зовём явно.
            // keepalive:true — запрос переживёт переход на другую страницу (напр. если
            // пользователь сразу уходит в «Галерею»), иначе fire-and-forget POST
            // прерывался навигацией и запись в галерею не создавалась.
            fetch("/api/gallery", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              keepalive: true,
              body: JSON.stringify({
                url: finishedUrl,
                type: "video",
                model: (selectedModel === null || selectedModel === void 0 ? void 0 : selectedModel.id) || ((_data$selectedModel3 = data.selectedModel) === null || _data$selectedModel3 === void 0 ? void 0 : _data$selectedModel3.id) || "",
                prompt: src.prompt || ""
              })
            }).then(/*#__PURE__*/function () {
              var _ref12 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2(r) {
                var err;
                return _regenerator().w(function (_context2) {
                  while (1) switch (_context2.n) {
                    case 0:
                      if (r.ok) {
                        _context2.n = 2;
                        break;
                      }
                      _context2.n = 1;
                      return r.json()["catch"](function () {
                        return {};
                      });
                    case 1:
                      err = _context2.v;
                      _reactHotToast.toast.error("Не удалось сохранить в галерею: " + (err.error || r.status), {
                        duration: 4000
                      });
                    case 2:
                      return _context2.a(2);
                  }
                }, _callee2);
              }));
              return function (_x2) {
                return _ref12.apply(this, arguments);
              };
            }())["catch"](function (e) {
              _reactHotToast.toast.error("Не удалось сохранить в галерею: " + (e.message || "ошибка"), {
                duration: 4000
              });
            });

            // В фоне зеркалируем в TOS для постоянного хранения.
            // Если получится — тихо заменяем CDN URL на постоянный TOS URL и
            // сохраняем воркфлоу ещё раз, чтобы в БД лежала постоянная ссылка,
            // а не истекающий ARK CDN URL.
            _axios["default"].post("/api/upload-file", {
              url: finishedUrl
            }).then(function (mirror) {
              var _mirror$data, _data$handleSaveWorkF;
              var tosUrl = (_mirror$data = mirror.data) === null || _mirror$data === void 0 ? void 0 : _mirror$data.url;
              if (!tosUrl) return;
              var tosOutput = [{
                type: "video_url",
                value: tosUrl
              }];
              var tosHistory = newHistory.map(function (h) {
                var _h$result3;
                return ((_h$result3 = h.result) === null || _h$result3 === void 0 ? void 0 : _h$result3.id) === histId ? _objectSpread(_objectSpread({}, h), {}, {
                  result: _objectSpread(_objectSpread({}, h.result), {}, {
                    outputs: tosOutput
                  })
                }) : h;
              });
              data.onDataChange(id, {
                outputs: tosOutput,
                resultUrl: tosUrl,
                outputHistory: tosHistory
              });
              // onDataChange обновил currentNodesRef синхронно — теперь сохраняем
              // воркфлоу с постоянным TOS URL вместо истекающей ARK CDN ссылки.
              (_data$handleSaveWorkF = data.handleSaveWorkFlow) === null || _data$handleSaveWorkF === void 0 || _data$handleSaveWorkF.call(data);
            })["catch"](function () {/* ARK URL остаётся */});
          case 21:
            return _context3.a(2);
        }
      }, _callee3, null, [[11, 13], [1, 3]]);
    }));
    return function runArkSeedanceBrowser() {
      return _ref10.apply(this, arguments);
    };
  }();
  var handleRunSingleNode = /*#__PURE__*/function () {
    var _ref13 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4() {
      var _data$selectedModel4, _data$selectedModel5, _nodeSchemas$categori2, modelHay, isSeedance, _data$handleSaveWorkF2, _e$message, _e$message2, workflow_id, modelSchema, params, inputSchema, localSources, _i, _Object$entries, _Object$entries$_i, key, meta, _meta$default2, response, _r, _nd, _lt, _o, videoUrl, _error$response2, _t4, _t5;
      return _regenerator().w(function (_context4) {
        while (1) switch (_context4.p = _context4.n) {
          case 0:
            if (!inFlightRef.current) {
              _context4.n = 2;
              break;
            }
            if (data.isLoading) {
              _context4.n = 1;
              break;
            }
            inFlightRef.current = false;
            _context4.n = 2;
            break;
          case 1:
            (0, _reactHotToast.toast)("Генерация уже идёт — подождите завершения", {
              icon: "⏳"
            });
            return _context4.a(2);
          case 2:
            inFlightRef.current = true;
            arkCancelRef.current = false;
            _context4.p = 3;
            data.onDataChange(id, {
              isLoading: true
            });

            // Seedance 2.0 → browser submit-and-poll via /api/ark/seedance (same path
            // as the Studio). Bypasses the blocking workflow /run route that hangs the
            // node, and carries face_asset so the character reference works.
            // Robust detection: match the model id OR display name in any format
            // ("doubao-seedance-2-0-fast-260128", "Seedance 2.0 Fast", …).
            modelHay = "".concat((selectedModel === null || selectedModel === void 0 ? void 0 : selectedModel.id) || "", " ").concat((selectedModel === null || selectedModel === void 0 ? void 0 : selectedModel.name) || "", " ").concat(((_data$selectedModel4 = data.selectedModel) === null || _data$selectedModel4 === void 0 ? void 0 : _data$selectedModel4.id) || "", " ").concat(((_data$selectedModel5 = data.selectedModel) === null || _data$selectedModel5 === void 0 ? void 0 : _data$selectedModel5.name) || "").toLowerCase();
            isSeedance = /seedance[\s-]*2/.test(modelHay);
            if (!isSeedance) {
              _context4.n = 8;
              break;
            }
            _context4.p = 4;
            _context4.n = 5;
            return runArkSeedanceBrowser();
          case 5:
            // Save immediately so the result survives SPA navigation.
            // currentNodesRef in NodeFlow was already updated synchronously inside
            // onDataChange, so buildWorkflowPayload captures the correct resultUrl
            // even if the React setNodes update was cancelled by concurrent mode.
            (_data$handleSaveWorkF2 = data.handleSaveWorkFlow) === null || _data$handleSaveWorkF2 === void 0 || _data$handleSaveWorkF2.call(data);
            _context4.n = 7;
            break;
          case 6:
            _context4.p = 6;
            _t4 = _context4.v;
            data.onDataChange(id, {
              isLoading: false,
              errorMsg: ((_e$message = _t4.message) === null || _e$message === void 0 ? void 0 : _e$message.slice(0, 120)) || "Ошибка генерации"
            });
            _reactHotToast.toast.error(((_e$message2 = _t4.message) === null || _e$message2 === void 0 ? void 0 : _e$message2.slice(0, 80)) || "Ошибка генерации");
          case 7:
            return _context4.a(2);
          case 8:
            _context4.n = 9;
            return data.handleSaveWorkFlow();
          case 9:
            workflow_id = _context4.v;
            if (workflow_id) {
              _context4.n = 10;
              break;
            }
            _reactHotToast.toast.error("Не удалось сохранить воркфлоу перед запуском ноды");
            data.onDataChange(id, {
              isLoading: false
            });
            return _context4.a(2);
          case 10:
            modelSchema = nodeSchemas === null || nodeSchemas === void 0 || (_nodeSchemas$categori2 = nodeSchemas.categories) === null || _nodeSchemas$categori2 === void 0 || (_nodeSchemas$categori2 = _nodeSchemas$categori2.video) === null || _nodeSchemas$categori2 === void 0 || (_nodeSchemas$categori2 = _nodeSchemas$categori2.models[selectedModel.id]) === null || _nodeSchemas$categori2 === void 0 || (_nodeSchemas$categori2 = _nodeSchemas$categori2.input_schema) === null || _nodeSchemas$categori2 === void 0 || (_nodeSchemas$categori2 = _nodeSchemas$categori2.schemas) === null || _nodeSchemas$categori2 === void 0 ? void 0 : _nodeSchemas$categori2.input_data;
            if (!(!modelSchema || !modelSchema.properties)) {
              _context4.n = 11;
              break;
            }
            _reactHotToast.toast.error("Схема входных данных для этой модели не найдена");
            data.onDataChange(id, {
              isLoading: false
            });
            return _context4.a(2);
          case 11:
            params = {};
            inputSchema = modelSchema.properties;
            localSources = formValues || {};
            for (_i = 0, _Object$entries = Object.entries(inputSchema); _i < _Object$entries.length; _i++) {
              _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2), key = _Object$entries$_i[0], meta = _Object$entries$_i[1];
              if (localSources.hasOwnProperty(key)) {
                params[key] = localSources[key];
              } else {
                params[key] = (_meta$default2 = meta["default"]) !== null && _meta$default2 !== void 0 ? _meta$default2 : null;
              }
            }
            // face_asset isn't in the schema — carry it through when present.
            if (localSources.face_asset) params.face_asset = localSources.face_asset;
            _context4.n = 12;
            return _axios["default"].post("/api/workflow/".concat(workflow_id, "/node/").concat(id, "/run"), {
              run_id: runId,
              model: selectedModel.id,
              params: params,
              cost: generationCost,
              node_id: "AI Video"
            });
          case 12:
            response = _context4.v;
            _r = response.data;
            _nd = _r && _r.nodes && (_r.nodes[id] || Object.values(_r.nodes)[0]);
            _lt = _nd && _nd[_nd.length - 1];
            if (_lt && (_lt.status === "succeeded" || _lt.status === "completed") && _lt.result && _lt.result.outputs) {
              _o = _lt.result.outputs;
              videoUrl = _o[0] && _o[0].value || "";
              data && data.onDataChange && data.onDataChange(id, {
                outputs: _o,
                resultUrl: videoUrl,
                isLoading: false,
                errorMsg: null,
                outputHistory: (data.outputHistory || []).concat([_lt])
              });
              updateWorkflowThumbnail(videoUrl);
            } else if (_lt && _lt.status === "failed") {
              data && data.onDataChange && data.onDataChange(id, {
                isLoading: false,
                errorMsg: "Ошибка генерации"
              });
            } else {
              pollNodeStatus(_r.run_id);
            }
            _context4.n = 14;
            break;
          case 13:
            _context4.p = 13;
            _t5 = _context4.v;
            data.onDataChange(id, {
              isLoading: false
            });
            _reactHotToast.toast.error(((_error$response2 = _t5.response) === null || _error$response2 === void 0 || (_error$response2 = _error$response2.data) === null || _error$response2 === void 0 ? void 0 : _error$response2.detail) || "Ошибка при запуске ноды");
            console.error(_t5);
          case 14:
            _context4.p = 14;
            inFlightRef.current = false;
            return _context4.f(14);
          case 15:
            ;
          case 16:
            return _context4.a(2);
        }
      }, _callee4, null, [[4, 6], [3, 13, 14, 15]]);
    }));
    return function handleRunSingleNode() {
      if (inFlightRef.current) return Promise.resolve();
      inFlightRef.current = true;
      return _ref13.apply(this, arguments)["finally"](function () { inFlightRef.current = false; });
    };
  }();
  var handleDeleteNode = function handleDeleteNode() {
    if (window.confirm("\u0412\u044B \u0443\u0432\u0435\u0440\u0435\u043D\u044B, \u0447\u0442\u043E \u0445\u043E\u0442\u0438\u0442\u0435 \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u043D\u043E\u0434\u0443 ".concat(id, "?"))) {
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
      _reactHotToast.toast.success("\u041D\u043E\u0434\u0430 ".concat(id, " \u0443\u0434\u0430\u043B\u0435\u043D\u0430"));
    }
    ;
  };
  var hasPrompt = properties && "prompt" in properties && !((_data$selectedModel6 = data.selectedModel) !== null && _data$selectedModel6 !== void 0 && _data$selectedModel6.id.includes("passthrough"));
  var hasImagesList = properties && "images_list" in properties && !((_data$selectedModel7 = data.selectedModel) !== null && _data$selectedModel7 !== void 0 && _data$selectedModel7.id.includes("passthrough"));
  var hasVideosList = properties && ("videos_list" in properties || "video_files" in properties) && !((_data$selectedModel8 = data.selectedModel) !== null && _data$selectedModel8 !== void 0 && _data$selectedModel8.id.includes("passthrough"));
  var hasLastImage = properties && "last_image" in properties && !((_data$selectedModel9 = data.selectedModel) !== null && _data$selectedModel9 !== void 0 && _data$selectedModel9.id.includes("passthrough"));
  var hasImageUrl = properties && "image_url" in properties && !((_data$selectedModel0 = data.selectedModel) !== null && _data$selectedModel0 !== void 0 && _data$selectedModel0.id.includes("passthrough"));
  var hasVideoUrl = properties && "video_url" in properties && !((_data$selectedModel1 = data.selectedModel) !== null && _data$selectedModel1 !== void 0 && _data$selectedModel1.id.includes("passthrough"));
  var hasAudioUrl = properties && "audio_url" in properties && !((_data$selectedModel10 = data.selectedModel) !== null && _data$selectedModel10 !== void 0 && _data$selectedModel10.id.includes("passthrough"));
  var hasAudiosList = properties && ("audios_list" in properties || "audio_files" in properties) && !((_data$selectedModel11 = data.selectedModel) !== null && _data$selectedModel11 !== void 0 && _data$selectedModel11.id.includes("passthrough"));
  (0, _react.useEffect)(function () {
    var timeout = setTimeout(function () {
      var validHandles = [hasPrompt && "videoInput", hasImageUrl && "videoInput2", hasLastImage && "videoInput3", hasVideoUrl && "videoInput4", hasAudioUrl && "videoInput5", hasImagesList && "videoInput6", hasVideosList && "videoInput7", hasAudiosList && "videoInput8"].filter(Boolean);
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
  }, [hasPrompt, hasImageUrl, hasLastImage, hasVideoUrl, hasAudioUrl, hasImagesList, id, setEdges]);
  (0, _react.useEffect)(function () {
    var connectedInputs = {};
    inputHandles.forEach(function (h) {
      connectedInputs[h] = edges.some(function (e) {
        return e.target === id && e.targetHandle === h;
      });
    });
    var connectedOutputs = {};
    outputHandles.forEach(function (h) {
      connectedOutputs[h] = edges.some(function (e) {
        return e.source === id && e.sourceHandle === h;
      });
    });
    setConnectedInputs(connectedInputs);
    setConnectedOutputs(connectedOutputs);
  }, [edges, id]);
  var handlePrev = function handlePrev(e) {
    e.stopPropagation();
    if (currentHistoryIndex > 0) {
      var _outputHistory$newInd;
      var newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      setCurrentVideoIndex(0);
      var viewing = (_outputHistory$newInd = outputHistory[newIndex]) === null || _outputHistory$newInd === void 0 || (_outputHistory$newInd = _outputHistory$newInd.result) === null || _outputHistory$newInd === void 0 || (_outputHistory$newInd = _outputHistory$newInd.outputs) === null || _outputHistory$newInd === void 0 || (_outputHistory$newInd = _outputHistory$newInd[0]) === null || _outputHistory$newInd === void 0 ? void 0 : _outputHistory$newInd.value;
      setNodes(function (nds) {
        return nds.map(function (n) {
          if (n.id === id) {
            return _objectSpread(_objectSpread({}, n), {}, {
              data: _objectSpread(_objectSpread({}, n.data), {}, {
                viewingOutput: viewing
              })
            });
          }
          return n;
        });
      });
    }
  };
  var handleNext = function handleNext(e) {
    e.stopPropagation();
    if (currentHistoryIndex < outputHistory.length - 1) {
      var _outputHistory$newInd2;
      var newIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(newIndex);
      setCurrentVideoIndex(0);
      var viewing = (_outputHistory$newInd2 = outputHistory[newIndex]) === null || _outputHistory$newInd2 === void 0 || (_outputHistory$newInd2 = _outputHistory$newInd2.result) === null || _outputHistory$newInd2 === void 0 || (_outputHistory$newInd2 = _outputHistory$newInd2.outputs) === null || _outputHistory$newInd2 === void 0 || (_outputHistory$newInd2 = _outputHistory$newInd2[0]) === null || _outputHistory$newInd2 === void 0 ? void 0 : _outputHistory$newInd2.value;
      setNodes(function (nds) {
        return nds.map(function (n) {
          if (n.id === id) {
            return _objectSpread(_objectSpread({}, n), {}, {
              data: _objectSpread(_objectSpread({}, n.data), {}, {
                viewingOutput: viewing
              })
            });
          }
          return n;
        });
      });
    }
  };
  var handleDeleteHistory = /*#__PURE__*/function () {
    var _ref14 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5(e) {
      var currentHistory, _data$onDataChange2, newHistory, _error$response3, _t6;
      return _regenerator().w(function (_context5) {
        while (1) switch (_context5.p = _context5.n) {
          case 0:
            e.stopPropagation();
            currentHistory = outputHistory[currentHistoryIndex];
            if (!(!currentHistory || !currentHistory.node_run_id)) {
              _context5.n = 1;
              break;
            }
            return _context5.a(2);
          case 1:
            if (!window.confirm("Вы уверены, что хотите удалить эту запись из истории?")) {
              _context5.n = 5;
              break;
            }
            _context5.p = 2;
            _context5.n = 3;
            return _axios["default"]["delete"]("/api/workflow/node-run/".concat(currentHistory.node_run_id));
          case 3:
            newHistory = outputHistory.filter(function (_, i) {
              return i !== currentHistoryIndex;
            });
            data === null || data === void 0 || (_data$onDataChange2 = data.onDataChange) === null || _data$onDataChange2 === void 0 || _data$onDataChange2.call(data, id, _objectSpread({
              outputHistory: newHistory
            }, newHistory.length === 0 ? {
              outputs: [],
              resultUrl: null
            } : {}));
            if (newHistory.length === 0) {
              setCurrentHistoryIndex(-1);
            } else {
              setCurrentHistoryIndex(Math.max(0, currentHistoryIndex - 1));
            }
            _reactHotToast.toast.success("Запись удалена");
            _context5.n = 5;
            break;
          case 4:
            _context5.p = 4;
            _t6 = _context5.v;
            _reactHotToast.toast.error(((_error$response3 = _t6.response) === null || _error$response3 === void 0 || (_error$response3 = _error$response3.data) === null || _error$response3 === void 0 ? void 0 : _error$response3.detail) || "Не удалось удалить запись");
            console.error(_t6);
          case 5:
            return _context5.a(2);
        }
      }, _callee5, null, [[2, 4]]);
    }));
    return function handleDeleteHistory(_x3) {
      return _ref14.apply(this, arguments);
    };
  }();
  var currentOutputList = currentHistoryIndex !== -1 && outputHistory[currentHistoryIndex] ? ((_outputHistory$curren = outputHistory[currentHistoryIndex]) === null || _outputHistory$curren === void 0 || (_outputHistory$curren = _outputHistory$curren.result) === null || _outputHistory$curren === void 0 ? void 0 : _outputHistory$curren.outputs) || [] : data.outputs || [];
  var currentOutput = currentOutputList.length > 0 ? ((_currentOutputList$cu = currentOutputList[currentVideoIndex]) === null || _currentOutputList$cu === void 0 ? void 0 : _currentOutputList$cu.value) || ((_currentOutputList$ = currentOutputList[0]) === null || _currentOutputList$ === void 0 ? void 0 : _currentOutputList$.value) || data.resultUrl : data.resultUrl;
  return /*#__PURE__*/_react["default"].createElement("div", {
    style: {
      minHeight: 320,
      minWidth: 280,
      maxWidth: 280,
      maxHeight: 320,
      width: 280,
      height: 320,
      '--loader-color': '#f97316'
    },
    className: "\n        nowheel group flex flex-col flex-1\n        rounded-t-2xl rounded-b-none border-2 relative transition-all duration-300 ease-in-out \n        ".concat(selected ? "border-orange-500 shadow-[0_0_25px_rgba(249,115,22,0.3)] scale-[1.02] ring-1 ring-orange-500/20" : "border-zinc-800 hover:border-zinc-700 shadow-lg", " \n        bg-[#0c0d0f]\n      ")
  }, data.isLoading && /*#__PURE__*/_react["default"].createElement("div", {
    className: "loader-border"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2 absolute -top-5 left-0"
  }, /*#__PURE__*/_react["default"].createElement("h3", {
    className: "text-zinc-400 text-[10px] font-medium tracking-wider uppercase"
  }, "\u0412\u0438\u0434\u0435\u043E ", id.replace(/^\D+/g, "")), generationCost !== null && !(selectedModel !== null && selectedModel !== void 0 && selectedModel.id.includes("passthrough")) && /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs text-orange-500 -mt-0.5 font-medium flex items-center gap-1 opacity-80"
  }, isRefreshingCost ? /*#__PURE__*/_react["default"].createElement("span", {
    className: "flex items-center gap-1 italic text-orange-200"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-2 h-2 border-[1.5px] border-orange-200/30 border-t-orange-400 rounded-full animate-spin"
  })) : /*#__PURE__*/_react["default"].createElement("span", null, generationCost === 0 ? 'Бесплатно' : "\u2248 ".concat(generationCost.toFixed(2), " \u20BD")))), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between bg-gradient-to-r from-[#151618] to-[#1c1e21] rounded-t-2xl border-b border-zinc-800 py-2 px-3"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-1.5 rounded-lg ".concat(selected ? "bg-orange-600 text-white" : "bg-zinc-800 text-zinc-400", " transition-colors")
  }, /*#__PURE__*/_react["default"].createElement(_io.IoVideocamOutline, {
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
    className: "w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors",
    title: "\u041D\u0430\u0437\u0430\u0434"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleLeft, {
    size: 10
  })), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-1.5 px-0.5"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[9px] font-medium text-white/90 tabular-nums tracking-wide"
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
    currentOutputIndex: currentVideoIndex
  })), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: handleNext,
    disabled: currentHistoryIndex >= outputHistory.length - 1,
    className: "w-5 h-5 flex items-center justify-center rounded-full hover:bg-white/10 text-white/70 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors",
    title: "\u0412\u043F\u0435\u0440\u0435\u0434"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleRight, {
    size: 10
  }))), /*#__PURE__*/_react["default"].createElement(_NodeOptionsMenu["default"], {
    nodeId: id,
    onDuplicate: data.duplicateNode,
    onDelete: handleDeleteNode,
    downloadUrl: currentOutput
  })), !(selectedModel !== null && selectedModel !== void 0 && (_selectedModel$id = selectedModel.id) !== null && _selectedModel$id !== void 0 && _selectedModel$id.includes("passthrough")) && /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-3 border-b border-zinc-800/50 bg-black/20"
  }, /*#__PURE__*/_react["default"].createElement(_NodeSendButton["default"], {
    id: id,
    data: data,
    onRun: handleRunSingleNode,
    isLoading: data.isLoading,
    cost: generationCost
  }))), ((_data$selectedModel12 = data.selectedModel) === null || _data$selectedModel12 === void 0 ? void 0 : _data$selectedModel12.id) === "video-passthrough" ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-full h-full flex-1"
  }, /*#__PURE__*/_react["default"].createElement(_UploadNode["default"], {
    id: id,
    data: data,
    formValues: formValues,
    setFormValues: setFormValues,
    selectedModel: selectedModel,
    loading: loading,
    uploadType: "upload",
    acceptType: "video"
  })) : /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col flex-grow w-full rounded-b-none overflow-hidden transition-all duration-500"
  }, data.isLoading ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-center w-full h-full overflow-hidden aspect-[1/1] bg-gray-800 animate-pulse rounded-b-none"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center gap-3"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] font-bold text-orange-500 tracking-wider uppercase"
  }, "\u0413\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u044F..."), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    onClick: function onClick(e) {
      e.stopPropagation();
      handleCancelGeneration();
    },
    className: "text-[10px] text-zinc-500 hover:text-red-400 transition-colors px-3 py-1 rounded-md border border-zinc-700 hover:border-red-500/50 bg-zinc-900"
  }, "\u041E\u0442\u043C\u0435\u043D\u0430"))) : data.errorMsg ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "text-red-400 text-xs font-medium p-3 bg-red-500/30 rounded-xl border border-red-500/20 m-3 w-full"
  }, data.errorMsg || "Ошибка генерации") : currentOutput && !data.isLoading ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "h-full w-full relative overflow-hidden rounded-b-none"
  }, /*#__PURE__*/_react["default"].createElement(_VideoPlayer["default"], {
    key: currentOutput,
    src: currentOutput,
    accentColor: "#f97316"
  }), currentOutputList.length > 1 && /*#__PURE__*/_react["default"].createElement(_react["default"].Fragment, null, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick(e) {
      e.stopPropagation();
      setCurrentVideoIndex(function (prev) {
        return prev > 0 ? prev - 1 : currentOutputList.length - 1;
      });
    },
    className: "absolute left-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleLeft, {
    size: 16
  })), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    onClick: function onClick(e) {
      e.stopPropagation();
      setCurrentVideoIndex(function (prev) {
        return prev < currentOutputList.length - 1 ? prev + 1 : 0;
      });
    },
    className: "absolute right-2 top-1/2 -translate-y-1/2 z-30 w-8 h-8 flex items-center justify-center rounded-full bg-black text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-800"
  }, /*#__PURE__*/_react["default"].createElement(_fa.FaAngleRight, {
    size: 16
  }))), currentOutputList.length > 1 && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1 z-30"
  }, currentOutputList.map(function (_, idx) {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: idx,
      className: "w-1.5 h-1.5 rounded-full transition-all ".concat(idx === currentVideoIndex ? "bg-white scale-125" : "bg-gray-600")
    });
  }))) : /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center justify-center text-zinc-400 gap-2"
  }, /*#__PURE__*/_react["default"].createElement(_io.IoVideocamOutline, {
    size: 32
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] italic"
  }, "\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F \u0437\u0434\u0435\u0441\u044C..."))), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "videoInput",
    style: {
      top: 70,
      opacity: hasPrompt ? 1 : 0,
      pointerEvents: hasPrompt ? 'auto' : 'none',
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.videoInput ? '!bg-blue-600 !border-zinc-900 shadow-[0_0_15px_rgba(37,99,235,0.8)]' : '!bg-zinc-900 !border-blue-600/50 hover:!border-blue-600 shadow-sm', "\n        "),
    "data-type": "blue"
  }), hasPrompt && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-xs text-blue-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "blue" ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
    style: {
      top: 70,
      left: -40
    }
  }, "\u0422\u0435\u043A\u0441\u0442"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "videoInput2",
    style: {
      top: 100,
      opacity: hasImageUrl ? 1 : 0,
      pointerEvents: hasImageUrl ? 'auto' : 'none',
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.videoInput2 ? '!bg-emerald-600 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : '!bg-zinc-900 !border-emerald-600/50 hover:!border-emerald-600 shadow-sm', "\n        "),
    "data-type": "green"
  }), hasImageUrl && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-xs text-green-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "green" ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
    style: {
      top: 100,
      left: -50
    }
  }, "\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "videoInput6",
    style: {
      top: 100,
      opacity: hasImagesList ? 1 : 0,
      pointerEvents: hasImagesList ? 'auto' : 'none',
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.videoInput6 ? '!bg-emerald-600 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : '!bg-zinc-900 !border-emerald-600/50 hover:!border-emerald-600 shadow-sm', "\n        "),
    "data-type": "green"
  }), hasImagesList && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-xs text-green-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "green" ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
    style: {
      top: 100,
      left: -55
    }
  }, "\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "videoInput3",
    style: {
      top: 130,
      opacity: hasLastImage ? 1 : 0,
      pointerEvents: hasLastImage ? 'auto' : 'none',
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.videoInput3 ? '!bg-emerald-600 !border-zinc-900 shadow-[0_0_15px_rgba(16,185,129,0.8)]' : '!bg-zinc-900 !border-emerald-600/50 hover:!border-emerald-600 shadow-sm', "\n        "),
    "data-type": "green"
  }), hasLastImage && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-xs text-green-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "green" ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
    style: {
      top: 130,
      left: -75
    }
  }, "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u043A\u0430\u0434\u0440"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "videoInput4",
    style: {
      top: 160,
      opacity: hasVideoUrl ? 1 : 0,
      pointerEvents: hasVideoUrl ? 'auto' : 'none',
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.videoInput4 ? '!bg-orange-600 !border-zinc-900 shadow-[0_0_15px_rgba(249,115,22,0.8)]' : '!bg-zinc-900 !border-orange-600/50 hover:!border-orange-600 shadow-sm', "\n        "),
    "data-type": "orange"
  }), hasVideoUrl && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-xs text-orange-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "orange" ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
    style: {
      top: 160,
      left: -45
    }
  }, "\u0412\u0438\u0434\u0435\u043E"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "videoInput7",
    style: {
      top: 160,
      opacity: hasVideosList ? 1 : 0,
      pointerEvents: hasVideosList ? 'auto' : 'none',
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.videoInput7 ? '!bg-orange-600 !border-zinc-900 shadow-[0_0_15px_rgba(249,115,22,0.8)]' : '!bg-zinc-900 !border-orange-600/50 hover:!border-orange-600 shadow-sm', "\n        "),
    "data-type": "orange"
  }), hasVideosList && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-xs text-orange-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "orange" ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
    style: {
      top: 160,
      left: -50
    }
  }, "\u0412\u0438\u0434\u0435\u043E"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "videoInput8",
    style: {
      top: 190,
      opacity: hasAudiosList ? 1 : 0,
      pointerEvents: hasAudiosList ? 'auto' : 'none',
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.videoInput8 ? '!bg-yellow-500 !border-zinc-900 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : '!bg-zinc-900 !border-yellow-500/50 hover:!border-yellow-500 shadow-sm', "\n        "),
    "data-type": "yellow"
  }), hasAudiosList && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-xs text-yellow-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "yellow" ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
    style: {
      top: 190,
      left: -55
    }
  }, "\u0410\u0443\u0434\u0438\u043E"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "videoInput5",
    style: {
      top: 190,
      opacity: hasAudioUrl ? 1 : 0,
      pointerEvents: hasAudioUrl ? 'auto' : 'none',
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !left-[-8px] transition-all\n          ".concat(connectedInputs.videoInput5 ? '!bg-yellow-500 !border-zinc-900 shadow-[0_0_15px_rgba(234,179,8,0.8)]' : '!bg-zinc-900 !border-yellow-500/50 hover:!border-yellow-500 shadow-sm', "\n        "),
    "data-type": "yellow"
  }), hasAudioUrl && /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-xs text-yellow-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "yellow" ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
    style: {
      top: 190,
      left: -45
    }
  }, "\u0410\u0443\u0434\u0438\u043E"), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "source",
    position: _reactflow.Position.Right,
    id: "videoOutput",
    style: {
      top: 100,
      width: 12,
      height: 12,
      transition: 'all 0.2s ease-in-out'
    },
    className: "!rounded-full !border-[3px] !right-[-8px] transition-all\n          ".concat(connectedOutputs.videoOutput ? '!bg-orange-600 !border-zinc-900 shadow-[0_0_15px_rgba(249,115,22,0.8)]' : '!bg-zinc-900 !border-orange-600/50 hover:!border-orange-600 shadow-sm', "\n        "),
    "data-type": "orange"
  }), /*#__PURE__*/_react["default"].createElement("p", {
    className: "absolute text-xs text-orange-500 transition-opacity duration-200 pointer-events-none whitespace-nowrap ".concat(data.activeHandleColor === "orange" ? "opacity-100" : "opacity-0 group-hover:opacity-100"),
    style: {
      top: 100,
      right: -45
    }
  }, "\u0412\u0438\u0434\u0435\u043E"));
};
var _default = exports["default"] = VideoGeneration;
