"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _axios = _interopRequireDefault(require("axios"));
var _image = _interopRequireDefault(require("next/image"));
var _react = _interopRequireWildcard(require("react"));
var _fa = require("react-icons/fa6");
var _fi = require("react-icons/fi");
var _reactHotToast = require("react-hot-toast");
var _AudioPlayer = _interopRequireDefault(require("./AudioPlayer"));
var _io = require("react-icons/io5");
function _interopRequireWildcard(e, t) { if ("function" == typeof WeakMap) var r = new WeakMap(), n = new WeakMap(); return (_interopRequireWildcard = function _interopRequireWildcard(e, t) { if (!t && e && e.__esModule) return e; var o, i, f = { __proto__: null, "default": e }; if (null === e || "object" != _typeof(e) && "function" != typeof e) return f; if (o = t ? n : r) { if (o.has(e)) return o.get(e); o.set(e, f); } for (var _t in e) "default" !== _t && {}.hasOwnProperty.call(e, _t) && ((i = (o = Object.defineProperty) && Object.getOwnPropertyDescriptor(e, _t)) && (i.get || i.set) ? o(f, _t, i) : f[_t] = e[_t]); return f; })(e, t); }
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
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
var UI_TRANSLATIONS = {
  "Prompt": "Промпт",
  "Reference Images": "Референсные изображения",
  "Aspect Ratio": "Соотношение сторон",
  "Resolution": "Разрешение",
  "Routing": "Маршрутизация",
  "Size": "Размер",
  "Quality": "Качество",
  "Format": "Формат",
  "Background": "Фон",
  "Moderation": "Модерация",
  "default": "По умолчанию",
  "nitro": "Нитро",
  "floor": "Флор",
  "stable": "Стабильный",
  "auto": "Авто",
  "high": "Высокое",
  "medium": "Среднее",
  "low": "Низкое",
  "transparent": "Прозрачный",
  "opaque": "Непрозрачный",
  "Add a file or provide an URL": "Добавьте файл или укажите URL",
  "Unsupported file type": "Неподдерживаемый тип файла",
  "Upload failed": "Не удалось загрузить файл",
  "Upload failed.": "Не удалось загрузить файл",
  "Preview": "Предпросмотр",
  "* required": "* обязательно",
  "Remove input": "Удалить вход",
  "Set as input": "Сделать входом",
  "Select or type...": "Выберите или введите...",
  "No options found": "Ничего не найдено",
  "max items:": "макс. элементов:"
};
var translateUi = function translateUi(value) {
  if (typeof value !== "string") return value;
  return UI_TRANSLATIONS[value] || value;
};
var RenderField = function RenderField(_ref) {
  var _ref2, _formValues$fieldName;
  var fieldName = _ref.fieldName,
    meta = _ref.meta,
    idx = _ref.idx,
    formValues = _ref.formValues,
    setFormValues = _ref.setFormValues,
    handleChange = _ref.handleChange,
    data = _ref.data,
    modelName = _ref.modelName;
  var _useState = (0, _react.useState)(0),
    _useState2 = _slicedToArray(_useState, 2),
    uploadProgress = _useState2[0],
    setUploadProgress = _useState2[1];
  var _useState3 = (0, _react.useState)(-1),
    _useState4 = _slicedToArray(_useState3, 2),
    dropDown = _useState4[0],
    setDropDown = _useState4[1];
  var _useState5 = (0, _react.useState)(false),
    _useState6 = _slicedToArray(_useState5, 2),
    uploading = _useState6[0],
    setUploading = _useState6[1];
  var _useState7 = (0, _react.useState)(false),
    _useState8 = _slicedToArray(_useState7, 2),
    isOpeningUp = _useState8[0],
    setIsOpeningUp = _useState8[1];
  var _useState9 = (0, _react.useState)({}),
    _useState0 = _slicedToArray(_useState9, 2),
    dropdownStyle = _useState0[0],
    setDropdownStyle = _useState0[1];
  var _useState1 = (0, _react.useState)(false),
    _useState10 = _slicedToArray(_useState1, 2),
    isMobileUploadUi = _useState10[0],
    setIsMobileUploadUi = _useState10[1];
  var buttonRef = (0, _react.useRef)(null);
  var fileInputRef = (0, _react.useRef)(null);
  var cameraInputRef = (0, _react.useRef)(null);
  var isImageField = ['image', 'images_list'].includes(meta.field);
  var isVideoField = meta.field === 'video';
  var isAudioField = meta.field === 'audio';
  var value = (_ref2 = (_formValues$fieldName = formValues[fieldName]) !== null && _formValues$fieldName !== void 0 ? _formValues$fieldName : meta["default"]) !== null && _ref2 !== void 0 ? _ref2 : "";
  var isRequired = data.required && data.required.includes(fieldName);

  // Custom Character Preview for Video/Agent nodes
  var faceThumb = formValues.face_thumbnail || formValues.character_photo;
  if (fieldName === 'face_asset' && faceThumb) {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-2 mt-2"
    }, /*#__PURE__*/_react["default"].createElement("label", {
      className: "text-[10px] font-bold text-zinc-500 text-start px-1 mb-1 uppercase tracking-wider"
    }, "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436"), /*#__PURE__*/_react["default"].createElement("div", {
      className: "relative group/char-preview w-24 h-24 rounded-xl overflow-hidden border border-purple-500/30 bg-black shadow-lg shadow-purple-500/10"
    }, /*#__PURE__*/_react["default"].createElement("img", {
      src: faceThumb,
      alt: "Character",
      className: "w-full h-full object-cover"
    }), /*#__PURE__*/_react["default"].createElement("div", {
      className: "absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent pointer-events-none"
    }), /*#__PURE__*/_react["default"].createElement("div", {
      className: "absolute bottom-1 left-0 right-0 text-[8px] text-white font-bold text-center uppercase tracking-tighter"
    }, "\u0410\u043A\u0442\u0438\u0432\u0435\u043D"), /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      onClick: function onClick() {
        setFormValues(function (prev) {
          return _objectSpread(_objectSpread({}, prev), {}, {
            face_asset: null,
            face_thumbnail: null,
            character_photo: null
          });
        });
      },
      className: "absolute top-1.5 right-1.5 bg-black/80 hover:bg-black text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] opacity-0 group-hover/char-preview:opacity-100 transition-opacity z-10"
    }, "\xD7")));
  }
  if (fieldName === 'face_thumbnail' || fieldName === 'character_photo') return null;
  var label = /*#__PURE__*/_react["default"].createElement("label", {
    className: "text-[10px] font-bold text-zinc-500 text-start px-1 mb-1"
  }, translateUi(meta.title || fieldName), isRequired && /*#__PURE__*/_react["default"].createElement("span", {
    className: "text-blue-500 text-[9px] ml-1"
  }, "* \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E"));
  var handleDropdownToggle = function handleDropdownToggle(value) {
    setDropDown(function (prev) {
      return prev === value ? -1 : value;
    });
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
  (0, _react.useLayoutEffect)(function () {
    if (dropDown === idx + 1 && buttonRef.current) {
      var rect = buttonRef.current.getBoundingClientRect();
      var windowHeight = window.innerHeight;
      var spaceBelow = windowHeight - rect.bottom;
      setIsOpeningUp(spaceBelow < 200);
    }
  }, [dropDown, idx]);
  var handleFileUpload = function handleFileUpload(field, fieldSchema, e) {
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
    var isAcceptedType = isImageField ? file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif|avif|heic|heif)$/i.test(fileName) : isVideoField ? file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v)$/i.test(fileName) : isAudioField ? file.type.startsWith("audio/") || /\.(mp3|wav|webm|m4a|ogg)$/i.test(fileName) : file.type.startsWith("image/") || file.type.startsWith("video/");
    if (!isAcceptedType) {
      _reactHotToast.toast.error(translateUi("Unsupported file type"));
      return;
    }
    ;
    setUploading(true);
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
          var current = prev[field];
          var updatedValue = fieldSchema.type === 'array' ? [].concat(_toConsumableArray(current || []), [publicUrl]) : publicUrl;
          return _objectSpread(_objectSpread({}, prev), {}, _defineProperty({}, field, updatedValue));
        });
        setTimeout(function () {
          setUploading(false);
          setUploadProgress(0);
        }, 500);
      });
    })["catch"](function (error) {
      var _error$response;
      console.error("Upload failed", error);
      _reactHotToast.toast.error(translateUi("Upload failed."), error === null || error === void 0 || (_error$response = error.response) === null || _error$response === void 0 ? void 0 : _error$response.data);
      setUploading(false);
      setUploadProgress(0);
    });
  };
  var isInputModel = modelName.includes("passthrough");
  if (isInputModel && meta.type !== "boolean") return null;
  var fileAcceptAttr = isImageField ? "image/*,.heic,.heif" : isVideoField ? "video/*,.mov,.m4v" : isAudioField ? "audio/*,.m4a,.ogg" : "image/*,video/*,.heic,.heif,.mov,.m4v";
  if (meta["enum"]) {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-1 w-full"
    }, label, /*#__PURE__*/_react["default"].createElement("div", {
      tabIndex: 0,
      onBlur: function onBlur(e) {
        var currentTarget = e.currentTarget;
        setTimeout(function () {
          if (currentTarget && !currentTarget.contains(document.activeElement)) {
            setDropDown(-1);
          }
        }, 100);
      },
      className: "flex flex-col gap-1 relative w-full"
    }, /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      suppressHydrationWarning: true,
      ref: buttonRef,
      onClick: function onClick() {
        return handleDropdownToggle(idx + 1);
      },
      className: "flex items-center justify-between gap-1 text-xs text-center text-white w-full h-full cursor-pointer whitespace-nowrap px-3 py-1.5 bg-zinc-900 border border-white/10 hover:border-white/20 focus:outline-none rounded-lg transition-all"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2 truncate"
    }, /*#__PURE__*/_react["default"].createElement("span", {
      className: "truncate"
    }, translateUi(value))), /*#__PURE__*/_react["default"].createElement(_fa.FaAngleDown, {
      size: 14,
      className: "transition-all duration-300 ease-in-out text-zinc-400 group-hover:text-white ".concat(dropDown === idx + 1 ? "rotate-180" : "")
    })), /*#__PURE__*/_react["default"].createElement("div", {
      tabIndex: -1,
      style: dropdownStyle,
      className: "absolute left-0 ".concat(isOpeningUp ? "bottom-full mb-2" : "top-full mt-2", " border border-white/10 p-1 rounded-xl flex flex-col overflow-y-auto bg-zinc-900 shadow-2xl transition-all duration-200 w-full z-50 max-h-60 custom-scrollbar-thin ").concat(dropDown === idx + 1 ? "opacity-100 scale-100 visible translate-y-0" : "opacity-0 scale-95 invisible ".concat(isOpeningUp ? "translate-y-2" : "-translate-y-2"))
    }, meta["enum"].map(function (option, i) {
      return /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        suppressHydrationWarning: true,
        key: i,
        className: "flex items-center gap-2 px-3 py-2 text-xs cursor-pointer rounded-lg transition-all ".concat(formValues[fieldName] === option ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-[#2c3037] hover:text-white"),
        onClick: function onClick() {
          handleChange(fieldName, option);
          setDropDown(-1);
        }
      }, /*#__PURE__*/_react["default"].createElement("span", {
        className: "truncate"
      }, translateUi(option)), formValues[fieldName] === option && /*#__PURE__*/_react["default"].createElement("span", {
        className: "ml-auto text-blue-400 font-bold"
      }, "\u2713"));
    }))));
  }
  ;
  if (['image', 'video', 'audio'].includes(meta.field)) {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-2"
    }, label, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-1"
    }, /*#__PURE__*/_react["default"].createElement("input", {
      type: "text",
      value: formValues[fieldName] || '',
      readOnly: true
      // onChange={(e) => handleChange(fieldName, e.target.value)} 
      ,
      className: "bg-zinc-900 text-white text-xs py-2 px-3 rounded-lg border border-white/10 transition-all hover:border-white/20 w-full outline-none focus:border-blue-500/50",
      placeholder: translateUi("Add a file or provide an URL")
    })), uploading && /*#__PURE__*/_react["default"].createElement("div", {
      className: "w-full bg-gray-700/70 rounded h-1 overflow-hidden"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "bg-blue-500 h-full",
      style: {
        width: "".concat(uploadProgress, "%")
      }
    })), isMobileUploadUi && /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex flex-col sm:flex-row gap-2"
    }, /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      onClick: function onClick() {
        var _fileInputRef$current;
        return (_fileInputRef$current = fileInputRef.current) === null || _fileInputRef$current === void 0 ? void 0 : _fileInputRef$current.click();
      },
      className: "min-h-11 px-4 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/20 transition-colors"
    }, "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0444\u0430\u0439\u043B"), isImageField && /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      onClick: function onClick() {
        var _cameraInputRef$curre;
        return (_cameraInputRef$curre = cameraInputRef.current) === null || _cameraInputRef$curre === void 0 ? void 0 : _cameraInputRef$curre.click();
      },
      className: "min-h-11 px-4 rounded-lg bg-purple-500/15 border border-purple-400/30 text-purple-300 text-xs font-semibold hover:bg-purple-500/20 transition-colors"
    }, "\u041A\u0430\u043C\u0435\u0440\u0430"), /*#__PURE__*/_react["default"].createElement("input", {
      ref: fileInputRef,
      type: "file",
      accept: fileAcceptAttr,
      className: "hidden",
      disabled: uploading,
      onChange: function onChange(e) {
        return handleFileUpload(fieldName, meta, e);
      }
    }), isImageField && /*#__PURE__*/_react["default"].createElement("input", {
      ref: cameraInputRef,
      type: "file",
      accept: fileAcceptAttr,
      capture: "environment",
      className: "hidden",
      disabled: uploading,
      onChange: function onChange(e) {
        return handleFileUpload(fieldName, meta, e);
      }
    })), formValues[fieldName] && /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2 relative group overflow-hidden self-start w-full"
    }, meta.field === 'image' ? /*#__PURE__*/_react["default"].createElement("img", {
      src: formValues[fieldName],
      alt: translateUi("Preview"),
      className: "w-24 h-24 object-cover border border-white/10 rounded-xl shadow-lg",
      width: 0,
      height: 0
    }) : meta.field === 'video' ? /*#__PURE__*/_react["default"].createElement("video", {
      src: formValues[fieldName],
      className: "w-24 h-24 object-cover border border-white/10 rounded-xl shadow-lg"
    }) : meta.field === 'audio' && /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex flex-col w-full h-20 border border-white/10 rounded-xl overflow-hidden shadow-lg"
    }, /*#__PURE__*/_react["default"].createElement(_AudioPlayer["default"], {
      src: formValues[fieldName]
    })), /*#__PURE__*/_react["default"].createElement("button", {
      type: "button",
      suppressHydrationWarning: true,
      onClick: function onClick() {
        return handleChange(fieldName, '');
      },
      className: "text-gray-500 group-hover:text-red-600 group-hover:font-black cursor-pointer absolute top-2 left-2"
    }, "\u2715")));
  }
  ;
  if (meta.type === "array" || fieldName === "images_list") {
    var imageList = formValues[fieldName] || [];
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-1"
    }, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center justify-between"
    }, label, /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-[10px] text-gray-500"
    }, translateUi("max items:"), " ", imageList.length, "/", meta.maxItems)), /*#__PURE__*/_react["default"].createElement("div", {
      className: "grid grid-cols-3 gap-2"
    }, imageList.map(function (url, idx) {
      return /*#__PURE__*/_react["default"].createElement("div", {
        key: idx,
        className: "flex items-center gap-2 relative group overflow-hidden ".concat(['audios_list', 'audio_files'].includes(meta.field) ? 'col-span-full' : '')
      }, meta.field === 'images_list' ? /*#__PURE__*/_react["default"].createElement("img", {
        src: url,
        alt: translateUi("Preview"),
        className: "w-full h-full aspect-[1/1] object-cover border border-gray-500 rounded"
      }) : ['videos_list', 'video_files'].includes(meta.field) ? /*#__PURE__*/_react["default"].createElement("video", {
        src: url,
        className: "w-full h-full aspect-[1/1] object-cover border border-gray-500 rounded"
      }) : ['audios_list', 'audio_files'].includes(meta.field) && /*#__PURE__*/_react["default"].createElement("div", {
        className: "flex flex-col w-full h-20 border border-white/10 rounded-xl overflow-hidden shadow-lg"
      }, /*#__PURE__*/_react["default"].createElement(_AudioPlayer["default"], {
        src: url
      })), /*#__PURE__*/_react["default"].createElement("div", {
        className: "inset-0 group-hover:bg-gray-600/40 absolute rounded"
      }, /*#__PURE__*/_react["default"].createElement("button", {
        type: "button",
        suppressHydrationWarning: true,
        onClick: function onClick() {
          var updated = _toConsumableArray(imageList);
          updated.splice(idx, 1);
          handleChange(fieldName, updated);
        },
        className: "text-gray-500 group-hover:text-red-600 hover:font-bold cursor-pointer absolute top-2 left-2"
      }, "\u2715")));
    })));
  }
  ;
  if (meta.minValue !== undefined && meta.maxValue !== undefined) {
    var _ref3, _formValues$fieldName2, _ref4, _formValues$fieldName3;
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col w-full"
    }, label, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2 w-full"
    }, /*#__PURE__*/_react["default"].createElement("input", {
      type: "range",
      id: fieldName,
      min: meta.minValue,
      max: meta.maxValue,
      step: meta.step,
      value: (_ref3 = (_formValues$fieldName2 = formValues[fieldName]) !== null && _formValues$fieldName2 !== void 0 ? _formValues$fieldName2 : meta["default"]) !== null && _ref3 !== void 0 ? _ref3 : 0,
      onChange: function onChange(e) {
        return handleChange(fieldName, parseFloat(e.target.value));
      },
      className: "h-1.5 rounded-full cursor-pointer accent-blue-600 outline-none w-full bg-zinc-800"
    }), /*#__PURE__*/_react["default"].createElement("input", {
      type: "number",
      id: fieldName,
      min: meta.minValue,
      max: meta.maxValue,
      step: meta.step,
      value: (_ref4 = (_formValues$fieldName3 = formValues[fieldName]) !== null && _formValues$fieldName3 !== void 0 ? _formValues$fieldName3 : meta["default"]) !== null && _ref4 !== void 0 ? _ref4 : 0,
      readOnly: true
      // onChange={(e) => {
      //   const val = parseFloat(e.target.value) || meta.minValue;
      //   const clamped = Math.max(meta.minValue, Math.min(val, meta.maxValue));
      //   handleChange(fieldName, clamped);
      // }} 
      ,
      className: "w-12 h-8 text-center text-white rounded-lg border border-white/10 text-[10px] font-bold bg-zinc-900 outline-none focus:border-blue-500/50 transition-all"
    })));
  }
  ;
  if (meta.type === "int") {
    var _meta$minValue, _meta$maxValue, _meta$step, _formValues$fieldName4;
    var min = (_meta$minValue = meta.minValue) !== null && _meta$minValue !== void 0 ? _meta$minValue : 0;
    var max = (_meta$maxValue = meta.maxValue) !== null && _meta$maxValue !== void 0 ? _meta$maxValue : Number.MAX_SAFE_INTEGER;
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-1 w-full"
    }, /*#__PURE__*/_react["default"].createElement("label", {
      htmlFor: fieldName,
      className: "flex items-center gap-2 text-sm text-white font-medium relative"
    }, label, isRequired && /*#__PURE__*/_react["default"].createElement("span", {
      className: "text-blue-500 text-xs"
    }, "* \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E")), /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2 w-full"
    }, /*#__PURE__*/_react["default"].createElement("input", {
      type: "number",
      id: fieldName,
      min: min,
      max: max,
      step: (_meta$step = meta.step) !== null && _meta$step !== void 0 ? _meta$step : 1,
      value: (_formValues$fieldName4 = formValues[fieldName]) !== null && _formValues$fieldName4 !== void 0 ? _formValues$fieldName4 : "",
      onChange: function onChange(e) {
        var value = e.target.value;
        if (value === "") {
          handleChange(fieldName, "");
          return;
        }
        var num = Number(value);
        if (Number.isNaN(num)) return;
        num = Math.max(min, Math.min(num, max));
        handleChange(fieldName, num);
      },
      className: "w-full rounded-lg border border-white/10 px-3 py-2 text-white text-xs bg-zinc-900 hover:border-white/20 focus:border-blue-500/50 outline-none transition-all"
    })));
  }
  ;

  // if (meta.type === "int" || meta.type === "number") {
  //   return (
  //     <div key={fieldName} className="flex flex-col gap-1">
  //       {label}
  //       <input
  //         type="number"
  //         value={value}
  //         onChange={(e) => handleChange(fieldName, parseFloat(e.target.value))}
  //         placeholder={meta.description || ""}
  //         className="bg-[#1f2125] text-white text-xs p-1 rounded border border-gray-600 outline-none"
  //       />
  //     </div>
  //   );
  // };

  if (meta.format === 'text') {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-2 w-full"
    }, /*#__PURE__*/_react["default"].createElement("label", {
      htmlFor: fieldName,
      className: "flex items-center gap-2 text-sm font-medium relative"
    }, label), /*#__PURE__*/_react["default"].createElement("input", {
      type: "text",
      id: fieldName,
      value: value,
      placeholder: translateUi(meta.placeholder || ""),
      onChange: function onChange(e) {
        return handleChange(fieldName, e.target.value);
      },
      className: "bg-zinc-900 text-white text-xs py-2 px-3 rounded-lg border border-white/10 hover:border-white/20 transition-all w-full outline-none focus:border-blue-500/50"
    }));
  }
  ;
  if (meta.type === "boolean") {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col gap-2"
    }, label, /*#__PURE__*/_react["default"].createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/_react["default"].createElement("label", {
      htmlFor: "instrumental-".concat(fieldName),
      className: "flex items-center justify-between cursor-pointer select-none relative shrink-0"
    }, /*#__PURE__*/_react["default"].createElement("input", {
      type: "checkbox",
      id: "instrumental-".concat(fieldName),
      className: "sr-only peer",
      checked: !!formValues[fieldName],
      onChange: function onChange(e) {
        return handleChange(fieldName, e.target.checked);
      }
    }), /*#__PURE__*/_react["default"].createElement("span", {
      className: "flex items-center h-[20px] w-[36px] rounded-full p-1 duration-200 transition-all ".concat(!!formValues[fieldName] ? "bg-blue-600 shadow-lg shadow-blue-900/40" : "bg-zinc-800 border border-white/10")
    }, /*#__PURE__*/_react["default"].createElement("span", {
      className: "h-[12px] w-[12px] rounded-full bg-white duration-200 shadow-sm ".concat(!!formValues[fieldName] && "translate-x-[16px]")
    }))), /*#__PURE__*/_react["default"].createElement("p", {
      className: "text-xs text-white"
    }, translateUi(meta.description))));
  }
  ;
  if (meta.type === "string") {
    return /*#__PURE__*/_react["default"].createElement("div", {
      key: fieldName,
      className: "flex flex-col items-start gap-1"
    }, label, /*#__PURE__*/_react["default"].createElement("textarea", {
      value: value,
      readOnly: true
      // onChange={(e) => handleChange(fieldName, e.target.value)}
      ,
      placeholder: translateUi(meta.description || ""),
      className: "bg-zinc-900 text-white text-xs py-2 px-3 rounded-lg border border-white/10 hover:border-white/20 transition-all w-full outline-none focus:border-blue-500/50",
      rows: 6
    }));
  }
  ;
};
var _default = exports["default"] = RenderField;