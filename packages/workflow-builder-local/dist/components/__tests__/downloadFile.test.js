"use strict";

var _nodeTest = _interopRequireDefault(require("node:test"));
var _strict = _interopRequireDefault(require("node:assert/strict"));
var _promises = _interopRequireDefault(require("node:fs/promises"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { "default": e }; }
function _regenerator() { /*! regenerator-runtime -- Copyright (c) 2014-present, Facebook, Inc. -- license (MIT): https://github.com/babel/babel/blob/main/packages/babel-helpers/LICENSE */ var e, t, r = "function" == typeof Symbol ? Symbol : {}, n = r.iterator || "@@iterator", o = r.toStringTag || "@@toStringTag"; function i(r, n, o, i) { var c = n && n.prototype instanceof Generator ? n : Generator, u = Object.create(c.prototype); return _regeneratorDefine2(u, "_invoke", function (r, n, o) { var i, c, u, f = 0, p = o || [], y = !1, G = { p: 0, n: 0, v: e, a: d, f: d.bind(e, 4), d: function d(t, r) { return i = t, c = 0, u = e, G.n = r, a; } }; function d(r, n) { for (c = r, u = n, t = 0; !y && f && !o && t < p.length; t++) { var o, i = p[t], d = G.p, l = i[2]; r > 3 ? (o = l === n) && (u = i[(c = i[4]) ? 5 : (c = 3, 3)], i[4] = i[5] = e) : i[0] <= d && ((o = r < 2 && d < i[1]) ? (c = 0, G.v = n, G.n = i[1]) : d < l && (o = r < 3 || i[0] > n || n > l) && (i[4] = r, i[5] = n, G.n = l, c = 0)); } if (o || r > 1) return a; throw y = !0, n; } return function (o, p, l) { if (f > 1) throw TypeError("Generator is already running"); for (y && 1 === p && d(p, l), c = p, u = l; (t = c < 2 ? e : u) || !y;) { i || (c ? c < 3 ? (c > 1 && (G.n = -1), d(c, u)) : G.n = u : G.v = u); try { if (f = 2, i) { if (c || (o = "next"), t = i[o]) { if (!(t = t.call(i, u))) throw TypeError("iterator result is not an object"); if (!t.done) return t; u = t.value, c < 2 && (c = 0); } else 1 === c && (t = i["return"]) && t.call(i), c < 2 && (u = TypeError("The iterator does not provide a '" + o + "' method"), c = 1); i = e; } else if ((t = (y = G.n < 0) ? u : r.call(n, G)) !== a) break; } catch (t) { i = e, c = 1, u = t; } finally { f = 1; } } return { value: t, done: y }; }; }(r, o, i), !0), u; } var a = {}; function Generator() {} function GeneratorFunction() {} function GeneratorFunctionPrototype() {} t = Object.getPrototypeOf; var c = [][n] ? t(t([][n]())) : (_regeneratorDefine2(t = {}, n, function () { return this; }), t), u = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(c); function f(e) { return Object.setPrototypeOf ? Object.setPrototypeOf(e, GeneratorFunctionPrototype) : (e.__proto__ = GeneratorFunctionPrototype, _regeneratorDefine2(e, o, "GeneratorFunction")), e.prototype = Object.create(u), e; } return GeneratorFunction.prototype = GeneratorFunctionPrototype, _regeneratorDefine2(u, "constructor", GeneratorFunctionPrototype), _regeneratorDefine2(GeneratorFunctionPrototype, "constructor", GeneratorFunction), GeneratorFunction.displayName = "GeneratorFunction", _regeneratorDefine2(GeneratorFunctionPrototype, o, "GeneratorFunction"), _regeneratorDefine2(u), _regeneratorDefine2(u, o, "Generator"), _regeneratorDefine2(u, n, function () { return this; }), _regeneratorDefine2(u, "toString", function () { return "[object Generator]"; }), (_regenerator = function _regenerator() { return { w: i, m: f }; })(); }
function _regeneratorDefine2(e, r, n, t) { var i = Object.defineProperty; try { i({}, "", {}); } catch (e) { i = 0; } _regeneratorDefine2 = function _regeneratorDefine(e, r, n, t) { function o(r, n) { _regeneratorDefine2(e, r, function (e) { return this._invoke(r, n, e); }); } r ? i ? i(e, r, { value: n, enumerable: !t, configurable: !t, writable: !t }) : e[r] = n : (o("next", 0), o("throw", 1), o("return", 2)); }, _regeneratorDefine2(e, r, n, t); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
var modulePath = '/workspace/packages/workflow-builder-local/src/components/file/downloadFile.js';
function loadDownloadFileModule(_x) {
  return _loadDownloadFileModule.apply(this, arguments);
}
function _loadDownloadFileModule() {
  _loadDownloadFileModule = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee8(_ref) {
    var axiosDefault, toast, fetchImpl, windowObj, documentObj, consoleError, source, transformed, factory;
    return _regenerator().w(function (_context8) {
      while (1) switch (_context8.n) {
        case 0:
          axiosDefault = _ref.axiosDefault, toast = _ref.toast, fetchImpl = _ref.fetchImpl, windowObj = _ref.windowObj, documentObj = _ref.documentObj, consoleError = _ref.consoleError;
          _context8.n = 1;
          return _promises["default"].readFile(modulePath, 'utf8');
        case 1:
          source = _context8.v;
          transformed = source.replace('import axios from "axios";', '').replace('import { toast } from "react-hot-toast";', '').replace('export const downloadFile = async', 'const downloadFile = async');
          factory = new Function('axios', 'toast', 'fetch', 'window', 'document', 'console', 'Blob', "".concat(transformed, "\nreturn { downloadFile };"));
          return _context8.a(2, factory(axiosDefault, toast, fetchImpl, windowObj, documentObj, {
            error: consoleError !== null && consoleError !== void 0 ? consoleError : function () {}
          }, Blob).downloadFile);
      }
    }, _callee8);
  }));
  return _loadDownloadFileModule.apply(this, arguments);
}
(0, _nodeTest["default"])('downloadFile reports missing file url early', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee3() {
  var toastCalls, downloadFile;
  return _regenerator().w(function (_context3) {
    while (1) switch (_context3.n) {
      case 0:
        toastCalls = [];
        _context3.n = 1;
        return loadDownloadFileModule({
          axiosDefault: {
            post: function () {
              var _post = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee() {
                return _regenerator().w(function (_context) {
                  while (1) switch (_context.n) {
                    case 0:
                      throw new Error('axios should not be called');
                    case 1:
                      return _context.a(2);
                  }
                }, _callee);
              }));
              function post() {
                return _post.apply(this, arguments);
              }
              return post;
            }()
          },
          toast: {
            error: function error(message) {
              return toastCalls.push(message);
            }
          },
          fetchImpl: function () {
            var _fetchImpl = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee2() {
              return _regenerator().w(function (_context2) {
                while (1) switch (_context2.n) {
                  case 0:
                    throw new Error('fetch should not be called');
                  case 1:
                    return _context2.a(2);
                }
              }, _callee2);
            }));
            function fetchImpl() {
              return _fetchImpl.apply(this, arguments);
            }
            return fetchImpl;
          }(),
          windowObj: {
            URL: {
              createObjectURL: function createObjectURL() {},
              revokeObjectURL: function revokeObjectURL() {}
            }
          },
          documentObj: {
            body: {
              appendChild: function appendChild() {},
              removeChild: function removeChild() {}
            },
            createElement: function createElement() {
              return {
                click: function click() {}
              };
            }
          }
        });
      case 1:
        downloadFile = _context3.v;
        _context3.n = 2;
        return downloadFile();
      case 2:
        _strict["default"].deepStrictEqual(toastCalls, ['File URL not found']);
      case 3:
        return _context3.a(2);
    }
  }, _callee3);
})));
(0, _nodeTest["default"])('downloadFile fetches signed url and downloads blob', /*#__PURE__*/_asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee7() {
  var appended, removed, clicked, revoked, toastCalls, link, downloadFile;
  return _regenerator().w(function (_context7) {
    while (1) switch (_context7.n) {
      case 0:
        appended = [];
        removed = [];
        clicked = [];
        revoked = [];
        toastCalls = [];
        link = {
          href: '',
          download: '',
          click: function click() {
            clicked.push({
              href: this.href,
              download: this.download
            });
          }
        };
        _context7.n = 1;
        return loadDownloadFileModule({
          axiosDefault: {
            post: function () {
              var _post2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee4(url, body) {
                return _regenerator().w(function (_context4) {
                  while (1) switch (_context4.n) {
                    case 0:
                      _strict["default"].strictEqual(url, '/api/workflow/cloudfront-signed-url');
                      _strict["default"].deepStrictEqual(body, {
                        url: 'https://cdn.example.com/file.mp4'
                      });
                      return _context4.a(2, {
                        data: {
                          signed_url: 'https://signed.example.com/file.mp4'
                        }
                      });
                  }
                }, _callee4);
              }));
              function post(_x2, _x3) {
                return _post2.apply(this, arguments);
              }
              return post;
            }()
          },
          toast: {
            error: function error(message) {
              return toastCalls.push(message);
            }
          },
          fetchImpl: function () {
            var _fetchImpl2 = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee6(url, options) {
              return _regenerator().w(function (_context6) {
                while (1) switch (_context6.n) {
                  case 0:
                    _strict["default"].strictEqual(url, 'https://signed.example.com/file.mp4');
                    _strict["default"].deepStrictEqual(options, {
                      mode: 'cors'
                    });
                    return _context6.a(2, {
                      blob: function () {
                        var _blob = _asyncToGenerator(/*#__PURE__*/_regenerator().m(function _callee5() {
                          return _regenerator().w(function (_context5) {
                            while (1) switch (_context5.n) {
                              case 0:
                                return _context5.a(2, new Blob([new Uint8Array([1, 2, 3])], {
                                  type: 'video/mp4'
                                }));
                            }
                          }, _callee5);
                        }));
                        function blob() {
                          return _blob.apply(this, arguments);
                        }
                        return blob;
                      }()
                    });
                }
              }, _callee6);
            }));
            function fetchImpl(_x4, _x5) {
              return _fetchImpl2.apply(this, arguments);
            }
            return fetchImpl;
          }(),
          windowObj: {
            URL: {
              createObjectURL: function createObjectURL(blob) {
                _strict["default"].ok(blob instanceof Blob);
                return 'blob:test-url';
              },
              revokeObjectURL: function revokeObjectURL(url) {
                revoked.push(url);
              }
            }
          },
          documentObj: {
            body: {
              appendChild: function appendChild(node) {
                appended.push(node);
              },
              removeChild: function removeChild(node) {
                removed.push(node);
              }
            },
            createElement: function createElement(tag) {
              _strict["default"].strictEqual(tag, 'a');
              return link;
            }
          }
        });
      case 1:
        downloadFile = _context7.v;
        _context7.n = 2;
        return downloadFile('https://cdn.example.com/file.mp4', 'result.mp4');
      case 2:
        _strict["default"].strictEqual(appended.length, 1);
        _strict["default"].strictEqual(removed.length, 1);
        _strict["default"].deepStrictEqual(clicked, [{
          href: 'blob:test-url',
          download: 'result.mp4'
        }]);
        _strict["default"].deepStrictEqual(revoked, ['blob:test-url']);
        _strict["default"].deepStrictEqual(toastCalls, []);
      case 3:
        return _context7.a(2);
    }
  }, _callee7);
})));