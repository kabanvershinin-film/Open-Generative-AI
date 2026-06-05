"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactflow = require("reactflow");
var _reactHotToast = require("react-hot-toast");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t2 in e) "default" !== _t2 && {}.hasOwnProperty.call(e, _t2) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t2)) && (i.get || i.set) ? o(f, _t2, i) : f[_t2] = e[_t2]); return f; })(e, t); }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function _slicedToArray(r, e) { return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _iterableToArrayLimit(r, l) { var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (null != t) { var e, n, i, u, a = [], f = !0, o = !1; try { if (i = (t = t.call(r)).next, 0 === l) { if (Object(t) !== t) return; f = !1; } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0); } catch (r) { o = !0, n = r; } finally { try { if (!f && null != t["return"] && (u = t["return"](), Object(u) !== u)) return; } finally { if (o) throw n; } } return a; } }
function _arrayWithHoles(r) { if (Array.isArray(r)) return r; }
// Style presets (label → English style string) — ported from creator-club.
var STYLE_PRESETS = [{
  label: "🎬 Кино",
  value: "Cinematic, 4K, anamorphic lens, film grain, professional color grading"
}, {
  label: "✨ Реализм",
  value: "Ultra-realistic, photorealistic, 8K, natural lighting, physically accurate"
}, {
  label: "🌙 Ночь",
  value: "Night scene, neon lights, urban atmosphere, dramatic shadows, moody lighting"
}, {
  label: "🌅 Золотой час",
  value: "Golden hour, warm tones, soft directional light, atmospheric haze, cinematic depth"
}, {
  label: "🎭 Драма",
  value: "Dramatic, high contrast, emotional intensity, Rembrandt lighting, close-up details"
}, {
  label: "🌊 Природа",
  value: "Nature documentary, 8K, macro details, atmospheric perspective, fluid camera movements"
}];
var DURATIONS = ["6 секунд", "8 секунд", "10 секунд", "15 секунд", "20 секунд", "30 секунд", "60 секунд"];

