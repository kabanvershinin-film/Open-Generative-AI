"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _react = _interopRequireWildcard(require("react"));
var _reactHotToast = require("react-hot-toast");
var _fi = require("react-icons/fi");
var _md = require("react-icons/md");
var _reactflow = require("reactflow");
var _axios = _interopRequireDefault(require("axios"));
var _AudioPlayer = _interopRequireDefault(require("./AudioPlayer"));
var _VideoPlayer = _interopRequireDefault(require("./VideoPlayer"));
var _io = require("react-icons/io5");
var _stableStringify = require("./stableStringify.js");
var _uploadPreviewState = require("./uploadPreviewState.js");
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
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
var UploadNode = function UploadNode(_ref) {
  var id = _ref.id,
    data = _ref.data,
    formValues = _ref.formValues,
    setFormValues = _ref.setFormValues,
    selectedModel = _ref.selectedModel,
    loading = _ref.loading,
    uploadType = _ref.uploadType,
    acceptType = _ref.acceptType;
  var _useState = (0, _react.useState)(false),
    _useState2 = _slicedToArray(_useState, 2),
    uploading = _useState2[0],
    setUploading = _useState2[1];
  var _useState3 = (0, _react.useState)(0),
    _useState4 = _slicedToArray(_useState3, 2),
    uploadProgress = _useState4[0],
    setUploadProgress = _useState4[1];
  var _useState5 = (0, _react.useState)({
      width: 0,
      height: 0,
      size: null
    }),
    _useState6 = _slicedToArray(_useState5, 2),
    imageMetadata = _useState6[0],
    setImageMetadata = _useState6[1];
  var _useState7 = (0, _react.useState)(false),
    _useState8 = _slicedToArray(_useState7, 2),
    isMobileUploadUi = _useState8[0],
    setIsMobileUploadUi = _useState8[1];
  var _useStatePreview = (0, _react.useState)([]),
    _useStatePreview2 = _slicedToArray(_useStatePreview, 2),
    previewUrls = _useStatePreview2[0],
    setPreviewUrls = _useStatePreview2[1];
  var videoRef = (0, _react.useRef)(null);
  var prevFormValues = (0, _react.useRef)(formValues);
  var fileInputRef = (0, _react.useRef)(null);
  var cameraInputRef = (0, _react.useRef)(null);
  var ownedObjectUrlsRef = (0, _react.useRef)(new Set());
  var revokeObjectUrl = function revokeObjectUrl(url) {
    if (!url || !ownedObjectUrlsRef.current.has(url)) return;
    try {
      URL.revokeObjectURL(url);
    } catch (_unused) {}
    ownedObjectUrlsRef.current["delete"](url);
  };
  (0, _react.useEffect)(function () {
    var _mediaQuery$addEventL;
    if (typeof window === "undefined") return;
    var mediaQuery = window.matchMedia("(max-width: 767px), (pointer: coarse)");
    var applyMatch = function applyMatch() {
      return setIsMobileUploadUi(mediaQuery.matches);
    };
    applyMatch();
    (_mediaQuery$addEventL = mediaQuery.addEventListener) === null || _mediaQuery$addEventL === void 0 || _mediaQuery$addEventL.call(mediaQuery, "change", applyMatch);
    return function () {
      var _mediaQuery$removeEve;
      return (_mediaQuery$removeEve = mediaQuery.removeEventListener) === null || _mediaQuery$removeEve === void 0 ? void 0 : _mediaQuery$removeEve.call(mediaQuery, "change", applyMatch);
    };
  }, []);
  (0, _react.useEffect)(function () {
    return function () {
      ownedObjectUrlsRef.current.forEach(function (url) {
        try {
          URL.revokeObjectURL(url);
        } catch (_unused2) {}
      });
      ownedObjectUrlsRef.current.clear();
    };
  }, []);
  var handleDrop = function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    handleFileUpload(e);
  };
  var handleFileUpload = function handleFileUpload(e) {
    var _e$dataTransfer;
    var file = null;
    if ((_e$dataTransfer = e.dataTransfer) !== null && _e$dataTransfer !== void 0 && _e$dataTransfer.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if (e.target.files && e.target.files.length > 0) {
      file = e.target.files[0];
    } else {
      return;
    }
    var fileName = (file.name || "").toLowerCase();
    var isAcceptedFile = acceptType === "image" ? file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|heic|heif)$/i.test(fileName) : acceptType === "video" ? file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(fileName) : file.type.startsWith("audio/") || /\.(mp3|wav|webm|m4a|ogg)$/i.test(fileName);
    var type = file.type.startsWith("video") ? "video_url" : file.type.startsWith("image") ? "image_url" : "audio_url";
    if (!isAcceptedFile) {
      var typeRus = acceptType === "image" ? "изображение" : acceptType === "video" ? "видео" : "аудио";
      _reactHotToast.toast.error("\u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u0435 \u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 \u0444\u0430\u0439\u043B (".concat(typeRus, ")"));
      return;
    }
    ;
    var previewUrl = typeof URL !== "undefined" ? URL.createObjectURL(file) : "";
    if (previewUrl) {
      ownedObjectUrlsRef.current.add(previewUrl);
      setPreviewUrls(function (prev) {
        return (0, _uploadPreviewState.appendUploadUrls)(prev, [previewUrl], 1);
      });
    }
    setUploading(true);
    setUploadProgress(0);
    _axios["default"].get("/api/upload-file", {
      params: {
        filename: file.name,
        type: file.type
      }
    }).then(function (response) {
      var _response$data = response.data,
        putUrl = _response$data.putUrl,
        publicUrl = _response$data.publicUrl;
      _axios["default"].put(putUrl, file, {
        headers: {
          "Content-Type": file.type
        },
        onUploadProgress: function onUploadProgress(progressEvent) {
          var percentCompleted = Math.round(progressEvent.loaded * 100 / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      }).then(function () {
        setFormValues(function (prev) {
          return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, type, publicUrl));
        });
        setPreviewUrls(function (prev) {
          return (0, _uploadPreviewState.replaceUploadUrl)(prev, previewUrl, publicUrl);
        });
        revokeObjectUrl(previewUrl);
        setTimeout(function () {
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      });
    })["catch"](function (error) {
      var _error$response;
      console.error("Upload failed", error);
      _reactHotToast.toast.error("Ошибка загрузки.", error === null || error === void 0 || (_error$response = error.response) === null || _error$response === void 0 ? void 0 : _error$response.data);
      setPreviewUrls(function (prev) {
        return (0, _uploadPreviewState.removeUploadUrl)(prev, previewUrl);
      });
      revokeObjectUrl(previewUrl);
      setUploading(false);
      setUploadProgress(0);
    })["finally"](function () {
      if ((e === null || e === void 0 ? void 0 : e.target) && "value" in e.target) {
        e.target.value = "";
      }
    });
  };
  var handleDragOver = function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
  };
  var acceptAttr = acceptType === "image" ? "image/*,.heic,.heif" : acceptType === "video" ? "video/*,.mov,.m4v" : "audio/*,.m4a,.ogg";
  var handleTextChange = function handleTextChange(e) {
    var textValue = e.target.value;
    setFormValues(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, {
        prompt: textValue
      });
    });
  };
  var handleWorkflowInputChange = function handleWorkflowInputChange(e) {
    var workflowInputValue = e.target.checked;
    setFormValues(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, {
        is_workflow_input: workflowInputValue
      });
    });
  };
  var removeData = function removeData() {
    var key = acceptType === "image" ? "image_url" : acceptType === "video" ? "video_url" : "audio_url";
    previewUrls.forEach(revokeObjectUrl);
    setPreviewUrls([]);
    setFormValues(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, key, null));
    });
  };
  var actualFileUrl = acceptType === "image" ? formValues.image_url || null : acceptType === "video" ? formValues.video_url || null : formValues.audio_url || null;
  var displayFileUrl = (0, _uploadPreviewState.getDisplayUploadUrls)(uploading ? previewUrls : [], actualFileUrl)[0] || null;
  var imageUrl = acceptType === "image" ? displayFileUrl : null;

  // Probe image dimensions / size only when the URL actually changes. Keeping
  // this in its own effect (keyed on the URL, not `data`) is what stops the
  // HEAD-request flood that exhausted the browser (ERR_INSUFFICIENT_RESOURCES).
  (0, _react.useEffect)(function () {
    if (acceptType !== "image") return;
    if (!imageUrl) {
      setImageMetadata({
        width: 0,
        height: 0,
        size: null
      });
      return;
    }
    var cancelled = false;
    var img = new Image();
    img.onload = function () {
      if (cancelled) return;
      setImageMetadata(function (prev) {
        return _objectSpread(_objectSpread({}, prev), {}, {
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      });
    };
    img.src = imageUrl;
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      fetch(imageUrl, {
        method: 'HEAD'
      }).then(function (res) {
        if (cancelled) return;
        var size = res.headers.get('content-length');
        setImageMetadata(function (prev) {
          return _objectSpread(_objectSpread({}, prev), {}, {
            size: size ? (parseInt(size) / (1024 * 1024)).toFixed(2) + ' MB' : null
          });
        });
      })["catch"](function () {
        if (!cancelled) setImageMetadata(function (prev) {
          return _objectSpread(_objectSpread({}, prev), {}, {
            size: null
          });
        });
      });
    }
    return function () {
      cancelled = true;
    };
  }, [imageUrl, acceptType]);

  // Propagate this node's value to the parent. `data` is intentionally NOT a
  // dependency: the parent recreates the node's `data` object on every
  // onDataChange, so depending on it re-ran this effect forever (the source of
  // the white-screen React #185 loop). A stable, key-order-independent compare
  // ensures we only emit when the content really changed.
  (0, _react.useEffect)(function () {
    var _data$onDataChange;
    var outputs, resultUrl;
    if (acceptType === "image") {
      resultUrl = formValues.image_url || null;
      outputs = [{
        type: "image_url",
        value: resultUrl
      }];
    } else if (acceptType === "video") {
      resultUrl = formValues.video_url || null;
      outputs = [{
        type: "video_url",
        value: resultUrl
      }];
    } else if (acceptType === "audio") {
      resultUrl = formValues.audio_url || null;
      outputs = [{
        type: "audio_url",
        value: resultUrl
      }];
    } else {
      resultUrl = formValues.prompt || "";
      outputs = [{
        type: "text",
        value: resultUrl
      }];
    }
    if ((0, _stableStringify.stableStringify)(prevFormValues.current) === (0, _stableStringify.stableStringify)(formValues)) return;
    prevFormValues.current = formValues;
    data === null || data === void 0 || (_data$onDataChange = data.onDataChange) === null || _data$onDataChange === void 0 || _data$onDataChange.call(data, id, {
      selectedModel: selectedModel,
      formValues: formValues,
      loading: loading,
      outputs: outputs,
      resultUrl: resultUrl
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formValues, selectedModel, loading, id, acceptType]);
  var hasFileUrl = displayFileUrl;
  var textareaRef = (0, _react.useRef)(null);

  // Референс-теги: если этот текст-нод кормит видео/изображение-ноду, к которой
  // подключён Персонаж, показываем кликабельный чип @Имя с миниатюрой лица.
  // Клик вставляет @Имя в промпт (как в Студии Креаторов).
  var rfEdges = (0, _reactflow.useStore)(function (s) {
    return s.edges;
  });
  var rfNodes = (0, _reactflow.useStore)(function (s) {
    return s.nodeInternals;
  });
  var characterTags = (0, _react.useMemo)(function () {
    if (uploadType !== "text") return [];
    var nodesArr = rfNodes ? Array.from(rfNodes.values()) : [];
    // Ноды, которые кормит этот текст-нод (его промпт).
    var fedTargets = rfEdges.filter(function (e) {
      return e.source === id;
    }).map(function (e) {
      return e.target;
    });
    var targetSet = new Set(fedTargets.filter(function (tid) {
      var n = nodesArr.find(function (nn) {
        return nn.id === tid;
      });
      return (n === null || n === void 0 ? void 0 : n.type) === "videoNode" || (n === null || n === void 0 ? void 0 : n.type) === "imageNode" || (n === null || n === void 0 ? void 0 : n.type) === "skylarkNode";
    }));
    if (!targetSet.size) return [];
    // Персонаж-ноды, подключённые к тем же целям.
    var charIds = new Set(rfEdges.filter(function (e) {
      return targetSet.has(e.target);
    }).map(function (e) {
      return e.source;
    }).filter(function (sid) {
      var _nodesArr$find;
      return ((_nodesArr$find = nodesArr.find(function (nn) {
        return nn.id === sid;
      })) === null || _nodesArr$find === void 0 ? void 0 : _nodesArr$find.type) === "characterNode";
    }));
    var isUrl = function isUrl(v) {
      return typeof v === "string" && v.length > 5 && (v.startsWith("http") || v.startsWith("data:image/")) && !v.startsWith("asset://");
    };
    var tags = [];
    var _iterator = _createForOfIteratorHelper(charIds),
      _step;
    try {
      var _loop = function _loop() {
        var _cnode$data;
        var cid = _step.value;
        var cnode = nodesArr.find(function (nn) {
          return nn.id === cid;
        });
        var fv = (cnode === null || cnode === void 0 || (_cnode$data = cnode.data) === null || _cnode$data === void 0 ? void 0 : _cnode$data.formValues) || {};
        var name = (fv.character_name || "лицо").trim();

        // Превью лица: фото персонажа, иначе любой пригодный URL из его полей.
        var thumb = (isUrl(fv.character_photo) ? fv.character_photo : null) || (isUrl(fv.face_thumbnail) ? fv.face_thumbnail : null) || (isUrl(fv.image_url) ? fv.image_url : null) || (isUrl(fv.face_asset) ? fv.face_asset : null);
        if (!thumb) {
          var _iterator2 = _createForOfIteratorHelper(targetSet),
            _step2;
          try {
            var _loop2 = function _loop2() {
                var _tnode$data;
                var tid = _step2.value;
                if (!rfEdges.some(function (e) {
                  return e.source === cid && e.target === tid;
                })) return 0; // continue
                var tnode = nodesArr.find(function (nn) {
                  return nn.id === tid;
                });
                var tt = tnode === null || tnode === void 0 || (_tnode$data = tnode.data) === null || _tnode$data === void 0 || (_tnode$data = _tnode$data.formValues) === null || _tnode$data === void 0 ? void 0 : _tnode$data.face_thumbnail;
                if (isUrl(tt)) {
                  thumb = tt;
                  return 1; // break
                }
              },
              _ret;
            for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
              _ret = _loop2();
              if (_ret === 0) continue;
              if (_ret === 1) break;
            }
          } catch (err) {
            _iterator2.e(err);
          } finally {
            _iterator2.f();
          }
        }
        tags.push({
          id: cid,
          name: name,
          thumb: thumb || null
        });
      };
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        _loop();
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }
    return tags;
  }, [rfEdges, rfNodes, id, uploadType]);

  // Image/video tags: если этот текст-нод кормит видео/изображение-ноду, к которой
  // подключен любая Image/Video/Character/Audio-нода, показываем кликабельные чипы с превью.
  var imageTags = (0, _react.useMemo)(function () {
    if (uploadType !== "text") return [];
    var nodesArr = rfNodes ? Array.from(rfNodes.values()) : [];
    var fedTargets = rfEdges.filter(function (e) {
      return e.source === id;
    }).map(function (e) {
      return e.target;
    });
    var targetSet = new Set(fedTargets.filter(function (tid) {
      var n = nodesArr.find(function (nn) {
        return nn.id === tid;
      });
      return (n === null || n === void 0 ? void 0 : n.type) === "videoNode" || (n === null || n === void 0 ? void 0 : n.type) === "imageNode" || (n === null || n === void 0 ? void 0 : n.type) === "skylarkNode";
    }));
    if (!targetSet.size) return [];
    var out = [];
    var seen = new Set();
    var counters = {
      images: 0,
      video: 0,
      audio: 0
    };
    var _iterator3 = _createForOfIteratorHelper(rfEdges),
      _step3;
    try {
      var _loop3 = function _loop3() {
          var _d$outputs$;
          var e = _step3.value;
          if (!targetSet.has(e.target) || e.source === id || seen.has(e.source)) return 0; // continue
          seen.add(e.source);
          var n = nodesArr.find(function (nn) {
            return nn.id === e.source;
          });
          if (!n) return 0; // continue
          var d = n.data || {};
          var fvN = d.formValues || {};
          var rawThumb = fvN.character_photo || d.thumbnail || d.previewUrl || d.resultUrl || Array.isArray(d.outputs) && ((_d$outputs$ = d.outputs[0]) === null || _d$outputs$ === void 0 ? void 0 : _d$outputs$.value) || fvN.image_url || fvN.video_url;
          var url = typeof rawThumb === "string" && !rawThumb.startsWith("asset://") && !rawThumb.startsWith("data:image/svg") ? rawThumb : undefined;
          if (n.type === "characterNode") {
            counters.images += 1;
            out.push({
              id: n.id,
              label: "\u56FE\u7247".concat(counters.images),
              kind: "character",
              url: url,
              name: (fvN.character_name || "角色").trim(),
              isVideo: false
            });
          } else if (n.type === "videoNode") {
            counters.video += 1;
            out.push({
              id: n.id,
              label: "\u89C6\u9891".concat(counters.video),
              kind: "video",
              url: url,
              isVideo: true
            });
          } else if (n.type === "audioNode") {
            counters.audio += 1;
            out.push({
              id: n.id,
              label: "\u97F3\u9891".concat(counters.audio),
              kind: "audio",
              url: url,
              isVideo: false
            });
          } else if (n.type === "imageNode") {
            counters.images += 1;
            out.push({
              id: n.id,
              label: "\u56FE\u7247".concat(counters.images),
              kind: "images",
              url: url,
              isVideo: false
            });
          }
        },
        _ret2;
      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
        _ret2 = _loop3();
        if (_ret2 === 0) continue;
      }
    } catch (err) {
      _iterator3.e(err);
    } finally {
      _iterator3.f();
    }
    return out;
  }, [rfEdges, rfNodes, id, uploadType]);
  var insertImageTag = function insertImageTag(tag) {
    var _ta$selectionStart, _ta$selectionEnd;
    var token = tag + " ";
    var ta = textareaRef.current;
    var cur = (formValues === null || formValues === void 0 ? void 0 : formValues.prompt) || "";
    if (!ta) {
      setFormValues(function (prev) {
        return _objectSpread(_objectSpread({}, prev), {}, {
          prompt: cur + token
        });
      });
      return;
    }
    var start = (_ta$selectionStart = ta.selectionStart) !== null && _ta$selectionStart !== void 0 ? _ta$selectionStart : cur.length;
    var end = (_ta$selectionEnd = ta.selectionEnd) !== null && _ta$selectionEnd !== void 0 ? _ta$selectionEnd : cur.length;
    var next = cur.slice(0, start) + token + cur.slice(end);
    setFormValues(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, {
        prompt: next
      });
    });
    requestAnimationFrame(function () {
      ta.focus();
      var pos = start + token.length;
      ta.setSelectionRange(pos, pos);
    });
  };
  var insertCharTag = function insertCharTag(name) {
    var _ta$selectionStart2, _ta$selectionEnd2;
    var token = "@" + String(name || "лицо").trim().replace(/\s+/g, "_") + " ";
    var ta = textareaRef.current;
    var cur = (formValues === null || formValues === void 0 ? void 0 : formValues.prompt) || "";
    if (!ta) {
      setFormValues(function (prev) {
        return _objectSpread(_objectSpread({}, prev), {}, {
          prompt: cur + token
        });
      });
      return;
    }
    var start = (_ta$selectionStart2 = ta.selectionStart) !== null && _ta$selectionStart2 !== void 0 ? _ta$selectionStart2 : cur.length;
    var end = (_ta$selectionEnd2 = ta.selectionEnd) !== null && _ta$selectionEnd2 !== void 0 ? _ta$selectionEnd2 : cur.length;
    var next = cur.slice(0, start) + token + cur.slice(end);
    setFormValues(function (prev) {
      return _objectSpread(_objectSpread({}, prev), {}, {
        prompt: next
      });
    });
    requestAnimationFrame(function () {
      ta.focus();
      var pos = start + token.length;
      ta.setSelectionRange(pos, pos);
    });
  };
  (0, _react.useEffect)(function () {
    var textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "0px";
      var scrollHeight = textarea.scrollHeight;
      textarea.style.height = "".concat(Math.max(scrollHeight, 240), "px");
    }
  }, [formValues === null || formValues === void 0 ? void 0 : formValues.prompt]);
  return /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col w-full flex-1 overflow-hidden rounded-b-2xl h-full"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center justify-center w-full h-full flex-1"
  }, uploadType === "text" ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col w-full h-full gap-1.5"
  }, imageTags.length > 0 && /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-wrap gap-1.5 nodrag"
  }, imageTags.map(function (t) {
    return /*#__PURE__*/_react["default"].createElement("button", {
      key: "".concat(t.id, "-").concat(t.label),
      type: "button",
      onMouseDown: function onMouseDown(e) {
        return e.stopPropagation();
      },
      onClick: function onClick() {
        return insertImageTag(t.label);
      },
      title: "\u0412\u0441\u0442\u0430\u0432\u0438\u0442\u044C ".concat(t.label, " \u0432 \u043F\u0440\u043E\u043C\u043F\u0442"),
      className: "flex items-center gap-1.5 pl-1 pr-2 py-0.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 transition-colors"
    }, t.url ? t.isVideo ? /*#__PURE__*/_react["default"].createElement("video", {
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
  })), /*#__PURE__*/_react["default"].createElement("textarea", {
    ref: textareaRef,
    className: "bg-transparent border border-gray-800 w-full h-full max-h-96 p-2 text-xs text-white resize-none overflow-y-auto custom-scrollbar",
    placeholder: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0442\u0435\u043A\u0441\u0442\u043E\u0432\u044B\u0439 \u043F\u0440\u043E\u043C\u043F\u0442 \u0437\u0434\u0435\u0441\u044C...",
    value: (formValues === null || formValues === void 0 ? void 0 : formValues.prompt) || "",
    onChange: handleTextChange
  })) : /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-center justify-center w-full h-full relative",
    onDragOver: handleDragOver,
    onDrop: handleDrop
  }, hasFileUrl ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex-1 w-full h-full group z-0"
  }, (acceptType === "video" ? displayFileUrl : formValues !== null && formValues !== void 0 ? formValues.video_url : void 0) ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "relative w-full h-full"
  }, /*#__PURE__*/_react["default"].createElement(_VideoPlayer["default"], {
    src: displayFileUrl,
    accentColor: "#f97316"
  })) : (acceptType === "image" ? displayFileUrl : formValues !== null && formValues !== void 0 ? formValues.image_url : void 0) ? /*#__PURE__*/_react["default"].createElement("div", {
    className: "relative w-full h-full group/image"
  }, /*#__PURE__*/_react["default"].createElement("img", {
    src: displayFileUrl,
    alt: "Uploaded",
    className: "w-full h-full object-contain"
  }), /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pointer-events-none flex flex-col justify-end"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col gap-0.5"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] text-white/50 uppercase tracking-tighter font-semibold"
  }, "\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435"), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs text-white font-medium tabular-nums"
  }, imageMetadata.width, " \xD7 ", imageMetadata.height)), imageMetadata.size && /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col items-end gap-0.5"
  }, /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[10px] text-white/50 uppercase tracking-tighter font-semibold"
  }, "\u0420\u0430\u0437\u043C\u0435\u0440 \u0444\u0430\u0439\u043B\u0430"), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs text-white font-medium tabular-nums"
  }, imageMetadata.size))))) : /*#__PURE__*/_react["default"].createElement("div", {
    className: "w-full h-full relative group/audio flex flex-col items-center justify-center"
  }, /*#__PURE__*/_react["default"].createElement(_AudioPlayer["default"], {
    nodeId: id,
    src: displayFileUrl,
    className: "flex flex-col items-center justify-center px-5 py-4 w-full h-full relative group transition-all duration-500 select-none bg-black/10 rounded-b-2xl"
  })), uploading && /*#__PURE__*/_react["default"].createElement("div", {
    className: "absolute inset-x-4 bottom-4 z-10 rounded-xl border border-cyan-400/20 bg-black/75 p-3 backdrop-blur-sm"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex items-center justify-between text-[10px] font-semibold text-cyan-200"
  }, /*#__PURE__*/_react["default"].createElement("span", null, "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430..."), /*#__PURE__*/_react["default"].createElement("span", null, uploadProgress, "%")), /*#__PURE__*/_react["default"].createElement("div", {
    className: "mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10"
  }, /*#__PURE__*/_react["default"].createElement("div", {
    className: "h-full rounded-full bg-cyan-400 transition-all duration-200",
    style: {
      width: "".concat(uploadProgress, "%")
    }
  }))), /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    suppressHydrationWarning: true,
    className: "text-white hover:text-red-500 bg-black/40 hover:bg-black cursor-pointer absolute left-4 top-4 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-all duration-300",
    onClick: removeData
  }, "\u2715")) : isMobileUploadUi ? /*#__PURE__*/_react["default"].createElement("div", {
    style: {
      minHeight: 200
    },
    className: "flex flex-col items-center justify-center gap-3 text-gray-400 border border-dashed border-gray-600 rounded-lg p-4 w-full flex-1 h-full"
  }, /*#__PURE__*/_react["default"].createElement(_fi.FiUpload, {
    size: 20
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs capitalize"
  }, "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C ", acceptType === "image" ? "изображение" : acceptType === "video" ? "видео" : "аудио"), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-[11px] text-gray-500 text-center"
  }, "\u041D\u0430 \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0432\u044B\u0431\u043E\u0440 \u0444\u0430\u0439\u043B\u0430 \u0438\u043B\u0438 \u043A\u0430\u043C\u0435\u0440\u0443. \u041F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u043D\u0438\u0435 \u043C\u043E\u0436\u043D\u043E \u043D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C."), /*#__PURE__*/_react["default"].createElement("div", {
    className: "flex flex-col sm:flex-row gap-2 w-full max-w-xs"
  }, /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    onClick: function onClick() {
      var _fileInputRef$current;
      return (_fileInputRef$current = fileInputRef.current) === null || _fileInputRef$current === void 0 ? void 0 : _fileInputRef$current.click();
    },
    className: "flex-1 min-h-11 px-4 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-colors"
  }, "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B"), acceptType === "image" && /*#__PURE__*/_react["default"].createElement("button", {
    type: "button",
    onClick: function onClick() {
      var _cameraInputRef$curre;
      return (_cameraInputRef$curre = cameraInputRef.current) === null || _cameraInputRef$curre === void 0 ? void 0 : _cameraInputRef$curre.click();
    },
    className: "flex-1 min-h-11 px-4 rounded-lg bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors"
  }, "\u041A\u0430\u043C\u0435\u0440\u0430")), /*#__PURE__*/_react["default"].createElement("input", {
    ref: fileInputRef,
    type: "file",
    accept: acceptAttr,
    className: "hidden",
    onChange: handleFileUpload
  }), acceptType === "image" && /*#__PURE__*/_react["default"].createElement("input", {
    ref: cameraInputRef,
    type: "file",
    accept: acceptAttr,
    capture: "environment",
    className: "hidden",
    onChange: handleFileUpload
  })) : /*#__PURE__*/_react["default"].createElement("label", {
    style: {
      minHeight: 200
    },
    className: "cursor-pointer flex flex-col items-center justify-center gap-2 text-gray-400 border border-dashed border-gray-600 rounded-lg p-4 w-full flex-1 hover:bg-gray-700/50 h-full"
  }, /*#__PURE__*/_react["default"].createElement(_fi.FiUpload, {
    size: 20
  }), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs capitalize"
  }, "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C ", acceptType === "image" ? "изображение" : acceptType === "video" ? "видео" : "аудио"), /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-xs text-gray-500"
  }, "\u041F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430: \u043F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u0444\u0430\u0439\u043B(\u044B) \u0441\u044E\u0434\u0430."), /*#__PURE__*/_react["default"].createElement("input", {
    type: "file",
    accept: acceptAttr,
    className: "hidden",
    onChange: handleFileUpload
  })))));
};
var _default = exports["default"] = UploadNode;