// Reads the prompt from a node wired into the teal "camera" input handle.
function getConnectedCameraPrompt(nodeId, getNodes, getEdges) {
  var edges = getEdges();
  var nodes = getNodes();
  var camEdge = edges.find(function (e) {
    return e.target === nodeId && e.targetHandle === "camera";
  });
  if (!camEdge) return "";
  var camNode = nodes.find(function (n) {
    return n.id === camEdge.source;
  });
  var d = (camNode === null || camNode === void 0 ? void 0 : camNode.data) || {};
  return d.prompt || d.resultUrl || d.formValues && d.formValues.prompt || "";
}
var SeedancePromptNode = function SeedancePromptNode(_ref) {
  var _ref2, _data$idea, _ref3, _data$style, _ref4, _data$duration, _ref5, _data$photoRefs, _ref6, _data$videoRefs, _ref7, _data$audioRefs, _ref8, _data$prompt;
  var id = _ref.id,
    data = _ref.data;
  var _useReactFlow = (0, _reactflow.useReactFlow)(),
    getNodes = _useReactFlow.getNodes,
    getEdges = _useReactFlow.getEdges,
    setNodes = _useReactFlow.setNodes,
    setEdges = _useReactFlow.setEdges;
  var ideaRef = (0, _react.useRef)(null);
  var edges = (0, _reactflow.useStore)(function (s) {
    return s.edges;
  });

  // On reload the saved state arrives in data.formValues (input_params); fall back to it.
  var fv = data.formValues || {};
  var _useState = (0, _react.useState)((_ref2 = (_data$idea = data.idea) !== null && _data$idea !== void 0 ? _data$idea : fv.idea) !== null && _ref2 !== void 0 ? _ref2 : ""),
    _useState2 = _slicedToArray(_useState, 2),
    idea = _useState2[0],
    setIdea = _useState2[1];
  var _useState3 = (0, _react.useState)((_ref3 = (_data$style = data.style) !== null && _data$style !== void 0 ? _data$style : fv.style) !== null && _ref3 !== void 0 ? _ref3 : ""),
    _useState4 = _slicedToArray(_useState3, 2),
    style = _useState4[0],
    setStyle = _useState4[1];
  var _useState5 = (0, _react.useState)((_ref4 = (_data$duration = data.duration) !== null && _data$duration !== void 0 ? _data$duration : fv.duration) !== null && _ref4 !== void 0 ? _ref4 : "15 секунд"),
    _useState6 = _slicedToArray(_useState5, 2),
    duration = _useState6[0],
    setDuration = _useState6[1];
  var _useState7 = (0, _react.useState)((_ref5 = (_data$photoRefs = data.photoRefs) !== null && _data$photoRefs !== void 0 ? _data$photoRefs : fv.photoRefs) !== null && _ref5 !== void 0 ? _ref5 : 0),
    _useState8 = _slicedToArray(_useState7, 2),
    photoRefs = _useState8[0],
    setPhotoRefs = _useState8[1];
  var _useState9 = (0, _react.useState)((_ref6 = (_data$videoRefs = data.videoRefs) !== null && _data$videoRefs !== void 0 ? _data$videoRefs : fv.videoRefs) !== null && _ref6 !== void 0 ? _ref6 : 0),
    _useState0 = _slicedToArray(_useState9, 2),
    videoRefs = _useState0[0],
    setVideoRefs = _useState0[1];
  var _useState1 = (0, _react.useState)((_ref7 = (_data$audioRefs = data.audioRefs) !== null && _data$audioRefs !== void 0 ? _data$audioRefs : fv.audioRefs) !== null && _ref7 !== void 0 ? _ref7 : 0),
    _useState10 = _slicedToArray(_useState1, 2),
    audioRefs = _useState10[0],
    setAudioRefs = _useState10[1];
  var _useState11 = (0, _react.useState)(false),
    _useState12 = _slicedToArray(_useState11, 2),
    loading = _useState12[0],
    setLoading = _useState12[1];
  var _useState13 = (0, _react.useState)((_ref8 = (_data$prompt = data.prompt) !== null && _data$prompt !== void 0 ? _data$prompt : fv.prompt) !== null && _ref8 !== void 0 ? _ref8 : ""),
    _useState14 = _slicedToArray(_useState13, 2),
    result = _useState14[0],
    setResult = _useState14[1];
  var _useState15 = (0, _react.useState)(""),
    _useState16 = _slicedToArray(_useState15, 2),
    error = _useState16[0],
    setError = _useState16[1];
  var outputConnected = edges.some(function (e) {
    return e.source === id && e.sourceHandle === "textOutput";
  });
  var cameraConnected = edges.some(function (e) {
    return e.target === id && e.targetHandle === "camera";
  });

  // Persist into the node. We pose as a `text-passthrough` under the hood so the
  // server run emits the generated prompt as this node's output — that's what
  // lets the output handle feed a connected video node's prompt input.
  var persist = function persist(patch) {
    var _patch$prompt, _data$onDataChange;
    var next = _objectSpread({
      idea: idea,
      style: style,
      duration: duration,
      photoRefs: photoRefs,
      videoRefs: videoRefs,
      audioRefs: audioRefs
    }, patch);
    var prompt = (_patch$prompt = patch.prompt) !== null && _patch$prompt !== void 0 ? _patch$prompt : result;
    // Store the UI state inside formValues so it survives save+reload (it becomes
    // input_params on the server). `prompt` doubles as the text-passthrough output.
    (_data$onDataChange = data.onDataChange) === null || _data$onDataChange === void 0 || _data$onDataChange.call(data, id, {
      idea: next.idea,
      style: next.style,
      duration: next.duration,
      photoRefs: next.photoRefs,
      videoRefs: next.videoRefs,
      audioRefs: next.audioRefs,
      prompt: prompt,
      selectedModel: {
        id: "text-passthrough",
        name: "Seedance Промпт"
      },
      formValues: {
        prompt: prompt,
        idea: next.idea,
        style: next.style,
        duration: next.duration,
        photoRefs: next.photoRefs,
        videoRefs: next.videoRefs,
        audioRefs: next.audioRefs
      },
      outputs: prompt ? [{
        type: "text",
        value: prompt
      }] : [],
      resultUrl: prompt || null
    });
  };
  var insertTag = function insertTag(tag) {
    var _ta$selectionStart, _ta$selectionEnd;
    var ta = ideaRef.current;
    var insert = "@".concat(tag, " ");
    if (!ta) {
      setIdea((idea || "") + insert);
      return;
    }
    var start = (_ta$selectionStart = ta.selectionStart) !== null && _ta$selectionStart !== void 0 ? _ta$selectionStart : idea.length;
    var end = (_ta$selectionEnd = ta.selectionEnd) !== null && _ta$selectionEnd !== void 0 ? _ta$selectionEnd : idea.length;
    var nextVal = idea.slice(0, start) + insert + idea.slice(end);
    setIdea(nextVal);
    requestAnimationFrame(function () {
      ta.focus();
      var pos = start + insert.length;
      ta.setSelectionRange(pos, pos);
    });
  };
  var generate = /*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
      var cameraPrompt, res, json, generated, _t;
      return _regenerator().w(function (_context) {
        while (1) switch (_context.p = _context.n) {
          case 0:
            if (!(!idea.trim() || loading)) {
              _context.n = 1;
              break;
            }
            return _context.a(2);
          case 1:
            setLoading(true);
            setError("");
            _context.p = 2;
            cameraPrompt = getConnectedCameraPrompt(id, getNodes, getEdges);
            _context.n = 3;
            return fetch("/api/seedance-prompt", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                idea: idea,
                style: style,
                duration: duration,
                photoRefs: photoRefs,
                videoRefs: videoRefs,
                audioRefs: audioRefs,
                cameraPrompt: cameraPrompt
              })
            });
          case 3:
            res = _context.v;
            _context.n = 4;
            return res.json()["catch"](function () {
              return {};
            });
          case 4:
            json = _context.v;
            if (res.ok) {
              _context.n = 5;
              break;
            }
            if (json.error === "insufficient_funds") {
              _reactHotToast.toast.error("Недостаточно средств для генерации промпта");
            }
            throw new Error(json.error || "\u041E\u0448\u0438\u0431\u043A\u0430 ".concat(res.status));
          case 5:
            generated = json.prompt || "";
            setResult(generated);
            persist({
              prompt: generated
            });
            _context.n = 7;
            break;
          case 6:
            _context.p = 6;
            _t = _context.v;
            setError(_t.message || "Ошибка генерации");
          case 7:
            _context.p = 7;
            setLoading(false);
            return _context.f(7);
          case 8:
            return _context.a(2);
        }
      }, _callee, null, [[2, 6, 7, 8]]);
    }));
    return function generate() {
      return _ref9.apply(this, arguments);
    };
  }();
  var deleteNode = function deleteNode() {
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
  };
  var refRows = [{
    label: "🖼 Фото",
    value: photoRefs,
    set: setPhotoRefs,
    max: 9,
    key: "photoRefs"
  }, {
    label: "🎬 Видео",
    value: videoRefs,
    set: setVideoRefs,
    max: 3,
    key: "videoRefs"
  }, {
    label: "🎵 Аудио",
    value: audioRefs,
    set: setAudioRefs,
    max: 3,
    key: "audioRefs"
  }];
  return /*#__PURE__*/_react["default"].createElement("div", {
    className: "nowheel rounded-2xl shadow-xl",
    style: {
      background: "linear-gradient(135deg, #1a0f2e 0%, #1e1040 100%)",
      border: "1px solid rgba(139,92,246,0.4)",
      minWidth: 280,
      maxWidth: 320,
      boxShadow: "0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(139,92,246,0.12)"
    }
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center gap-2 px-3 pt-3 pb-2 border-b border-purple-500/10"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-base"
  }, "\u2728"), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs font-bold text-purple-300 tracking-wide uppercase"
  }, "Seedance \u041F\u0440\u043E\u043C\u043F\u0442"), /*#__PURE__*/_react["default"].createElement("span", {
    className: "ml-auto text-[9px] text-purple-400/50 bg-purple-900/30 px-1.5 py-0.5 rounded-full"
  }, "AI 2.0"), cameraConnected && /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[9px] text-teal-300 bg-teal-900/30 px-1.5 py-0.5 rounded-full"
  }, "\uD83C\uDFAC \u043A\u0430\u043C\u0435\u0440\u0430"), /*#__PURE__*/_react["default"].createElement("button", {
    onMouseDown: function onMouseDown(e) {
      return e.stopPropagation();
    },
    onClick: function onClick(e) {
      e.stopPropagation();
      deleteNode();
    },
    className: "nodrag p-1 rounded-lg text-purple-400/40 hover:text-red-400 hover:bg-red-400/10 transition-all cursor-pointer",
    title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043D\u043E\u0434\u0443"
  }, "\uD83D\uDDD1")), /*#__PURE__*/_react["default"].createElement("div", {
    className: "p-3 flex flex-col gap-2"
  }, /*#__PURE__*/_react["default"].createElement("div", null, /*#__PURE__*/_react["default"].createElement("label", {
    className: "text-[9px] text-purple-400/60 uppercase tracking-wider mb-1 block"
  }, "\uD83D\uDCA1 \u0412\u0430\u0448\u0430 \u0438\u0434\u0435\u044F"), (photoRefs > 0 || videoRefs > 0 || audioRefs > 0) && /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-wrap gap-1 mb-1 nodrag"
  }, [].concat(_toConsumableArray(Array.from({
    length: photoRefs
  }, function (_, i) {
    return "\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435".concat(i + 1);
  })), _toConsumableArray(Array.from({
    length: videoRefs
  }, function (_, i) {
    return "\u0412\u0438\u0434\u0435\u043E".concat(i + 1);
  })), _toConsumableArray(Array.from({
    length: audioRefs
  }, function (_, i) {
    return "\u0410\u0443\u0434\u0438\u043E".concat(i + 1);
  }))).map(function (t) {
    return /*#__PURE__*/_react["default"].createElement("button", {
      key: t,
      type: "button",
      onMouseDown: function onMouseDown(e) {
        return e.stopPropagation();
      },
      onClick: function onClick() {
        return insertTag(t);
      },
      title: "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C @".concat(t),
      className: "px-1.5 py-0.5 rounded-md text-[9px] bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 transition-colors"
    }, "@", t);
  })), /*#__PURE__*/_react["default"].createElement("textarea", {
    ref: ideaRef,
    value: idea,
    onChange: function onChange(e) {
      return setIdea(e.target.value);
    },
    onBlur: function onBlur() {
      return persist({});
    },
    onMouseDown: function onMouseDown(e) {
      return e.stopPropagation();
    },
    onKeyDown: function onKeyDown(e) {
      e.stopPropagation();
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) generate();
    },
    placeholder: "\u041E\u043F\u0438\u0448\u0438\u0442\u0435 \u0441\u0446\u0435\u043D\u0443... (Ctrl+Enter \u0434\u043B\u044F \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438)",
    rows: 4,
    className: "w-full min-h-[80px] bg-black/30 border border-purple-500/20 rounded-lg px-2 py-1.5 text-xs text-white placeholder-purple-300/30 focus:outline-none focus:border-purple-500/50 resize nodrag nowheel"
  })), /*#__PURE__*/_react["default"].createElement("div", null, /*#__PURE__*/_react["default"].createElement("label", {
    className: "text-[9px] text-purple-400/60 uppercase tracking-wider mb-1 block"
  }, "\uD83C\uDFA8 \u0421\u0442\u0438\u043B\u044C"), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-wrap gap-1"
  }, STYLE_PRESETS.map(function (s) {
    return /*#__PURE__*/_react["default"].createElement("button", {
      key: s.label,
      onMouseDown: function onMouseDown(e) {
        return e.stopPropagation();
      },
      onClick: function onClick() {
        var v = style === s.value ? "" : s.value;
        setStyle(v);
        persist({
          style: v
        });
      },
      className: "px-1.5 py-0.5 rounded-md text-[9px] transition-all nodrag cursor-pointer ".concat(style === s.value ? "bg-purple-600 text-white shadow-[0_0_6px_rgba(139,92,246,0.4)]" : "bg-black/30 text-purple-300/60 border border-purple-500/15 hover:border-purple-500/40")
    }, s.label);
  }))), /*#__PURE__*/_react["default"].createElement("div", null, /*#__PURE__*/_react["default"].createElement("label", {
    className: "text-[9px] text-purple-400/60 uppercase tracking-wider mb-1 block"
  }, "\u23F1 \u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C"), /*#__PURE__*/_react["default"].createElement("select", {
    value: duration,
    onChange: function onChange(e) {
      setDuration(e.target.value);
      persist({
        duration: e.target.value
      });
    },
    onMouseDown: function onMouseDown(e) {
      return e.stopPropagation();
    },
    style: {
      colorScheme: "dark"
    },
    className: "w-full bg-black/30 border border-purple-500/20 rounded-lg px-2 py-1 text-xs text-white focus:outline-none nodrag [&>option]:bg-[#1a0f2e]"
  }, DURATIONS.map(function (d) {
    return /*#__PURE__*/_react["default"].createElement("option", {
      key: d,
      value: d
    }, d);
  }))), /*#__PURE__*/_react["default"].createElement("div", null, /*#__PURE__*/_react["default"].createElement("label", {
    className: "text-[9px] text-purple-400/60 uppercase tracking-wider mb-1 block"
  }, "\uD83D\uDCCE \u0420\u0435\u0444\u0435\u0440\u0435\u043D\u0441\u044B"), /*#__PURE__*/_react["default"].createElement("div", {
    className: "grid grid-cols-3 gap-1"
  }, refRows.map(function (_ref0) {
    var label = _ref0.label,
      value = _ref0.value,
      set = _ref0.set,
      max = _ref0.max,
      key = _ref0.key;
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: label,
      className: "bg-black/30 border border-purple-500/15 rounded-lg px-1.5 py-1 text-center"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "text-[9px] text-purple-300/50 mb-0.5"
    }, label), /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center justify-center gap-1"
    }, /*#__PURE__*/_react["default"].createElement("button", {
      onMouseDown: function onMouseDown(e) {
        return e.stopPropagation();
      },
      onClick: function onClick() {
        var v = Math.max(0, value - 1);
        set(v);
        persist(_defineProperty({}, key, v));
      },
      className: "text-purple-400/60 hover:text-purple-300 nodrag cursor-pointer text-[10px] w-4"
    }, "\u2212"), /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-xs text-white font-medium w-3 text-center"
    }, value), /*#__PURE__*/_react["default"].createElement("button", {
      onMouseDown: function onMouseDown(e) {
        return e.stopPropagation();
      },
      onClick: function onClick() {
        var v = Math.min(max, value + 1);
        set(v);
        persist(_defineProperty({}, key, v));
      },
      className: "text-purple-400/60 hover:text-purple-300 nodrag cursor-pointer text-[10px] w-4"
    }, "+")));
  }))), /*#__PURE__*/_react["default"].createElement("button", {
    onMouseDown: function onMouseDown(e) {
      return e.stopPropagation();
    },
    onClick: generate,
    disabled: loading || !idea.trim(),
    className: "w-full py-1.5 rounded-lg text-xs font-semibold transition-all nodrag cursor-pointer disabled:opacity-40",
    style: {
      background: loading ? "#4c1d95" : "linear-gradient(90deg, #7c3aed, #6d28d9)",
      color: "white"
    }
  }, loading ? "⏳ Генерирую..." : "✨ Сгенерировать промпт"), error && /*#__PURE__*/_react["default"].createElement("p", {
    className: "text-[9px] text-red-400"
  }, error), result && /*#__PURE__*/_react["default"].createElement("div", {
    className: "rounded-lg overflow-hidden",
    style: {
      border: "1px solid rgba(139,92,246,0.25)"
    }
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between px-2 py-1",
    style: {
      background: "rgba(139,92,246,0.15)"
    }
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[9px] text-purple-300/70 font-medium"
  }, "\u2705 \u041F\u0440\u043E\u043C\u043F\u0442 \u0433\u043E\u0442\u043E\u0432"), /*#__PURE__*/_react["default"].createElement("button", {
    onMouseDown: function onMouseDown(e) {
      return e.stopPropagation();
    },
    onClick: function onClick() {
      navigator.clipboard.writeText(result);
      _reactHotToast.toast.success("Скопировано");
    },
    className: "text-[9px] text-purple-300 hover:text-white bg-purple-600/30 hover:bg-purple-600/60 px-2 py-0.5 rounded transition-all nodrag cursor-pointer"
  }, "\uD83D\uDCCB \u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C")), /*#__PURE__*/_react["default"].createElement("div", {
    className: "px-2 py-2 overflow-y-auto nodrag nowheel",
    style: {
      background: "rgba(0,0,0,0.4)",
      maxHeight: 260
    }
  }, /*#__PURE__*/_react["default"].createElement("p", {
    className: "text-[9px] text-purple-200/80 leading-relaxed whitespace-pre-wrap"
  }, result)))), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "target",
    position: _reactflow.Position.Left,
    id: "camera",
    style: {
      top: "50%"
    },
    className: "!bg-teal-500 !w-3 !h-3",
    title: "\uD83C\uDFAC \u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438 \u043D\u043E\u0434\u0443 \u041A\u0430\u043C\u0435\u0440\u0430"
  }), /*#__PURE__*/_react["default"].createElement(_reactflow.Handle, {
    type: "source",
    position: _reactflow.Position.Right,
    id: "textOutput",
    className: "!w-3 !h-3 ".concat(outputConnected ? "!bg-purple-400" : "!bg-purple-500")
  }));
};
var _default = exports["default"] = SeedancePromptNode;
